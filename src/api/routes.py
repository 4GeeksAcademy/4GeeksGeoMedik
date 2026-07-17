from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, Client, Doctor, Appointment
from api.utils import generate_sitemap, APIException
from api.notification_queue import NotificationQueue
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timezone


api = Blueprint('api', __name__)

CORS(api)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }
    return jsonify(response_body), 200


@api.route('/notifications/appointment-created', methods=['POST'])
def notify_appointment_created():

    body = request.get_json()
    if body is None:
        return jsonify({"error": "Request body is required"}), 400

    appointment_id = body.get("appointment_id")
    if appointment_id is None:
        return jsonify({"error": "appointment_id is required"}), 400

    appointment = Appointment.query.get(appointment_id)
    if appointment is None:
        return jsonify({"error": "Appointment not found"}), 404

    client = Client.query.get(appointment.client_id)
    doctor = Doctor.query.get(appointment.doctor_id)

    date_str = ""
    if appointment.date_time is not None:
        date_str = appointment.date_time.strftime("%d/%m/%Y %H:%M")

    queue = NotificationQueue()

    notificacion_cliente = queue.push(
        user_type="client",
        user_id=appointment.client_id,
        notification_type="appointment_created",
        title="Cita creada",
        message=f"Tu cita con Dr. {doctor.name} ha sido agendada para el {date_str}.",
        appointment_id=appointment.id,
    )

    notificacion_doctor = queue.push(
        user_type="doctor",
        user_id=appointment.doctor_id,
        notification_type="appointment_created",
        title="Nueva cita",
        message=f"Tienes una nueva cita con {client.name} el {date_str}.",
        appointment_id=appointment.id,
    )

    return jsonify({
        "message": "Notificaciones de cita creada enviadas",
        "notifications": [notificacion_cliente, notificacion_doctor],
    }), 201


@api.route('/notifications/appointment-cancelled', methods=['POST'])
def notify_appointment_cancelled():

    body = request.get_json()
    if body is None:
        return jsonify({"error": "Request body is required"}), 400

    appointment_id = body.get("appointment_id")
    if appointment_id is None:
        return jsonify({"error": "appointment_id is required"}), 400

    appointment = Appointment.query.get(appointment_id)
    if appointment is None:
        return jsonify({"error": "Appointment not found"}), 404

    client = Client.query.get(appointment.client_id)
    doctor = Doctor.query.get(appointment.doctor_id)

    date_str = ""
    if appointment.date_time is not None:
        date_str = appointment.date_time.strftime("%d/%m/%Y %H:%M")

    queue = NotificationQueue()

    notificacion_cliente = queue.push(
        user_type="client",
        user_id=appointment.client_id,
        notification_type="appointment_cancelled",
        title="Cita cancelada",
        message=f"Tu cita con Dr. {doctor.name} del {date_str} ha sido cancelada.",
        appointment_id=appointment.id,
    )

    notificacion_doctor = queue.push(
        user_type="doctor",
        user_id=appointment.doctor_id,
        notification_type="appointment_cancelled",
        title="Cita cancelada",
        message=f"La cita con {client.name} del {date_str} ha sido cancelada.",
        appointment_id=appointment.id,
    )

    return jsonify({
        "message": "Notificaciones de cancelación enviadas",
        "notifications": [notificacion_cliente, notificacion_doctor],
    }), 200


@api.route('/notifications/reminder', methods=['POST'])
def notify_appointment_reminder():

    body = request.get_json()
    if body is None:
        return jsonify({"error": "Request body is required"}), 400

    appointment_id = body.get("appointment_id")
    if appointment_id is None:
        return jsonify({"error": "appointment_id is required"}), 400

    appointment = Appointment.query.get(appointment_id)
    if appointment is None:
        return jsonify({"error": "Appointment not found"}), 404

    client = Client.query.get(appointment.client_id)
    doctor = Doctor.query.get(appointment.doctor_id)

    date_str = ""
    if appointment.date_time is not None:
        date_str = appointment.date_time.strftime("%d/%m/%Y %H:%M")

    queue = NotificationQueue()

    notificacion_cliente = queue.push(
        user_type="client",
        user_id=appointment.client_id,
        notification_type="appointment_reminder",
        title="Recordatorio de cita",
        message=f"Recordatorio: tienes una cita con Dr. {doctor.name} el {date_str}.",
        appointment_id=appointment.id,
    )

    notificacion_doctor = queue.push(
        user_type="doctor",
        user_id=appointment.doctor_id,
        notification_type="appointment_reminder",
        title="Recordatorio de cita",
        message=f"Recordatorio: cita con {client.name} el {date_str}.",
        appointment_id=appointment.id,
    )

    return jsonify({
        "message": "Recordatorios enviados",
        "notifications": [notificacion_cliente, notificacion_doctor],
    }), 200


@api.route('/notifications', methods=['GET'])
def get_notifications():

    user_type = request.args.get("user_type")
    user_id = request.args.get("user_id", type=int)

    if user_type is None or user_id is None:
        return jsonify({"error": "user_type and user_id are required"}), 400

    queue = NotificationQueue()
    lista_notificaciones = queue.list_for_user(user_type, user_id)

    return jsonify(lista_notificaciones), 200


@api.route('/notifications/read', methods=['PUT'])
def mark_notification_read():

    body = request.get_json()
    if body is None:
        return jsonify({"error": "notification_id is required"}), 400

    notification_id = body.get("notification_id")
    if notification_id is None:
        return jsonify({"error": "notification_id is required"}), 400

    queue = NotificationQueue()
    notificacion_encontrada = queue.mark_read(notification_id)

    if notificacion_encontrada is False:
        return jsonify({"error": "Notification not found"}), 404

    return jsonify({"message": "Notification marked as read"}), 200


@api.route('/notifications/read-all', methods=['PUT'])
def mark_all_notifications_read():

    user_type = request.args.get("user_type")
    user_id = request.args.get("user_id", type=int)

    if user_type is None or user_id is None:
        return jsonify({"error": "user_type and user_id are required"}), 400

    queue = NotificationQueue()
    cantidad_marcadas = queue.mark_all_read(user_type, user_id)

    return jsonify({
        "message": "All notifications marked as read",
        "count": cantidad_marcadas,
    }), 200


@api.route('/notifications/unread-count', methods=['GET'])
def unread_notifications_count():

    user_type = request.args.get("user_type")
    user_id = request.args.get("user_id", type=int)

    if user_type is None or user_id is None:
        return jsonify({"error": "user_type and user_id are required"}), 400

    queue = NotificationQueue()
    cantidad_no_leidas = queue.unread_count(user_type, user_id)

    return jsonify({"unread_count": cantidad_no_leidas}), 200


@api.route("/signup/doctor", methods=["POST"])
def signup_doctor():

    body = request.get_json()

    if body is None:
        return jsonify({"message": "Body is required"}), 400

    required_fields = [
        "name",
        "email",
        "password",
        "phone_number",
        "address",
        "specialty",
        "credentials",
        "id_number"
    ]

    for field in required_fields:
        if not body.get(field):
            return jsonify({"message": f"{field} is required"}), 400

    doctor_exists = Doctor.query.filter_by(email=body["email"]).first()

    if doctor_exists:
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
    )

    db.session.add(new_doctor)
    db.session.commit()

    return jsonify({
        "message": "Doctor created successfully"
    }), 201


@api.route("/login/doctor", methods=["POST"])
def login_doctor():

    body = request.get_json()

    if body is None:
        return jsonify({
            "message": "Body is required"
        }), 400

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    doctor = Doctor.query.filter_by(email=email).first()

    if doctor is None:
        return jsonify({
            "message": "Doctor not found"
        }), 404

    if not check_password_hash(doctor.password, password):
        return jsonify({
            "message": "Invalid password"
        }), 401

    access_token = create_access_token(identity=str(doctor.id))

    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "doctor": doctor.serialize()
    }), 200


@api.route("/signup/client", methods=["POST"])
def signup_client():

    body = request.get_json()

    if body is None:
        return jsonify({"message": "Body is required"}), 400

    required_fields = [
        "name",
        "email",
        "password",
        "phone_number",
        "address"
    ]

    for field in required_fields:
        if not body.get(field):
            return jsonify({"message": f"{field} is required"}), 400

    client_exists = Client.query.filter_by(email=body["email"]).first()

    if client_exists:
        return jsonify({"message": "Client already exists"}), 400

    new_client = Client(
        name=body["name"],
        email=body["email"],
        password=generate_password_hash(body["password"]),
        phone_number=body["phone_number"],
        address=body["address"]
    )

    db.session.add(new_client)
    db.session.commit()

    return jsonify({
        "message": "Client created successfully"
    }), 201


@api.route("/login/client", methods=["POST"])
def login_client():

    body = request.get_json()

    if body is None:
        return jsonify({"message": "Body is required"}), 400

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return jsonify({
            "message": "Email and password are required"
        }), 400

    client = Client.query.filter_by(email=email).first()

    if client is None:
        return jsonify({
            "message": "Client not found"
        }), 404

    if not check_password_hash(client.password, password):
        return jsonify({
            "message": "Invalid password"
        }), 401

    access_token = create_access_token(identity=str(client.id))

    return jsonify({
        "message": "Login successful",
        "token": access_token,
        "client": client.serialize()
    }), 200


@api.route("/appointments", methods=["POST"])
@jwt_required()
def create_appointment():

    body = request.get_json()

    if body is None:
        return jsonify({"message": "Body is required"}), 400

    required_fields = [
        "client_id",
        "doctor_id",
        "date_time"
    ]

    for field in required_fields:
        if not body.get(field):
            return jsonify({"message": f"{field} is required"}), 400

    client = Client.query.get(body["client_id"])
    if client is None:
        return jsonify({"message": "Client not found"}), 404

    doctor = Doctor.query.get(body["doctor_id"])
    if doctor is None:
        return jsonify({"message": "Doctor not found"}), 404

    new_appointment = Appointment(
        client_id=body["client_id"],
        doctor_id=body["doctor_id"],
        date_time=datetime.fromisoformat(body["date_time"]),
        status="pending"
    )

    db.session.add(new_appointment)
    db.session.commit()

    return jsonify({
        "message": "Appointment created successfully",
        "appointment": new_appointment.serialize()
    }), 201
