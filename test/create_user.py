import requests
from requests.auth import HTTPDigestAuth

BASE_URL = "http://192.168.100.55"
USERNAME = "admin"
PASSWORD = "Face1234"

employee_no = "11111"

user_payload = {
    "UserInfo": {
        "employeeNo": employee_no,
        "name": "Mateo Versace",
        "userType": "normal",
        "Valid": {
            "enable": True,
            "beginTime": "2026-01-01T00:00:00",
            "endTime": "2030-01-01T23:59:59"
        }
    }
}

r = requests.post(
    f"{BASE_URL}/ISAPI/AccessControl/UserInfo/Record?format=json",
    json=user_payload,
    auth=HTTPDigestAuth(USERNAME, PASSWORD),
    timeout=10
)

print("User create:", r.status_code, r.text)