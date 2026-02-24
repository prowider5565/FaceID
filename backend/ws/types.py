from enum import Enum


class EventType(str, Enum):
    ATTENDANCE = "Attendance"
    CAMERA_ENROLLMENT = "CameraEnrollment"


class DirectionType(str, Enum):
    CHECK_IN = "CheckIn"
    CHECK_OUT = "CheckOut"
