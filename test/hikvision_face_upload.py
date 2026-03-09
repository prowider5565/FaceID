# #!/usr/bin/env python3
# import argparse
# import base64
# import datetime as dt
# import hashlib
# import json
# import random
# from collections import Counter
# from dataclasses import dataclass
# from typing import Optional, List, Dict, Any
# from urllib.parse import urlparse

# import requests

# DEFAULT_TIMEOUT_SECS = 8
# MAX_FACE_IMAGE_BYTES = 200 * 1024


# @dataclass
# class DeviceActionResult:
#     ok: bool
#     status_code: Optional[int]
#     status_string: Optional[str]
#     error_msg: Optional[str]


# @dataclass
# class DigestChallenge:
#     realm: str
#     nonce: str
#     qop: Optional[str]
#     opaque: Optional[str]
#     algorithm: Optional[str]


# class HikvisionClient:
#     def __init__(self, host: str, port: int, username: str, password: str, timeout: int = DEFAULT_TIMEOUT_SECS):
#         self.host = host
#         self.port = port
#         self.username = username
#         self.password = password
#         self.timeout = timeout
#         self.session = requests.Session()

#     def base_url(self) -> str:
#         return f"http://{self.host}:{self.port}"

#     @staticmethod
#     def parse_action_result(text: str) -> DeviceActionResult:
#         try:
#             data = json.loads(text)
#             status_code = data.get("statusCode")
#             status_string = data.get("statusString")
#             error_msg = data.get("errorMsg")
#             ok = (status_code == 1) or (status_string == "OK")
#             return DeviceActionResult(ok=ok, status_code=status_code, status_string=status_string, error_msg=error_msg)
#         except Exception:
#             return DeviceActionResult(
#                 ok=False,
#                 status_code=None,
#                 status_string="ParseError",
#                 error_msg=text,
#             )

#     @staticmethod
#     def _response_error(res: requests.Response) -> str:
#         reason = res.reason or ""
#         text = res.text or ""
#         if text.strip() == "":
#             return f"HTTP {res.status_code}: {reason}"
#         return f"HTTP {res.status_code}: {reason}: {text}"

#     @staticmethod
#     def _parse_digest_challenge(header_value: str) -> Optional[DigestChallenge]:
#         trimmed = header_value.strip()
#         if not trimmed.startswith("Digest"):
#             return None
#         rest = trimmed[len("Digest") :].strip()

#         parts = []
#         current = []
#         in_quotes = False
#         for ch in rest:
#             if ch == '"':
#                 in_quotes = not in_quotes
#                 current.append(ch)
#             elif ch == "," and not in_quotes:
#                 parts.append("".join(current).strip())
#                 current = []
#             else:
#                 current.append(ch)
#         tail = "".join(current).strip()
#         if tail:
#             parts.append(tail)

#         realm = None
#         nonce = None
#         qop = None
#         opaque = None
#         algorithm = None
#         for item in parts:
#             if "=" not in item:
#                 return None
#             key, value = item.split("=", 1)
#             key = key.strip()
#             value = value.strip()
#             if value.startswith('"') and value.endswith('"') and len(value) >= 2:
#                 value = value[1:-1]
#             if key == "realm":
#                 realm = value
#             elif key == "nonce":
#                 nonce = value
#             elif key == "qop":
#                 qop = value
#             elif key == "opaque":
#                 opaque = value
#             elif key == "algorithm":
#                 algorithm = value

#         if realm is None or nonce is None:
#             return None
#         return DigestChallenge(realm=realm, nonce=nonce, qop=qop, opaque=opaque, algorithm=algorithm)

#     @staticmethod
#     def _md5_hex(value: str) -> str:
#         return hashlib.md5(value.encode("utf-8")).hexdigest()

#     def _build_digest_authorization(self, method: str, url: str, challenge: DigestChallenge) -> str:
#         parsed = urlparse(url)
#         uri = parsed.path
#         if parsed.query:
#             uri = f"{uri}?{parsed.query}"

#         algorithm = challenge.algorithm or "MD5"
#         if algorithm.upper() != "MD5":
#             raise ValueError(f"Unsupported digest algorithm: {algorithm}")

#         ha1 = self._md5_hex(f"{self.username}:{challenge.realm}:{self.password}")
#         ha2 = self._md5_hex(f"{method}:{uri}")

#         qop_value = None
#         if challenge.qop:
#             for item in challenge.qop.split(","):
#                 candidate = item.strip()
#                 if candidate == "auth":
#                     qop_value = candidate
#                     break

#         if qop_value is not None:
#             nc = "00000001"
#             cnonce = format(random.getrandbits(64), "x")
#             response = self._md5_hex(f"{ha1}:{challenge.nonce}:{nc}:{cnonce}:{qop_value}:{ha2}")
#         else:
#             nc = None
#             cnonce = None
#             response = self._md5_hex(f"{ha1}:{challenge.nonce}:{ha2}")

#         header = (
#             f'Digest username="{self.username}", realm="{challenge.realm}", nonce="{challenge.nonce}", '
#             f'uri="{uri}", response="{response}"'
#         )
#         if challenge.opaque is not None:
#             header += f', opaque="{challenge.opaque}"'
#         header += ", algorithm=MD5"
#         if qop_value is not None and nc is not None and cnonce is not None:
#             header += f', qop={qop_value}, nc={nc}, cnonce="{cnonce}"'
#         return header

#     def _send_with_auth(
#         self,
#         method: str,
#         url: str,
#         body: Optional[bytes] = None,
#         content_type: Optional[str] = None,
#         multipart=None,
#     ) -> requests.Response:
#         if multipart is not None:
#             probe = self.session.request("GET", url, timeout=self.timeout)
#             if probe.status_code == 401:
#                 www = probe.headers.get("WWW-Authenticate", "")
#                 challenge = self._parse_digest_challenge(www)
#                 if challenge is not None:
#                     digest_header = self._build_digest_authorization(method, url, challenge)
#                     headers = {"Authorization": digest_header}
#                     res = self.session.request(method, url, headers=headers, files=multipart, timeout=self.timeout)
#                     if not res.ok:
#                         raise ValueError(f"HTTP {res.status_code}: {res.reason or ''}")
#                     return res

#             res = self.session.request(
#                 method,
#                 url,
#                 auth=(self.username, self.password),
#                 files=multipart,
#                 timeout=self.timeout,
#             )
#             if res.ok:
#                 return res
#             if res.status_code == 401:
#                 www = res.headers.get("WWW-Authenticate", "")
#                 raise ValueError(f"Unauthorized (no digest challenge). WWW-Authenticate: {www}")
#             raise ValueError(f"HTTP {res.status_code}: {res.reason or ''}")

#         headers = {}
#         if content_type is not None:
#             headers["Content-Type"] = content_type
#         first = self.session.request(method, url, data=body, headers=headers, timeout=self.timeout)
#         if first.ok:
#             return first

#         status = first.status_code
#         www = first.headers.get("WWW-Authenticate", "")
#         if status not in (401, 400, 403):
#             raise ValueError(self._response_error(first))

#         challenge = self._parse_digest_challenge(www)
#         if challenge is not None:
#             digest_header = self._build_digest_authorization(method, url, challenge)
#             headers2 = dict(headers)
#             headers2["Authorization"] = digest_header
#             second = self.session.request(method, url, data=body, headers=headers2, timeout=self.timeout)
#             if not second.ok:
#                 raise ValueError(self._response_error(second))
#             return second

#         second = self.session.request(
#             method,
#             url,
#             data=body,
#             headers=headers,
#             auth=(self.username, self.password),
#             timeout=self.timeout,
#         )
#         if second.ok:
#             return second

#         www2 = second.headers.get("WWW-Authenticate", "")
#         challenge2 = self._parse_digest_challenge(www2)
#         if challenge2 is not None:
#             digest_header = self._build_digest_authorization(method, url, challenge2)
#             headers3 = dict(headers)
#             headers3["Authorization"] = digest_header
#             third = self.session.request(method, url, data=body, headers=headers3, timeout=self.timeout)
#             if not third.ok:
#                 raise ValueError(self._response_error(third))
#             return third

#         if second.status_code == 401:
#             raise ValueError(f"Unauthorized (no digest challenge). WWW-Authenticate: {www2}")
#         raise ValueError(self._response_error(second))

#     def upload_face(self, employee_no: str, name: str, gender: str, image_base64: str) -> DeviceActionResult:
#         url = f"{self.base_url()}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json"
#         face_record = {
#             "faceLibType": "blackFD",
#             "FDID": "1",
#             "FPID": employee_no,
#             "name": name,
#             "gender": gender,
#         }

#         try:
#             image_bytes = base64.b64decode(image_base64, validate=True)
#         except Exception as exc:
#             return DeviceActionResult(
#                 ok=False,
#                 status_code=None,
#                 status_string="InvalidImage",
#                 error_msg=str(exc),
#             )

#         if len(image_bytes) > MAX_FACE_IMAGE_BYTES:
#             return DeviceActionResult(
#                 ok=False,
#                 status_code=None,
#                 status_string="ImageTooLarge",
#                 error_msg=f"Face image too large: {len(image_bytes)} bytes (max {MAX_FACE_IMAGE_BYTES} bytes)",
#             )

#         files = {
#             "FaceDataRecord": (None, json.dumps(face_record, separators=(",", ":"))),
#             "FaceImage": ("face.jpg", image_bytes, "image/jpeg"),
#         }

#         try:
#             res = self._send_with_auth("POST", url, multipart=files)
#             return self.parse_action_result(res.text or "")
#         except Exception as exc:
#             return DeviceActionResult(
#                 ok=False,
#                 status_code=None,
#                 status_string="UploadFailed",
#                 error_msg=str(exc),
#             )

#     def auth_request_json(self, method: str, url: str, body: Optional[dict] = None) -> str:
#         body_string = json.dumps(body, separators=(",", ":")) if body is not None else None
#         body_bytes = body_string.encode("utf-8") if body_string is not None else None
#         res = self._send_with_auth(
#             method=method,
#             url=url,
#             body=body_bytes,
#             content_type="application/json" if body_string is not None else None,
#         )
#         return res.text or ""

#     def get_isapi_json(self, path: str) -> dict:
#         clean = path.strip().lstrip("/")
#         suffix = "" if "?" in clean else "?format=json"
#         url = f"{self.base_url()}/{clean}{suffix}"
#         text = self.auth_request_json("GET", url, None)
#         return json.loads(text)

#     def get_user_by_employee_no_full(self, employee_no: str) -> Optional[dict]:
#         url = f"{self.base_url()}/ISAPI/AccessControl/UserInfo/Search?format=json"
#         payload = {
#             "UserInfoSearchCond": {
#                 "searchID": f"search-{int(dt.datetime.now().timestamp())}",
#                 "maxResults": 1,
#                 "searchResultPosition": 0,
#                 "EmployeeNoList": [{"employeeNo": employee_no}],
#             }
#         }
#         text = self.auth_request_json("POST", url, payload)
#         data = json.loads(text)
#         users = (
#             data.get("UserInfoSearch", {})
#             .get("UserInfo", [])
#         )
#         if not users:
#             return None
#         return users[0]

#     def search_users_page(self, offset: int, limit: int = 50) -> List[Dict[str, Any]]:
#         url = f"{self.base_url()}/ISAPI/AccessControl/UserInfo/Search?format=json"
#         payload = {
#             "UserInfoSearchCond": {
#                 "searchID": f"search-{int(dt.datetime.now().timestamp())}",
#                 "maxResults": limit,
#                 "searchResultPosition": offset,
#             }
#         }
#         text = self.auth_request_json("POST", url, payload)
#         data = json.loads(text)
#         return data.get("UserInfoSearch", {}).get("UserInfo", []) or []

#     def create_or_update_user(
#         self,
#         employee_no: str,
#         name: str,
#         gender: str,
#         begin_time: str,
#         end_time: str,
#         door_no: int,
#         plan_template_no: str,
#     ) -> DeviceActionResult:
#         payload = {
#             "UserInfo": {
#                 "employeeNo": employee_no,
#                 "name": name,
#                 "userType": "normal",
#                 "doorRight": str(door_no),
#                 "RightPlan": [{"doorNo": int(door_no), "planTemplateNo": str(plan_template_no)}],
#                 "Valid": {
#                     "enable": True,
#                     "beginTime": begin_time,
#                     "endTime": end_time,
#                     "timeType": "local",
#                 },
#                 "gender": gender,
#                 "localUIRight": False,
#                 "maxOpenDoorTime": 0,
#                 "userVerifyMode": "",
#             }
#         }
#         try:
#             # Create new user first (same as Rust).
#             create_url = f"{self.base_url()}/ISAPI/AccessControl/UserInfo/Record?format=json"
#             text = self.auth_request_json("POST", create_url, payload)
#             return self.parse_action_result(text)
#         except Exception as exc:
#             err = str(exc)
#             # If employee already exists, Hikvision requires Modify (PUT), not Record.
#             if "employeeNoAlreadyExist" in err:
#                 try:
#                     modify_url = f"{self.base_url()}/ISAPI/AccessControl/UserInfo/Modify?format=json"
#                     text2 = self.auth_request_json("PUT", modify_url, payload)
#                     result = self.parse_action_result(text2)
#                     # keep trace that we hit modify flow
#                     if result.error_msg:
#                         result.error_msg = f"[modified-existing-user] {result.error_msg}"
#                     else:
#                         result.error_msg = "[modified-existing-user]"
#                     return result
#                 except Exception as exc2:
#                     return DeviceActionResult(
#                         ok=False,
#                         status_code=None,
#                         status_string="RequestFailed",
#                         error_msg=f"{err}; modify_failed={exc2}",
#                     )

#             return DeviceActionResult(
#                 ok=False,
#                 status_code=None,
#                 status_string="RequestFailed",
#                 error_msg=err,
#             )

#     def fd_search(self, face_lib_type: str, fdid: str, fpid: Optional[str] = None, max_results: int = 10) -> dict:
#         url = f"{self.base_url()}/ISAPI/Intelligent/FDLib/FDSearch?format=json"
#         payload = {
#             "searchResultPosition": 0,
#             "maxResults": max_results,
#             "faceLibType": face_lib_type,
#             "FDID": fdid,
#         }
#         if fpid is not None and str(fpid).strip() != "":
#             payload["FPID"] = str(fpid)
#         text = self.auth_request_json("POST", url, payload)
#         return json.loads(text)


# def _parse_camera_time(value: Optional[str]) -> Optional[dt.datetime]:
#     if not value:
#         return None
#     raw = value.strip()
#     if raw.endswith("Z"):
#         raw = raw[:-1] + "+00:00"
#     try:
#         return dt.datetime.fromisoformat(raw)
#     except Exception:
#         pass
#     try:
#         return dt.datetime.strptime(value, "%Y-%m-%dT%H:%M:%S")
#     except Exception:
#         return None


# def _now_local_and_10y() -> tuple[str, str]:
#     now = dt.datetime.now()
#     begin = now.strftime("%Y-%m-%dT%H:%M:%S")
#     try:
#         end = now.replace(year=now.year + 10).strftime("%Y-%m-%dT%H:%M:%S")
#     except ValueError:
#         # Handle Feb 29 -> Feb 28 on non-leap target years.
#         end = now.replace(month=2, day=28, year=now.year + 10).strftime("%Y-%m-%dT%H:%M:%S")
#     return begin, end


# def _infer_plan_template_from_existing_users(client: HikvisionClient, door_no: int, max_scan_users: int = 300) -> Optional[str]:
#     templates = Counter()
#     scanned = 0
#     offset = 0
#     page_size = 50

#     while scanned < max_scan_users:
#         users = client.search_users_page(offset, page_size)
#         if not users:
#             break
#         for user in users:
#             scanned += 1
#             right_plan = user.get("RightPlan") or []
#             for item in right_plan:
#                 if not isinstance(item, dict):
#                     continue
#                 if str(item.get("doorNo")) != str(door_no):
#                     continue
#                 tpl = str(item.get("planTemplateNo") or "").strip()
#                 if tpl:
#                     templates[tpl] += 1
#             if scanned >= max_scan_users:
#                 break
#         if len(users) < page_size:
#             break
#         offset += page_size

#     if not templates:
#         return None
#     return templates.most_common(1)[0][0]


# def enroll_user_full(
#     client: HikvisionClient,
#     employee_no: str,
#     name: str,
#     gender: str,
#     image_path: str,
#     door_no: int,
#     plan_template_no: Optional[str],
#     fdid: str,
#     face_lib_type: str,
# ) -> int:
#     selected_template = plan_template_no
#     infer_error = None
#     if selected_template is None or selected_template.strip() == "":
#         try:
#             selected_template = _infer_plan_template_from_existing_users(client, door_no)
#         except Exception as exc:
#             infer_error = str(exc)
#     if selected_template is None or selected_template.strip() == "":
#         selected_template = "1"

#     begin_time, end_time = _now_local_and_10y()
#     user_create = client.create_or_update_user(
#         employee_no=employee_no,
#         name=name,
#         gender=gender,
#         begin_time=begin_time,
#         end_time=end_time,
#         door_no=door_no,
#         plan_template_no=selected_template,
#     )

#     with open(image_path, "rb") as f:
#         image_base64 = base64.b64encode(f.read()).decode("ascii")
#     face_upload = client.upload_face(
#         employee_no=employee_no,
#         name=name,
#         gender=gender,
#         image_base64=image_base64,
#     )

#     post_user = None
#     post_user_error = None
#     try:
#         post_user = client.get_user_by_employee_no_full(employee_no)
#     except Exception as exc:
#         post_user_error = str(exc)

#     fd_search_result = None
#     fd_search_error = None
#     try:
#         fd_search_result = client.fd_search(face_lib_type=face_lib_type, fdid=fdid, fpid=employee_no, max_results=10)
#     except Exception as exc:
#         fd_search_error = str(exc)

#     checks = []
#     if not user_create.ok:
#         checks.append("create_or_update_user failed")

#     if post_user is None:
#         checks.append("postcondition: user not readable after enrollment")
#     else:
#         num_of_face = post_user.get("numOfFace")
#         if not isinstance(num_of_face, int) or num_of_face <= 0:
#             checks.append("postcondition: numOfFace <= 0")

#         door_right = str(post_user.get("doorRight") or "")
#         doors = {x.strip() for x in door_right.split(",") if x.strip()}
#         if str(door_no) not in doors:
#             checks.append(f"postcondition: doorRight missing door {door_no}")

#         right_plan = post_user.get("RightPlan") or []
#         matched = False
#         for item in right_plan:
#             if not isinstance(item, dict):
#                 continue
#             if str(item.get("doorNo")) == str(door_no):
#                 plan = str(item.get("planTemplateNo") or "").strip()
#                 if plan != "":
#                     matched = True
#                     break
#         if not matched:
#             checks.append(f"postcondition: RightPlan missing non-empty planTemplateNo for door {door_no}")

#     fd_has_match = False
#     if fd_search_result is None:
#         checks.append("postcondition: FDSearch failed")
#     else:
#         total = fd_search_result.get("totalMatches")
#         fd_has_match = isinstance(total, int) and total > 0
#         if not fd_has_match:
#             checks.append("postcondition: FDSearch found no face record for FPID")

#     # Re-enrolling an existing face can return HTTP 400 on some firmware even when
#     # face + rights are already active. Treat as soft failure if postconditions hold.
#     post_has_face = isinstance((post_user or {}).get("numOfFace"), int) and (post_user or {}).get("numOfFace") > 0
#     if not face_upload.ok and not (post_has_face and fd_has_match):
#         checks.append("upload_face failed")

#     out = {
#         "ok": len(checks) == 0,
#         "input": {
#             "employeeNo": employee_no,
#             "name": name,
#             "gender": gender,
#             "doorNo": door_no,
#             "selectedPlanTemplateNo": selected_template,
#             "faceLibType": face_lib_type,
#             "FDID": fdid,
#         },
#         "inference": {
#             "planTemplateInferError": infer_error,
#             "planTemplateFallbackUsed": selected_template == "1" and plan_template_no in (None, ""),
#         },
#         "createUser": {
#             "ok": user_create.ok,
#             "statusCode": user_create.status_code,
#             "statusString": user_create.status_string,
#             "errorMsg": user_create.error_msg,
#         },
#         "faceUpload": {
#             "ok": face_upload.ok,
#             "statusCode": face_upload.status_code,
#             "statusString": face_upload.status_string,
#             "errorMsg": face_upload.error_msg,
#         },
#         "postUser": post_user,
#         "postUserError": post_user_error,
#         "fdSearch": fd_search_result,
#         "fdSearchError": fd_search_error,
#         "failedChecks": checks,
#     }
#     print(json.dumps(out, ensure_ascii=False, indent=2))
#     return 0 if len(checks) == 0 else 1


# def main() -> None:
#     parser = argparse.ArgumentParser(description="Hikvision face upload + permission diagnostics")
#     subparsers = parser.add_subparsers(dest="cmd", required=True)

#     upload = subparsers.add_parser("upload", help="Upload face (Rust-equivalent)")
#     upload.add_argument("--host", required=True)
#     upload.add_argument("--port", type=int, default=80)
#     upload.add_argument("--username", required=True)
#     upload.add_argument("--password", required=True)
#     upload.add_argument("--employee-no", required=True)
#     upload.add_argument("--name", required=True)
#     upload.add_argument("--gender", required=True)
#     upload.add_argument("--image-path", required=True, help="Path to JPEG/PNG file to upload")

#     diagnose = subparsers.add_parser("diagnose", help="Diagnose permission denied for a user")
#     diagnose.add_argument("--host", required=True)
#     diagnose.add_argument("--port", type=int, default=80)
#     diagnose.add_argument("--username", required=True)
#     diagnose.add_argument("--password", required=True)
#     diagnose.add_argument("--employee-no", required=True)
#     diagnose.add_argument("--door-no", type=int, default=1)

#     enroll = subparsers.add_parser("enroll", help="Create/update rights, upload face, verify postconditions")
#     enroll.add_argument("--host", required=True)
#     enroll.add_argument("--port", type=int, default=80)
#     enroll.add_argument("--username", required=True)
#     enroll.add_argument("--password", required=True)
#     enroll.add_argument("--employee-no", required=True)
#     enroll.add_argument("--name", required=True)
#     enroll.add_argument("--gender", required=True)
#     enroll.add_argument("--image-path", required=True)
#     enroll.add_argument("--door-no", type=int, default=1)
#     enroll.add_argument("--plan-template-no", default=None, help="If omitted, script infers from existing users on this door")
#     enroll.add_argument("--fdid", default="1")
#     enroll.add_argument("--face-lib-type", default="blackFD")

#     args = parser.parse_args()

#     client = HikvisionClient(host=args.host, port=args.port, username=args.username, password=args.password)

#     if args.cmd == "upload":
#         with open(args.image_path, "rb") as f:
#             image_base64 = base64.b64encode(f.read()).decode("ascii")
#         result = client.upload_face(
#             employee_no=args.employee_no,
#             name=args.name,
#             gender=args.gender,
#             image_base64=image_base64,
#         )
#         print(
#             json.dumps(
#                 {
#                     "ok": result.ok,
#                     "statusCode": result.status_code,
#                     "statusString": result.status_string,
#                     "errorMsg": result.error_msg,
#                 },
#                 ensure_ascii=False,
#             )
#         )
#         return

#     if args.cmd == "enroll":
#         raise SystemExit(
#             enroll_user_full(
#                 client=client,
#                 name=args.name,
#                 gender=args.gender,
#                 image_path=args.image_path,
#                 employee_no=args.employee_no,

#                 door_no=args.door_no,
#                 plan_template_no=args.plan_template_no,
#                 fdid=args.fdid,
#                 face_lib_type=args.face_lib_type,
#             )
#         )


# if __name__ == "__main__":
#     main()


#!/usr/bin/env python3
import argparse
import base64
import datetime as dt
import hashlib
import json
import random
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse

import requests

MAX_FACE_IMAGE_BYTES = 200 * 1024


@dataclass
class DeviceActionResult:
    ok: bool
    status_code: Optional[int]
    status_string: Optional[str]
    error_msg: Optional[str]


@dataclass
class DigestChallenge:
    realm: str
    nonce: str
    qop: Optional[str]
    opaque: Optional[str]
    algorithm: Optional[str]


class HikvisionClient:
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

        if len(image_bytes) > MAX_FACE_IMAGE_BYTES:
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", required=True)
    parser.add_argument("--port", type=int, default=80)
    parser.add_argument("--username", required=True)
    parser.add_argument("--password", required=True)
    parser.add_argument("--employee-no", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--gender", required=True)
    parser.add_argument("--image-path", required=True)
    parser.add_argument("--door-no", type=int, default=1)

    args = parser.parse_args()

    client = HikvisionClient(args.host, args.port, args.username, args.password)

    user = client.create_or_update_user(
        employee_no=args.employee_no,
        name=args.name,
        gender=args.gender,
        door_no=args.door_no,
    )

    with open(args.image_path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()

    face = client.upload_face(
        employee_no=args.employee_no,
        name=args.name,
        gender=args.gender,
        image_base64=image_b64,
    )

    print(
        json.dumps(
            {
                "userCreate": user.__dict__,
                "faceUpload": face.__dict__,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
