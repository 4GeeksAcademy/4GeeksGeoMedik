from flask import request, jsonify, Blueprint, current_app
from api.models import db, Client, Doctor, Appointment, Availability, Notification, HistoriaClinica, Review
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


def crear_notificacion_cancelacion(appointment, role):
    appointment_date = appointment.date_time.strftime("%d/%m/%Y")
    appointment_time = appointment.date_time.strftime("%H:%M")

    if role == "doctor":
        doctor = Doctor.query.get(appointment.doctor_id)
        crear_notificacion(
            usuario_id=appointment.client_id,
            usuario_tipo="cliente",
            tipo="cita_cancelada",
            mensaje=(
                f"{doctor.name} cancelo la cita del {appointment_date} "
                f"a las {appointment_time}"
            ),
            appointment_id=appointment.id
        )
    else:
        client = Client.query.get(appointment.client_id)
        crear_notificacion(
            usuario_id=appointment.doctor_id,
            usuario_tipo="doctor",
            tipo="cita_cancelada",
            mensaje=(
                f"{client.name} cancelo la cita del {appointment_date} "
                f"a las {appointment_time}"
            ),
            appointment_id=appointment.id
        )


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

    email = body["email"].strip().lower()
    id_number = body["id_number"].strip()

    if Doctor.query.filter_by(email=email).first():
        return jsonify({"message": "Doctor already exists"}), 400
    if Doctor.query.filter_by(id_number=id_number).first():
        return jsonify({"message": "Professional ID already exists"}), 409

    new_doctor = Doctor(
        name=body["name"].strip(),
        email=email,
        password=generate_password_hash(body["password"]),
        phone_number=body["phone_number"].strip(),
        address=body["address"].strip(),
        specialty=body["specialty"].strip(),
        credentials=body["credentials"].strip(),
        id_number=id_number,
        picture_url=body.get("picture_url"),
    )

    try:
        db.session.add(new_doctor)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Doctor already exists"}), 409
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Database error while creating doctor")
        return jsonify({"message": "Could not create doctor"}), 500

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

    # Un medico puede tener varios tramos el mismo dia (manana y tarde),
    # asi que hay que mirarlos todos y no solo el primero.
    disponibilidades = Availability.query.filter_by(
        doctor_id=doctor.id, day=day
    ).all()
    if not disponibilidades:
        return jsonify({"message": "Doctor not available on this day"}), 400

    dentro_de_horario = any(
        a.time_start <= time_obj <= a.time_end for a in disponibilidades
    )
    if not dentro_de_horario:
        return jsonify({"message": "Appointment time not within doctor's availability"}), 400

    # Solo choca si ya hay cita a ESA hora. Antes comparaba solo la fecha, asi
    # que una sola cita bloqueaba el dia entero para todo el mundo.
    existing = Appointment.query.filter(
        Appointment.doctor_id == body["doctor_id"],
        Appointment.date_time == date_obj,
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

        reminder_message = (
            f"Recordatorio: tienes una cita el {appointment_date} "
            f"a las {appointment_time} con {doctor.name}"
        )

        crear_notificacion(
            usuario_id=client_id,
            usuario_tipo="cliente",
            tipo="recordatorio",
            mensaje=reminder_message,
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
    role = get_jwt()["role"]
    appointment = Appointment.query.get(id)
    if appointment is None:
        return jsonify({"message": "Appointment not found"}), 404

    body = request.get_json()
    new_status = body.get("status") if body else None
    if new_status not in ["agendada", "confirmada", "cancelada", "completada"]:
        return jsonify({"message": "Valid status is required"}), 400

    previous_status = appointment.status

    if role == "doctor" and appointment.doctor_id == user_id:
        appointment.status = new_status
        if new_status == "cancelada" and previous_status != "cancelada":
            crear_notificacion_cancelacion(appointment, role)
        db.session.commit()
        return jsonify({"message": "Appointment status updated", "appointment": appointment.serialize()}), 200

    if role == "client" and appointment.client_id == user_id:
        if new_status == "cancelada":
            appointment.status = new_status
            if previous_status != "cancelada":
                crear_notificacion_cancelacion(appointment, role)
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

        role = get_jwt()["role"]
        previous_status = appointment.status

        if role == "doctor" and user_id == appointment.doctor_id:
            appointment.status = new_status
            updated = True
        elif role == "client" and new_status == "cancelada":
            appointment.status = new_status
            updated = True
        else:
            return jsonify({"message": "You are not authorized to change this appointment status"}), 403

        if new_status == "cancelada" and previous_status != "cancelada":
            crear_notificacion_cancelacion(appointment, role)

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


@api.route("/notifications/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_notification(id):
    user_id = int(get_jwt_identity())
    role = get_jwt()["role"]
    user_type = "cliente" if role == "client" else role

    notification = Notification.query.get(id)
    if notification is None:
        return jsonify({"message": "Notification not found"}), 404

    if (
        notification.usuario_id != user_id
        or notification.usuario_tipo != user_type
    ):
        return jsonify({
            "message": "You are not authorized to delete this notification"
        }), 403

    db.session.delete(notification)
    db.session.commit()

    return jsonify({"message": "Notification deleted"}), 200


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

    tipo_filtro = request.args.get("tipo")
    if tipo_filtro:
        notifications_query = notifications_query.filter(Notification.tipo == tipo_filtro)

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


@api.route("/appointments/today", methods=["GET"])
@jwt_required()
def get_today_appointments():
    user_id = int(get_jwt_identity())
    role = get_jwt()["role"]

    today = datetime.utcnow().date()
    tomorrow = today + timedelta(days=1)

    if role == "client":
        query = Appointment.query.filter(
            Appointment.client_id == user_id,
            Appointment.date_time >= today,
            Appointment.date_time < tomorrow,
            Appointment.status.in_(["agendada", "confirmada", "pendiente"]),
        )
    elif role == "doctor":
        query = Appointment.query.filter(
            Appointment.doctor_id == user_id,
            Appointment.date_time >= today,
            Appointment.date_time < tomorrow,
            Appointment.status.in_(["agendada", "confirmada", "pendiente"]),
        )
    else:
        return jsonify({"message": "Invalid role"}), 403

    appointments = query.order_by(Appointment.date_time).all()

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


# =============================================================================
#  VIDEOLLAMADAS (Jitsi Meet)
# =============================================================================

import os
import secrets

# Servidor de Jitsi. Configurable por si mas adelante se usa instancia propia.
JITSI_BASE_URL = os.getenv("JITSI_BASE_URL", "https://meet.jit.si").rstrip("/")


@api.route("/appointments/<int:id>/video", methods=["POST"])
@jwt_required()
def crear_sala_video(id):
    """Devuelve el enlace de videollamada de una cita, creandolo la 1a vez.

    El enlace se guarda en appointment.video_link y SIEMPRE se reutiliza. Si
    cada llamada generase una sala nueva, el paciente y el doctor acabarian en
    salas distintas y no se encontrarian nunca.
    """
    user_id = int(get_jwt_identity())
    role = get_jwt()["role"]

    appointment = Appointment.query.get(id)
    if appointment is None:
        return jsonify({"message": "Cita no encontrada"}), 404

    # Solo los dos implicados en ESA cita
    if role == "client":
        autorizado = appointment.client_id == user_id
    elif role == "doctor":
        autorizado = appointment.doctor_id == user_id
    else:
        autorizado = False

    if not autorizado:
        return jsonify({"message": "No tienes acceso a esta cita"}), 403

    if appointment.status != "confirmada":
        return jsonify({
            "message": "La videollamada solo esta disponible en citas confirmadas"
        }), 409

    if appointment.video_link:
        return jsonify({"video_link": appointment.video_link}), 200

    # Nombre imposible de adivinar: las salas publicas de Jitsi no piden
    # autenticacion, asi que un nombre secuencial tipo "cita-42" dejaria
    # entrar a cualquiera que probase numeros.
    sala = f"geomedik-{secrets.token_urlsafe(16)}"
    appointment.video_link = f"{JITSI_BASE_URL}/{sala}"

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Error al guardar el enlace de video")
        return jsonify({"message": "No se pudo crear la sala"}), 500

    return jsonify({"video_link": appointment.video_link}), 200


# =============================================================================
#  HISTORIA CLINICA DEL CLIENTE
# =============================================================================

from datetime import date as _date

ALTURA_MIN_CM, ALTURA_MAX_CM = 50, 250
PESO_MIN_KG, PESO_MAX_KG = 2, 500
TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

# Cada campo con su limite real de columna, para no reventar el INSERT
CAMPOS_TEXTO = {
    "alergias": 2000,
    "enfermedades": 2000,
    "medicamentos": 2000,
    "discapacidades": 2000,
    "contacto_emergencia_nombre": 120,
    "contacto_emergencia_telefono": 20,
}


def limpiar_texto(valor, maximo):
    if valor is None:
        return None
    limpio = str(valor).strip()[:maximo]
    return limpio or None


def lista_a_texto(valor):
    """Las casillas marcadas se guardan como texto separado por '|'."""
    if valor is None:
        return None
    if isinstance(valor, str):
        valor = [valor]
    if not isinstance(valor, list):
        return None
    # Quitamos el separador de dentro de cada item para no corromper la lista
    partes = [str(x).strip().replace("|", " ") for x in valor]
    return "|".join([x for x in partes if x])[:2000] or None


def aplicar_datos_historia(historia, body):
    """Vuelca el body sobre la historia. Devuelve mensaje de error o None."""

    if "fecha_nacimiento" in body:
        valor = body["fecha_nacimiento"]
        if not valor:
            historia.fecha_nacimiento = None
        else:
            try:
                fecha = datetime.strptime(str(valor), "%Y-%m-%d").date()
            except ValueError:
                return "La fecha de nacimiento debe tener formato AAAA-MM-DD"
            if fecha > _date.today():
                return "La fecha de nacimiento no puede estar en el futuro"
            if fecha.year < 1900:
                return "Revisa la fecha de nacimiento"
            historia.fecha_nacimiento = fecha

    if "altura_cm" in body:
        valor = body["altura_cm"]
        if valor in (None, ""):
            historia.altura_cm = None
        else:
            try:
                altura = int(float(valor))
            except (TypeError, ValueError):
                return "La altura debe ser un numero"
            if not (ALTURA_MIN_CM <= altura <= ALTURA_MAX_CM):
                return f"La altura debe estar entre {ALTURA_MIN_CM} y {ALTURA_MAX_CM} cm"
            historia.altura_cm = altura

    if "peso_kg" in body:
        valor = body["peso_kg"]
        if valor in (None, ""):
            historia.peso_kg = None
        else:
            try:
                peso = float(valor)
            except (TypeError, ValueError):
                return "El peso debe ser un numero"
            if not (PESO_MIN_KG <= peso <= PESO_MAX_KG):
                return f"El peso debe estar entre {PESO_MIN_KG} y {PESO_MAX_KG} kg"
            historia.peso_kg = round(peso, 2)

    if "tipo_sangre" in body:
        valor = (body["tipo_sangre"] or "").strip().upper()
        if valor and valor not in TIPOS_SANGRE:
            return "Tipo de sangre no valido"
        historia.tipo_sangre = valor or None

    for campo, maximo in CAMPOS_TEXTO.items():
        if campo in body:
            setattr(historia, campo, limpiar_texto(body[campo], maximo))

    for campo in ["alergias_comunes", "enfermedades_comunes"]:
        if campo in body:
            setattr(historia, campo, lista_a_texto(body[campo]))

    return None


@api.route("/clients/me/historia", methods=["GET"])
@jwt_required()
def get_mi_historia():
    if get_jwt()["role"] != "client":
        return jsonify({"message": "Solo los clientes tienen historia clinica"}), 403

    client_id = int(get_jwt_identity())
    historia = HistoriaClinica.query.filter_by(client_id=client_id).first()

    if historia is None:
        # Todavia no la ha rellenado: no es un error
        return jsonify({"historia": None, "completa": False}), 200

    return jsonify({
        "historia": historia.serialize(),
        "completa": historia.completa,
    }), 200


@api.route("/clients/me/historia", methods=["PUT"])
@jwt_required()
def upsert_mi_historia():
    if get_jwt()["role"] != "client":
        return jsonify({"message": "Solo los clientes pueden editar su historia"}), 403

    client_id = int(get_jwt_identity())
    if Client.query.get(client_id) is None:
        return jsonify({"message": "Cliente no encontrado"}), 404

    body = request.get_json(silent=True)
    if not body:
        return jsonify({"message": "Body is required"}), 400

    historia = HistoriaClinica.query.filter_by(client_id=client_id).first()
    creada = historia is None
    if creada:
        historia = HistoriaClinica(client_id=client_id)
        db.session.add(historia)

    error = aplicar_datos_historia(historia, body)
    if error:
        db.session.rollback()
        return jsonify({"message": error}), 400

    try:
        db.session.commit()
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Error al guardar la historia clinica")
        return jsonify({"message": "No se pudo guardar la historia clinica"}), 500

    return jsonify({
        "message": "Historia clinica guardada",
        "historia": historia.serialize(),
    }), (201 if creada else 200)


@api.route("/clients/<int:id>/historia", methods=["GET"])
@jwt_required()
def get_historia_de_paciente(id):
    """Un medico solo ve la historia de un paciente con el que tiene cita."""
    if get_jwt()["role"] != "doctor":
        return jsonify({
            "message": "Solo los medicos pueden consultar historias ajenas"
        }), 403

    doctor_id = int(get_jwt_identity())

    # Una cita cancelada no da acceso: esa consulta nunca ocurrio.
    tiene_cita = Appointment.query.filter(
        Appointment.doctor_id == doctor_id,
        Appointment.client_id == id,
        Appointment.status.in_(["agendada", "pendiente", "confirmada", "completada"]),
    ).first()
    if tiene_cita is None:
        return jsonify({"message": "No tienes ninguna cita con este paciente"}), 403

    historia = HistoriaClinica.query.filter_by(client_id=id).first()
    if historia is None:
        return jsonify({"historia": None, "completa": False}), 200

    return jsonify({
        "historia": historia.serialize(),
        "completa": historia.completa,
    }), 200


@api.route("/doctors/me/availability", methods=["GET"])
@jwt_required()
def get_mi_disponibilidad():
    """Los horarios crudos del doctor logueado, con su id para poder borrarlos.

    El endpoint publico /doctors/<id>/availability existe para el paciente:
    devuelve huecos libres por dia y sin ids, asi que no sirve para que el
    medico gestione su propia agenda.
    """
    if get_jwt()["role"] != "doctor":
        return jsonify({"message": "Solo los medicos tienen disponibilidad"}), 403

    doctor_id = int(get_jwt_identity())

    horarios = (
        Availability.query.filter_by(doctor_id=doctor_id)
        .order_by(Availability.day, Availability.time_start)
        .all()
    )

    return jsonify({
        "availabilities": [h.serialize() for h in horarios]
    }), 200


# =============================================================================
#  RESENAS DE MEDICOS
# =============================================================================


def recalcular_media_doctor(doctor_id):
    """Vuelve a calcular average_rating a partir de las resenas reales."""
    media = (
        db.session.query(db.func.avg(Review.rating))
        .filter(Review.doctor_id == doctor_id)
        .scalar()
    )
    doctor = Doctor.query.get(doctor_id)
    if doctor is not None:
        doctor.average_rating = round(float(media), 1) if media is not None else None


@api.route("/appointments/<int:id>/review", methods=["POST"])
@jwt_required()
def crear_review(id):
    """Solo el paciente de una cita ya completada puede valorarla."""
    if get_jwt()["role"] != "client":
        return jsonify({"message": "Solo los pacientes pueden dejar resenas"}), 403

    client_id = int(get_jwt_identity())
    appointment = Appointment.query.get(id)
    if appointment is None:
        return jsonify({"message": "Cita no encontrada"}), 404

    if appointment.client_id != client_id:
        return jsonify({"message": "Esta cita no es tuya"}), 403

    if appointment.status != "completada":
        return jsonify({
            "message": "Solo puedes valorar una consulta que ya se ha completado"
        }), 409

    if Review.query.filter_by(appointment_id=id).first():
        return jsonify({"message": "Ya valoraste esta consulta"}), 409

    body = request.get_json(silent=True)
    if not body:
        return jsonify({"message": "Body is required"}), 400

    try:
        rating = int(body.get("rating"))
    except (TypeError, ValueError):
        return jsonify({"message": "La valoracion debe ser un numero del 1 al 5"}), 400

    if not (1 <= rating <= 5):
        return jsonify({"message": "La valoracion debe estar entre 1 y 5"}), 400

    comentario = body.get("comentario")
    comentario = str(comentario).strip()[:1000] if comentario else None

    review = Review(
        client_id=client_id,
        doctor_id=appointment.doctor_id,
        appointment_id=id,
        rating=rating,
        comentario=comentario,
    )
    db.session.add(review)

    try:
        db.session.flush()
        recalcular_media_doctor(appointment.doctor_id)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "Ya valoraste esta consulta"}), 409
    except SQLAlchemyError:
        db.session.rollback()
        current_app.logger.exception("Error al guardar la resena")
        return jsonify({"message": "No se pudo guardar la resena"}), 500

    return jsonify({"message": "Gracias por tu valoracion", "review": review.serialize()}), 201


@api.route("/doctors/<int:id>/reviews", methods=["GET"])
def get_reviews_doctor(id):
    """Resenas publicas de un medico, de la mas reciente a la mas antigua."""
    doctor = Doctor.query.get(id)
    if doctor is None:
        return jsonify({"message": "Doctor no encontrado"}), 404

    reviews = (
        Review.query.filter_by(doctor_id=id)
        .order_by(Review.fecha_creacion.desc())
        .all()
    )

    return jsonify({
        "reviews": [r.serialize() for r in reviews],
        "total": len(reviews),
        "media": doctor.average_rating,
    }), 200
