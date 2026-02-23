from fastapi import FastAPI, Request
import json
import re

app = FastAPI()


@app.post("/webhook")
async def webhook(request: Request):
    raw = await request.body()

    print("=== RAW BYTES ===")
    print(raw)

    content_type = request.headers.get("content-type", "")
    print("Content-Type:", content_type)

    # Extract boundary
    match = re.search(r"boundary=(.+)", content_type)
    if not match:
        print("No boundary found")
        return {"ok": False}

    boundary = match.group(1).encode()
    parts = raw.split(b"--" + boundary)

    for part in parts:
        if b"AccessControllerEvent" in part:
            # Split headers and body
            _, body = part.split(b"\r\n\r\n", 1)
            body = body.strip(b"\r\n--")

            try:
                decoded = json.loads(body.decode("utf-8"))
                print("=== DECODED JSON ===")
                print(json.dumps(decoded, indent=2))
            except Exception as e:
                print("JSON decode failed:", e)
                print(body)

    return {"ok": True}


{
    "ipAddress": "192.168.100.55",
    "portNo": 8000,
    "protocol": "HTTP",
    "macAddress": "e0:ca:3c:fc:a7:ce",
    "channelID": 1,
    "dateTime": "2026-02-23T19:34:21+08:00",
    "activePostCount": 1,
    "eventType": "AccessControllerEvent",
    "eventState": "active",
    "eventDescription": "Access Controller Event",
    "deviceID": "Default",
    "AccessControllerEvent": {
        "deviceName": "Access Controller",
        "majorEventType": 5,
        "subEventType": 21,
        "cardReaderKind": 1,
        "doorNo": 1,
        "serialNo": 1187,
        "currentVerifyMode": "invalid",
        "frontSerialNo": 1186,
        "attendanceStatus": "undefined",
        "label": "",
        "statusValue": 0,
        "mask": "unknown",
        "helmet": "unknown",
        "purePwdVerifyEnable": True,
    },
}
