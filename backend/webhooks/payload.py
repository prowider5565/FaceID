import json
import re
from typing import Any


def _try_parse_json(text: str) -> Any | None:
    try:
        return json.loads(text)
    except Exception:
        return None


def _extract_boundary(content_type: str) -> str | None:
    # Supports: boundary=abc, boundary="abc", and extra params after boundary.
    match = re.search(r'boundary="?([^";]+)"?', content_type, flags=re.IGNORECASE)
    if not match:
        return None
    return match.group(1).strip()


def extract_webhook_payload(raw: bytes, content_type: str) -> Any | None:
    raw_text = raw.decode("utf-8", errors="ignore")

    # First fallback: if body itself is JSON, parse it regardless of Content-Type.
    parsed_raw = _try_parse_json(raw_text)
    if parsed_raw is not None:
        return parsed_raw

    boundary = _extract_boundary(content_type)
    if not boundary:
        return None

    boundary_bytes = boundary.encode()
    parts = raw.split(b"--" + boundary_bytes)

    for part in parts:
        if b"\r\n\r\n" not in part:
            continue

        _, body = part.split(b"\r\n\r\n", 1)
        body = body.strip(b"\r\n--")
        body_text = body.decode("utf-8", errors="ignore").strip()

        parsed = _try_parse_json(body_text)
        if parsed is not None:
            return parsed

        # Some devices prepend or append non-JSON bytes. Try extracting JSON object region.
        start = body_text.find("{")
        end = body_text.rfind("}")
        if start != -1 and end != -1 and end > start:
            sliced = body_text[start : end + 1]
            parsed_slice = _try_parse_json(sliced)
            if parsed_slice is not None:
                return parsed_slice

    return None
