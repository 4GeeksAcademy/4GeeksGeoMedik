from flask import request, jsonify, Blueprint, current_app
from api.models import db, Client, Doctor, Appointment, Availability, Notification
from api.utils import APIException
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError, SQLAlchemyError


api = Blueprint('api', __name__)

CORS(api)

def crear_notificacion(
    usuario_id,
    usuario_tipo,
    tipo,
    mensaje,
    appointment_id=None 
):
    notification = Notification(
        usuario_id=usuario_id,
        usuario_tipo=usuario_tipo,
        tipo=tipo,
        mensaje=mensaje,
        appointment_id=appointment_id
    )

    db.session.add(notification)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    return jsonify({
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }), 200


@api.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    role = get_jwt()["role"]

    if role == "client":
        client = Client.query.get(user_id)
        if client is None:
            return jsonify({"message": "Client not found"}), 404
        return jsonify({
            "message": "User retrieved",
            "role": "client",
            "user": client.serialize()
        }), 200

    if role == "doctor":
        doctor = Doctor.query.get(user_id)
        if doctor is None:
            return jsonify({"message": "Doctor not found"}), 404
        return jsonify({
            "message": "User retrieved",
            "role": "doctor",
            "user": doctor.serialize()
        }), 200

    return jsonify({"message": "Invalid role"}), 403

@api.route("/signup/client", methods=["POST"])
def signup_client():
    body = request.get_json(silent=True)
    if not body:
        return jsonify({"message": "Body is required"}), 400

    required_fields = ["name", "email", "password", "phone_number", "address"]
    clean_data = {
        field: str(body.get(field, "")).strip()
        for field in required_fields
    }

    for field in required_fields:
        if not clean_data[field]:
            return jsonify({"message": f"{field} is required"}), 400

    email = clean_data["email"].lower()
    password = clean_data["password"]

    if len(password) < 6:
        return jsonify({"message": "Password must have at least 6 characters"}), 400

    if Client.query.filter_by(email=email).first():
        return jsonify({"message": "Client already exists"}), 409

    new_client = Client(
        name=clean_data["name"],
        email=email,
        password=generate_password_hash(password),
        phone_number=clean_data["phone_number"],
        address=clean_data["address"]
    )

    try:
        db.session.add(new_client)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Client already exists"}), 409
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Database error while creating client")
        return jsonify({"message": "Could not create client"}), 500

    return jsonify({
        "message": "Client created successfully",
        "client": new_client.serialize()
    }), 201


@api.route("/signup/doctor", methods=["POST"])
def signup_doctor():
    body = request.get_json()
    if body is None:
        return jsonify({"message": "Body is required"}), 400

    required_fields = ["name", "email", "password", "phone_number", "address", "specialty", "credentials", "id_number"]
    for field in required_fields:
        if not body.get(field):
            return jsonify({"message": f"{field} is required"}), 400

    if Doctor.query.filter_by(email=body["email"]).first():
        return jsonify({"message": "Doctor already exists"}), 400

    new_doctor = Doctor(
        name=body["name"],
        email=body["email"],
        password=generate_password_hash(body["password"]),
        phone_number=body["phone_number"],
        address=body["address"],
        specialty=body["specialty"],
        credentials=body["credentials"],
        id_number=body["id_number"],
        picture_url=body.get("picture_url"),
    )

    db.session.add(new_doctor)
    db.session.commit()

    return jsonify({
        "message": "Doctor created successfully",
        "doctor": new_doctor.serialize()
    }), 201


@api.route("/login/client", methods=["POST"])
def login_client():
    body = request.get_json()
    if body is None:
        return jsonify({"message": "Body is required"}), 400

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    client = Client.query.filter_by(email=email).first()
    if client is None:
        return jsonify({"message": "Client not found"}), 404

    if not check_password_hash(client.password, password):
        return jsonify({"message": "Invalid password"}), 401

    access_token = create_access_token(identity=str(client.id), additional_claims={"role": "client"})

    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "client": client.serialize()
    }), 200


@api.route("/login/doctor", methods=["POST"])
def login_doctor():
    body = request.get_json()
    if body is None:
        return jsonify({"message": "Body is required"}), 400

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    doctor = Doctor.query.filter_by(email=email).first()
    if doctor is None:
        return jsonify({"message": "Doctor not found"}), 404

    if not check_password_hash(doctor.password, password):
        return jsonify({"message": "Invalid password"}), 401

    access_token = create_access_token(identity=str(doctor.id), additional_claims={"role": "doctor"})

    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "doctor": doctor.serialize()
    }), 200


@api.route("/appointments", methods=["POST"])
@jwt_required()
def create_appointment():
    body = request.get_json()
    if body is None:
        return jsonify({"message": "Body is required"}), 400

    for field in ["doctor_id", "date_time"]:
        if not body.get(field):
            return jsonify({"message": f"{field} is required"}), 400

    client_id = int(get_jwt_identity())
    if get_jwt()["role"] != "client":
        return jsonify({"message": "Only clients can create appointments"}), 403
    client = Client.query.get(client_id)
    if client is None:
        return jsonify({"message": "Client not found"}), 404

    doctor = Doctor.query.get(body["doctor_id"])
    if doctor is None:
        return jsonify({"message": "Doctor not found"}), 404

    try:
        date_obj = datetime.fromisoformat(body["date_time"].replace('Z', '+00:00'))
    except:
        return jsonify({"message": "Invalid date_time format. Use ISO format"}), 400

    date = date_obj.date()
    time_obj = date_obj.time()
    day = date.weekday()

    availability = Availability.query.filter_by(doctor_id=doctor.id, day=day).first()
    if availability is None:
        return jsonify({"message": "Doctor not available on this day"}), 400

    if not (availability.time_start <= time_obj <= availability.time_end):
        return jsonify({"message": "Appointment time not within doctor's availability"}), 400

    existing = Appointment.query.filter(
        Appointment.doctor_id == body["doctor_id"],
        db.func.date(Appointment.date_time) == date,
        Appointment.status.in_(["agendada", "pendiente", "confirmada"])
    ).first()

    if existing:
        return jsonify({"message": "Time slot already booked for this doctor"}), 409

    new_appointment = Appointment(
        client_id=client_id,
        doctor_id=body["doctor_id"],
        date_time=date_obj,
        status="agendada"
    )

    db.session.add(new_appointment)

    try:
        db.session.flush()

        appointment_date = date_obj.strftime("%d/%m/%Y")
        appointment_time = date_obj.strftime("%H:%M")

        message = (
            f"Nueva cita agendada por {client.name} "
            f"el {appointment_date} a las {appointment_time}"
        )

        crear_notificacion(
            usuario_id=doctor.id,
            usuario_tipo="doctor",
            tipo="nueva_cita",
            mensaje=message,
            appointment_id=new_appointment.id
        )

        db.session.commit()
    
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Database error: {str(e)}"}), 500

    return jsonify({
        "message": "Appointment created successfully",
        "appointment": new_appointment.serialize()
    }), 201


@api.route("/appointments", methods=["GET"])
@jwt_required()
def get_appointments():
    user_id = int(get_jwt_identity())
    role = get_jwt()["role"]

    query = Appointment.query

    if role == "client":
        query = query.filter_by(client_id=user_id)
    elif role == "doctor":
        query = query.filter_by(doctor_id=user_id)
    else:
        return jsonify({"message": "Invalid role"}), 403

    estado = request.args.get("estado")
    if estado:
        query = query.filter(Appointment.status == estado)

    fecha_desde = request.args.get("fecha_desde")
    if fecha_desde:
        try:
            dt_desde = datetime.fromisoformat(fecha_desde)
            query = query.filter(Appointment.date_time >= dt_desde)
        except:
            return jsonify({"message": "Invalid fecha_desde format. Use ISO format"}), 400

    fecha_hasta = request.args.get("fecha_hasta")
    if fecha_hasta:
        try:
            dt_hasta = datetime.fromisoformat(fecha_hasta)
            query = query.filter(Appointment.date_time <= dt_hasta)
        except:
            return jsonify({"message": "Invalid fecha_hasta format. Use ISO format"}), 400

    appointments = query.order_by(Appointment.date_time.desc()).all()

    result = []
    for apt in appointments:
        data = apt.serialize()
        if role == "client":
            doctor = Doctor.query.get(apt.doctor_id)
            data["doctor"] = {"name": doctor.name, "email": doctor.email} if doctor else None
        elif role == "doctor":
            client = Client.query.get(apt.client_id)
            data["client"] = {"name": client.name, "email": client.email} if client else None
        result.append(data)

    return jsonify(result), 200


@api.route("/appointments/<int:id>/status", methods=["PUT"])
@jwt_required()
def update_appointment_status(id):
    user_id = int(get_jwt_identity())
    appointment = Appointment.query.get(id)
    if appointment is None:
        return jsonify({"message": "Appointment not found"}), 404

    body = request.get_json()
    new_status = body.get("status") if body else None
    if new_status not in ["agendada", "confirmada", "cancelada", "completada"]:
        return jsonify({"message": "Valid status is required"}), 400

    doctor = Doctor.query.get(user_id)
    if doctor and appointment.doctor_id == doctor.id:
        appointment.status = new_status
        db.session.commit()
        return jsonify({"message": "Appointment status updated", "appointment": appointment.serialize()}), 200

    client = Client.query.get(user_id)
    if client and appointment.client_id == client.id:
        if new_status == "cancelada":
            appointment.status = new_status
            db.session.commit()
            return jsonify({"message": "Appointment cancelled", "appointment": appointment.serialize()}), 200
        return jsonify({"message": "Clients can only cancel appointments"}), 403

    return jsonify({"message": "Unauthorized"}), 403


@api.route("/doctors", methods=["GET"])
def get_doctors():
    doctors = Doctor.query.filter_by(is_active=True).all()
    return jsonify({
        "message": "Doctors retrieved",
        "doctors": [doctor.serialize() for doctor in doctors]
    }), 200


@api.route("/doctors/<int:id>", methods=["GET"])
def get_doctor(id):
    doctor = Doctor.query.get(id)
    if doctor is None:
        return jsonify({"message": "Doctor not found"}), 404
    if not doctor.is_active:
        return jsonify({"message": "Doctor not available"}), 404
    return jsonify({
        "message": "Doctor retrieved",
        "doctor": doctor.serialize()
    }), 200


@api.route('/doctors/<int:id>/availability', methods=['GET'])
def get_doctor_availability(id):
    doctor = Doctor.query.get(id)
    if doctor is None:
        return jsonify({"message": "Doctor not found"}), 404

    availabilities = Availability.query.filter_by(doctor_id=id).order_by(Availability.day).all()
    if not availabilities:
        return jsonify({
            "message": "Doctor has no availability configured",
            "availability": {}
        }), 200

    dias_nombres = {0: "lunes", 1: "martes", 2: "miercoles", 3: "jueves", 4: "viernes", 5: "sabado", 6: "domingo"}

    citas = Appointment.query.filter(
        Appointment.doctor_id == id,
        Appointment.status.in_(["agendada", "pendiente", "confirmada"])
    ).all()

    horas_ocupadas = {}
    for cita in citas:
        fecha = cita.date_time.date()
        hora = cita.date_time.time()
        key = (fecha, hora.strftime("%H:%M"))
        horas_ocupadas[key] = True

    resultado = {}

    for avail in availabilities:
        nombre_dia = dias_nombres.get(avail.day, f"dia_{avail.day}")
        horas_totales = []

        horaActual = avail.time_start
        while horaActual <= avail.time_end:
            horas_totales.append(horaActual)
            horaActual = (datetime.combine(datetime.min, horaActual) + timedelta(hours=1)).time()

        horas_libres = []
        cita_param = request.args.get("fecha")
        fecha_filtro = None
        if cita_param:
            try:
                fecha_filtro = datetime.fromisoformat(cita_param).date()
            except:
                pass

        for hora in horas_totales:
            hora_str = hora.strftime("%H:%M")
            if fecha_filtro is not None:
                if (fecha_filtro, hora) in horas_ocupadas:
                    continue
            horas_libres.append(hora_str)

        if nombre_dia in resultado:
            resultado[nombre_dia].extend(horas_libres)
        else:
            resultado[nombre_dia] = horas_libres

    return jsonify({
        "message": "Availability retrieved",
        "availability": resultado
    }), 200


@api.route("/doctors/filter", methods=["GET"])
def filter_doctors_by_specialty():
    specialty = request.args.get("specialty") or request.args.get("especialidad")
    if not specialty:
        return jsonify({"message": "specialty or especialidad parameter is required"}), 400

    doctors = Doctor.query.filter(Doctor.specialty.ilike(f"%{specialty}%"), Doctor.is_active == True).all()
    if not doctors:
        return jsonify({"message": "No doctors found with that specialty"}), 404

    return jsonify({
        "message": "Doctors filtered by specialty",
        "doctors": [doctor.serialize() for doctor in doctors]
    }), 200


@api.route("/appointments/<int:id>", methods=["PUT"])
@jwt_required()
def update_appointment(id):
    user_id = int(get_jwt_identity())
    appointment = Appointment.query.get(id)
    if appointment is None:
        return jsonify({"message": "Appointment not found"}), 404

    if user_id != appointment.client_id and user_id != appointment.doctor_id:
        return jsonify({"message": "You do not own this appointment"}), 403

    body = request.get_json()
    if body is None:
        return jsonify({"message": "Body is required"}), 400

    updated = False

    new_date_time = body.get("date_time")
    if new_date_time:
        try:
            date_obj = datetime.fromisoformat(new_date_time.replace('Z', '+00:00'))
        except:
            return jsonify({"message": "Invalid date_time format. Use ISO format"}), 400

        date = date_obj.date()
        time_obj = date_obj.time()
        day = date.weekday()

        availability = Availability.query.filter_by(doctor_id=appointment.doctor_id, day=day).first()
        if availability is None:
            return jsonify({"message": "Doctor not available on that day"}), 400

        if not (availability.time_start <= time_obj <= availability.time_end):
            return jsonify({"message": "New time not within doctor's availability"}), 400

        conflict = Appointment.query.filter(
            Appointment.id != id,
            Appointment.doctor_id == appointment.doctor_id,
            db.func.date(Appointment.date_time) == date,
            Appointment.status.in_(["agendada", "confirmada"])
        ).first()

        if conflict:
            return jsonify({"message": "Time slot already booked"}), 409

        appointment.date_time = date_obj
        updated = True

    new_status = body.get("status")
    if new_status:
        if new_status not in ["agendada", "confirmada", "cancelada", "completada"]:
            return jsonify({"message": "Invalid status"}), 400

        if get_jwt()["role"] == "doctor" and user_id == appointment.doctor_id:
            appointment.status = new_status
            updated = True
        elif get_jwt()["role"] == "client" and new_status == "cancelada":
            appointment.status = new_status
            updated = True
        else:
            return jsonify({"message": "You are not authorized to change this appointment status"}), 403

    if not updated:
        return jsonify({"message": "No changes provided. Send status and/or date_time"}), 400

    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Database error: {str(e)}"}), 500

    return jsonify({
        "message": "Appointment updated",
        "appointment": appointment.serialize()
    }), 200


@api.route("/notifications/appointment-created", methods=["POST"])
def notify_appointment_created():
    body = request.get_json()
    if body is None:
        return jsonify({"message": "Body is required"}), 400

    appointment_id = body.get("appointment_id")
    if appointment_id is None:
        return jsonify({"message": "appointment_id is required"}), 400

    return jsonify({"message": "Notification sent"}), 200

@api.route("/notifications/<int:id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_as_read(id):
    user_id = int(get_jwt_identity())
    role = get_jwt()["role"]

    notification = Notification.query.get(id)

    if notification is None:
        return jsonify({"message": "Notification not found"}), 404

    user_type = "cliente" if role == "client" else role

    if (
        notification.usuario_id != user_id
        or notification.usuario_tipo != user_type
    ):
        return jsonify({
            "message": "You are not authorized to update this notification"
        }), 403

    notification.leida = True
    db.session.commit()

    return jsonify({
        "message": "Notification marked as read",
        "notification": notification.serialize()
    }), 200


@api.route("/availability", methods=["POST"])
@jwt_required()
def create_availability():
    if get_jwt()["role"] != "doctor":
        return jsonify({"message": "Only doctors can add availability"}), 403

    doctor_id = int(get_jwt_identity())
    body = request.get_json()
    if body is None:
        return jsonify({"message": "Body is required"}), 400

    for field in ["day", "time_start", "time_end"]:
        if body.get(field) is None:
            return jsonify({"message": f"{field} is required"}), 400

    try:
        time_start = datetime.strptime(body["time_start"], "%H:%M").time()
        time_end = datetime.strptime(body["time_end"], "%H:%M").time()
    except ValueError:
        return jsonify({"message": "Invalid time format. Use HH:MM"}), 400

    new_availability = Availability(
        doctor_id=doctor_id,
        day=int(body["day"]),
        time_start=time_start,
        time_end=time_end,
    )
    db.session.add(new_availability)
    db.session.commit()

    return jsonify({
        "message": "Availability created",
        "availability": new_availability.serialize()
    }), 201


@api.route("/availability/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_availability(id):
    if get_jwt()["role"] != "doctor":
        return jsonify({"message": "Only doctors can delete availability"}), 403

    doctor_id = int(get_jwt_identity())
    availability = Availability.query.get(id)
    if availability is None:
        return jsonify({"message": "Availability not found"}), 404
    if availability.doctor_id != doctor_id:
        return jsonify({"message": "Unauthorized"}), 403

    db.session.delete(availability)
    db.session.commit()
    return jsonify({"message": "Availability deleted"}), 200

    

@api.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    role = get_jwt()["role"]

    user_type = "cliente" if role == "client" else role

    notifications_query = Notification.query.filter_by(
        usuario_id=user_id,
        usuario_tipo=user_type
    )

    unread_count = notifications_query.filter_by(leida=False).count()

    only_unread = request.args.get("solo_no_leidas", "false").lower()

    if only_unread == "true":
        notifications_query = notifications_query.filter_by(leida=False)

    notifications = notifications_query.order_by(
        Notification.fecha_creacion.desc()
    ).all()

    return jsonify({
        "notifications": [
            notification.serialize()
            for notification in notifications
        ],
        "unread_count": unread_count
    }), 200


# =============================================================================
#  PERFIL: edicion de datos del usuario logueado
# =============================================================================

# La foto se guarda como data URL en base64 dentro de picture_url.
# El front ya la recorta y reescala a 400x400, asi que en la practica
# ronda los 40-60 KB; este limite es solo una red de seguridad.
MAX_PICTURE_LENGTH = 3 * 1024 * 1024  # ~3 MB


def validar_picture(picture_url):
    """Valida la foto de perfil. Devuelve (valor_limpio, mensaje_de_error)."""
    if picture_url is None:
        return None, None

    picture_url = str(picture_url).strip()

    # Cadena vacia = el usuario quito su foto
    if picture_url == "":
        return "", None

    if len(picture_url) > MAX_PICTURE_LENGTH:
        return None, "La imagen es demasiado grande (maximo 3 MB)"

    es_base64 = picture_url.startswith("data:image/")
    es_enlace = picture_url.startswith("http://") or picture_url.startswith("https://")
    if not (es_base64 or es_enlace):
        return None, "Formato de imagen no valido"

    return picture_url, None


def aplicar_cambio_password(usuario, body):
    """Cambia la contrasena si el body la trae. Devuelve un mensaje de error o None."""
    new_password = body.get("new_password")
    if not new_password:
        return None

    current_password = body.get("current_password") or ""
    if not check_password_hash(usuario.password, current_password):
        return "La contrasena actual no es correcta"

    if len(new_password) < 6:
        return "La contrasena nueva debe tener al menos 6 caracteres"

    usuario.password = generate_password_hash(new_password)
    return None


@api.route("/clients/me", methods=["PUT"])
@jwt_required()
def update_client_me():
    if get_jwt()["role"] != "client":
        return jsonify({"message": "Only clients can update this profile"}), 403

    client = Client.query.get(int(get_jwt_identity()))
    if client is None:
        return jsonify({"message": "Client not found"}), 404

    body = request.get_json(silent=True)
    if not body:
        return jsonify({"message": "Body is required"}), 400

    # Campos de texto obligatorios: solo se tocan si vienen en el body
    for field in ["name", "phone_number", "address"]:
        if field in body:
            value = str(body[field]).strip()
            if not value:
                return jsonify({"message": f"El campo {field} no puede estar vacio"}), 400
            setattr(client, field, value)

    # El email tiene que seguir siendo unico
    if "email" in body:
        email = str(body["email"]).strip().lower()
        if not email:
            return jsonify({"message": "El email no puede estar vacio"}), 400
        ya_existe = Client.query.filter(
            Client.email == email,
            Client.id != client.id
        ).first()
        if ya_existe:
            return jsonify({"message": "Ese email ya esta en uso"}), 409
        client.email = email

    if "picture_url" in body:
        picture, error = validar_picture(body["picture_url"])
        if error:
            return jsonify({"message": error}), 400
        client.picture_url = picture or None

    error = aplicar_cambio_password(client, body)
    if error:
        return jsonify({"message": error}), 400

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Ese email ya esta en uso"}), 409
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Database error while updating client")
        return jsonify({"message": "No se pudo actualizar el perfil"}), 500

    return jsonify({
        "message": "Perfil actualizado",
        "client": client.serialize()
    }), 200


@api.route("/doctors/me", methods=["PUT"])
@jwt_required()
def update_doctor_me():
    if get_jwt()["role"] != "doctor":
        return jsonify({"message": "Only doctors can update this profile"}), 403

    doctor = Doctor.query.get(int(get_jwt_identity()))
    if doctor is None:
        return jsonify({"message": "Doctor not found"}), 404

    body = request.get_json(silent=True)
    if not body:
        return jsonify({"message": "Body is required"}), 400

    campos = ["name", "phone_number", "address", "specialty", "credentials"]
    for field in campos:
        if field in body:
            value = str(body[field]).strip()
            if not value:
                return jsonify({"message": f"El campo {field} no puede estar vacio"}), 400
            setattr(doctor, field, value)

    if "email" in body:
        email = str(body["email"]).strip().lower()
        if not email:
            return jsonify({"message": "El email no puede estar vacio"}), 400
        ya_existe = Doctor.query.filter(
            Doctor.email == email,
            Doctor.id != doctor.id
        ).first()
        if ya_existe:
            return jsonify({"message": "Ese email ya esta en uso"}), 409
        doctor.email = email

    # La cedula profesional tambien es unica
    if "id_number" in body:
        id_number = str(body["id_number"]).strip()
        if not id_number:
            return jsonify({"message": "La cedula no puede estar vacia"}), 400
        ya_existe = Doctor.query.filter(
            Doctor.id_number == id_number,
            Doctor.id != doctor.id
        ).first()
        if ya_existe:
            return jsonify({"message": "Esa cedula ya esta registrada"}), 409
        doctor.id_number = id_number

    if "picture_url" in body:
        picture, error = validar_picture(body["picture_url"])
        if error:
            return jsonify({"message": error}), 400
        doctor.picture_url = picture or None

    error = aplicar_cambio_password(doctor, body)
    if error:
        return jsonify({"message": error}), 400

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "El email o la cedula ya estan en uso"}), 409
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Database error while updating doctor")
        return jsonify({"message": "No se pudo actualizar el perfil"}), 500

    return jsonify({
        "message": "Perfil actualizado",
        "doctor": doctor.serialize()
    }), 200
