from .client import HikvisionClient
import base64


def enroll_user_with_face(
    host: str,
    port: int,
    username: str,
    password: str,
    employee_no: str,
    name: str,
    gender: str,
    image_path: str,
    door_no: int = 1,
):
    client = HikvisionClient(host, port, username, password)

    user = client.create_or_update_user(
        employee_no=employee_no,
        name=name,
        gender=gender,
        door_no=door_no,
    )

    with open(image_path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()

    face = client.upload_face(
        employee_no=employee_no,
        name=name,
        gender=gender,
        image_base64=image_b64,
    )

    return {
        "userCreate": user.__dict__,
        "faceUpload": face.__dict__,
    }
