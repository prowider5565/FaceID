from dataclasses import dataclass
from typing import Optional


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

