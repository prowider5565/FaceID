import base64
import datetime as dt
import hashlib
import json
import random
from urllib.parse import urlparse
import requests

from .schema import DeviceActionResult, DigestChallenge


class HikvisionClient:
    MAX_FACE_IMAGE_BYTES = 200 * 1024

    def __init__(self, host: str, port: int, username: str, password: str):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.session = requests.Session()

    def base_url(self):
        return f"http://{self.host}:{self.port}"

    @staticmethod
    def _md5_hex(value: str):
        return hashlib.md5(value.encode()).hexdigest()

    @staticmethod
    def parse_action_result(text: str):
        try:
            data = json.loads(text)
            return DeviceActionResult(
                ok=data.get("statusCode") == 1 or data.get("statusString") == "OK",
                status_code=data.get("statusCode"),
                status_string=data.get("statusString"),
                error_msg=data.get("errorMsg"),
            )
        except Exception:
            return DeviceActionResult(False, None, None, text)

    def _parse_digest(self, header):
        if not header.startswith("Digest"):
            return None
        parts = {}
        for item in header[len("Digest") :].split(","):
            if "=" not in item:
                continue
            k, v = item.strip().split("=", 1)
            parts[k] = v.strip('"')
        if "realm" not in parts or "nonce" not in parts:
            return None
        return DigestChallenge(
            realm=parts.get("realm"),
            nonce=parts.get("nonce"),
            qop=parts.get("qop"),
            opaque=parts.get("opaque"),
            algorithm=parts.get("algorithm"),
        )

    def _build_digest(self, method, url, ch):
        parsed = urlparse(url)
        uri = parsed.path

        ha1 = self._md5_hex(f"{self.username}:{ch.realm}:{self.password}")
        ha2 = self._md5_hex(f"{method}:{uri}")

        nc = "00000001"
        cnonce = format(random.getrandbits(64), "x")
        response = self._md5_hex(f"{ha1}:{ch.nonce}:{nc}:{cnonce}:auth:{ha2}")

        header = (
            f'Digest username="{self.username}", realm="{ch.realm}", nonce="{ch.nonce}", '
            f'uri="{uri}", response="{response}", algorithm=MD5, qop=auth, nc={nc}, cnonce="{cnonce}"'
        )
        if ch.opaque:
            header += f', opaque="{ch.opaque}"'
        return header

    def _request(self, method, url, **kwargs):
        r = self.session.request(method, url, **kwargs)
        if r.status_code != 401:
            return r

        challenge = self._parse_digest(r.headers.get("WWW-Authenticate", ""))
        if not challenge:
            raise RuntimeError("Authentication failed")

        auth = self._build_digest(method, url, challenge)
        headers = kwargs.get("headers", {})
        headers["Authorization"] = auth
        kwargs["headers"] = headers
        return self.session.request(method, url, **kwargs)

    def create_or_update_user(
        self,
        employee_no,
        name,
        gender,
        door_no,
        plan_template_no="1",
    ):
        begin = dt.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        end = (
            dt.datetime.now()
            .replace(year=dt.datetime.now().year + 10)
            .strftime("%Y-%m-%dT%H:%M:%S")
        )

        payload = {
            "UserInfo": {
                "employeeNo": employee_no,
                "name": name,
                "userType": "normal",
                "doorRight": str(door_no),
                "RightPlan": [{"doorNo": door_no, "planTemplateNo": plan_template_no}],
                "Valid": {
                    "enable": True,
                    "beginTime": begin,
                    "endTime": end,
                    "timeType": "local",
                },
                "gender": gender,
            }
        }

        url = f"{self.base_url()}/ISAPI/AccessControl/UserInfo/Record?format=json"

        r = self._request(
            "POST",
            url,
            headers={"Content-Type": "application/json"},
            data=json.dumps(payload),
        )

        return self.parse_action_result(r.text)

    def upload_face(self, employee_no, name, gender, image_base64):
        url = f"{self.base_url()}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json"

        image_bytes = base64.b64decode(image_base64)

        if len(image_bytes) > self.MAX_FACE_IMAGE_BYTES:
            raise ValueError("Image too large")

        face_record = {
            "faceLibType": "blackFD",
            "FDID": "1",
            "FPID": employee_no,
            "name": name,
            "gender": gender,
        }

        files = {
            "FaceDataRecord": (None, json.dumps(face_record)),
            "FaceImage": ("face.jpg", image_bytes, "image/jpeg"),
        }

        r = self._request("POST", url, files=files)
        return self.parse_action_result(r.text)
