from datetime import datetime

from common.pydantic_basemodel import BaseModel
from users.schemas import GetUser
from ws.types import DirectionType, EventType


class FaceRectSchema(BaseModel):
    height: float
    width: float
    x: float
    y: float


class AccessControllerEventSchema(BaseModel):
    deviceName: str
    majorEventType: int
    subEventType: int
    name: str
    cardReaderKind: int
    cardReaderNo: int
    doorNo: int
    verifyNo: int
    employeeNoString: str
    serialNo: int
    userType: str
    currentVerifyMode: str
    frontSerialNo: int
    attendanceStatus: str
    label: str
    statusValue: int
    mask: str
    helmet: str
    picturesNumber: int
    purePwdVerifyEnable: bool
    FaceRect: FaceRectSchema


class FaceIDSchema(BaseModel):
    ipAddress: str
    portNo: int
    protocol: str
    macAddress: str
    channelID: int
    dateTime: datetime
    activePostCount: int
    eventType: str
    eventState: str
    eventDescription: str
    deviceID: str
    AccessControllerEvent: AccessControllerEventSchema


class AttendanceEventDataSchema(BaseModel):
    user: GetUser | None
    attendance_date: datetime | None
    direction: DirectionType


class WebhookAttendanceResponseSchema(BaseModel):
    event_type: EventType
    data: AttendanceEventDataSchema


class CameraEnrollmentDataSchema(BaseModel):
    ip_address: str
    device_name: str


class WebhookCameraEnrollmentResponseSchema(BaseModel):
    event_type: EventType
    data: CameraEnrollmentDataSchema


FACE_ID_EXAMPLE_PAYLOAD = {
    "ipAddress": "192.168.100.55",
    "portNo": 8000,
    "protocol": "HTTP",
    "macAddress": "e0:ca:3c:fc:a7:ce",
    "channelID": 1,
    "dateTime": "2026-02-24T19:45:13+08:00",
    "activePostCount": 1,
    "eventType": "AccessControllerEvent",
    "eventState": "active",
    "eventDescription": "Access Controller Event",
    "deviceID": "Default",
    "AccessControllerEvent": {
        "deviceName": "Access Controller",
        "majorEventType": 5,
        "subEventType": 75,
        "name": "Mateo Versace",
        "cardReaderKind": 1,
        "cardReaderNo": 1,
        "doorNo": 1,
        "verifyNo": 136,
        "employeeNoString": "123123123",
        "serialNo": 1199,
        "userType": "normal",
        "currentVerifyMode": "face",
        "frontSerialNo": 1198,
        "attendanceStatus": "undefined",
        "label": "",
        "statusValue": 0,
        "mask": "unknown",
        "helmet": "unknown",
        "picturesNumber": 1,
        "purePwdVerifyEnable": True,
        "FaceRect": {"height": 0.304, "width": 0.171, "x": 0.369, "y": 0.68},
    },
}
