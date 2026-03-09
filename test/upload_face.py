import argparse
import base64
import json
import sys
from typing import Any, Dict, Optional, Tuple

import requests
from requests.auth import HTTPBasicAuth, HTTPDigestAuth


MAX_FACE_IMAGE_BYTES = 200 * 1024


def _parse_action_result(text: str) -> Dict[str, Any]:
    try:
        data = json.loads(text)
        status_code = data.get("statusCode")
        status_string = data.get("statusString")
        error_msg = data.get("errorMsg")
        ok = status_code == 1 or status_string == "OK"
        return {
            "ok": bool(ok),
            "status_code": status_code,
            "status_string": status_string,
            "error_msg": error_msg,
            "raw": data,
        }
    except Exception:
        return {
            "ok": False,
            "status_code": None,
            "status_string": "ParseError",
            "error_msg": text,
            "raw": None,
        }


def _looks_like_digest(www_authenticate: Optional[str]) -> bool:
    if not www_authenticate:
        return False
    return www_authenticate.strip().lower().startswith("digest")


def _upload_face_multipart(
    *,
    base_url: str,
    username: str,
    password: str,
    employee_no: str,
    name: str,
    gender: str,
    image_bytes: bytes,
    timeout_secs: int,
    verify_tls: bool,
) -> Tuple[int, str, Dict[str, Any]]:
    url = f"{base_url}/ISAPI/Intelligent/FDLib/FaceDataRecord?format=json"

    face_record = {
        "faceLibType": "whiteFD",
        "FDID": "1",
        "FPID": employee_no,
        "name": name,
        "gender": gender,
    }

    data = {
        "FaceDataRecord": json.dumps(face_record),
    }
    files = {
        "FaceImage": ("face.jpg", image_bytes, "image/jpeg"),
    }

    session = requests.Session()

    # Mirrors Rust src-tauri logic for multipart:
    # - probe unauth GET to same endpoint to see if we get a Digest challenge
    # - if we do, POST with Digest auth
    # - else POST with Basic auth
    try:
        probe = session.get(url, timeout=timeout_secs, verify=verify_tls)
    except requests.RequestException as e:
        return 0, f"ProbeFailed: {e}", {"ok": False, "error": str(e)}

    www = probe.headers.get("WWW-Authenticate")
    if probe.status_code == 401 and _looks_like_digest(www):
        auth = HTTPDigestAuth(username, password)
        try:
            res = session.post(
                url,
                data=data,
                files=files,
                auth=auth,
                timeout=timeout_secs,
                verify=verify_tls,
            )
        except requests.RequestException as e:
            return 0, f"UploadFailed: {e}", {"ok": False, "error": str(e)}
        return res.status_code, res.text, _parse_action_result(res.text)

    auth = HTTPBasicAuth(username, password)
    try:
        res = session.post(
            url,
            data=data,
            files=files,
            auth=auth,
            timeout=timeout_secs,
            verify=verify_tls,
        )
    except requests.RequestException as e:
        return 0, f"UploadFailed: {e}", {"ok": False, "error": str(e)}

    if res.status_code == 401 and _looks_like_digest(res.headers.get("WWW-Authenticate")):
        auth = HTTPDigestAuth(username, password)
        try:
            res = session.post(
                url,
                data=data,
                files=files,
                auth=auth,
                timeout=timeout_secs,
                verify=verify_tls,
            )
        except requests.RequestException as e:
            return 0, f"UploadFailed: {e}", {"ok": False, "error": str(e)}

    return res.status_code, res.text, _parse_action_result(res.text)


def _load_image_bytes(args: argparse.Namespace) -> bytes:
    if args.image_file:
        with open(args.image_file, "rb") as f:
            return f.read()
    if args.image_base64:
        try:
            return base64.b64decode(args.image_base64, validate=True)
        except Exception as e:
            raise SystemExit(f"InvalidImage: {e}")
    raise SystemExit("You must provide --image-file or --image-base64")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--host", default="192.168.100.55")
    p.add_argument("--scheme", default="https", choices=["http", "https"])
    p.add_argument("--port", type=int)
    p.add_argument("--username", default="admin")
    p.add_argument("--password", default="Face1234")
    p.add_argument("--employee-no", required=True)
    p.add_argument("--name", required=True)
    p.add_argument("--gender", required=True)
    p.add_argument("--image-file", default="face.jpg")
    p.add_argument("--image-base64")
    p.add_argument("--timeout-secs", type=int, default=8)
    p.add_argument("--verify-tls", dest="verify_tls", action="store_true")
    p.add_argument("--no-verify-tls", dest="verify_tls", action="store_false")
    p.set_defaults(verify_tls=False)

    args = p.parse_args()

    image_bytes = _load_image_bytes(args)
    if len(image_bytes) > MAX_FACE_IMAGE_BYTES:
        print(
            json.dumps(
                {
                    "ok": False,
                    "status_string": "ImageTooLarge",
                    "error_msg": f"Face image too large: {len(image_bytes)} bytes (max {MAX_FACE_IMAGE_BYTES} bytes)",
                },
                indent=2,
            )
        )
        return 2

    if args.port is None:
        base_url = f"{args.scheme}://{args.host}"
    else:
        base_url = f"{args.scheme}://{args.host}:{args.port}"

    status, text, parsed = _upload_face_multipart(
        base_url=base_url,
        username=args.username,
        password=args.password,
        employee_no=args.employee_no,
        name=args.name,
        gender=args.gender,
        image_bytes=image_bytes,
        timeout_secs=args.timeout_secs,
        verify_tls=args.verify_tls,
    )

    out: Dict[str, Any] = {
        "http_status": status,
        "result": parsed,
    }
    if not parsed.get("ok"):
        out["response_text"] = text

    print(json.dumps(out, indent=2))
    return 0 if parsed.get("ok") else 1


if __name__ == "__main__":
    sys.exit(main())
