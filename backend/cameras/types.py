from enum import Enum


class CameraStatus(str, Enum):
    ONLINE = "Online"
    OFFLINE = "Offline"


class CameraPosition(str, Enum):
    CHECK_IN = "CheckIn"
    ALL = "All"
    CHECK_OUT = "CheckOut"
