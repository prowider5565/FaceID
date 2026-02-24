from ws.schema import FaceIDSchema


def build_message(payload: FaceIDSchema):
    employee_fullname = payload.AccessControllerEvent.name
    date = payload.dateTime
    return f"Xodim {employee_fullname} {date} vaqtda chiqib ketdi."
