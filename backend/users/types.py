from enum import Enum


class Role(str, Enum):
    ADMIN = "Admin"
    EMPLOYEE = "Employee"
    MANAGER = "Manager"


class Shift(str, Enum):
    DAY = "Day"
    NIGHT = "Night"


class Gender(str, Enum):
    male = "male"
    female = "female"
    unknown = "unknown"
