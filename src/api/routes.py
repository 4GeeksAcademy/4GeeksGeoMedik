from flask import Flask, request, jsonify, url_for, Blueprint
from api.utils import generate_sitemap, APIException
from api.notification_queue import NotificationQueue
from flask_cors import CORS
from datetime import datetime, timezone
from api.models import db, Client, Doctor, Appointment

api = Blueprint('api', __name__)

CORS(api)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }
    return jsonify(response_body), 200


@api.route('/signup', methods=['POST'])
def signup_cliente():

    body = request.get_json()
    if body is None:
        return jsonify({"error": "Request body is required"}), 400

    name = body.get("name")
    email = body.get("email")
    password = body.get("password")
    phone_number = body.get("phone_number")
    address = body.get("address")

    if name is None:
        return jsonify({"error": "name is required"}), 400
    if email is None:
        return jsonify({"error": "email is required"}), 400
    if password is None:
        return jsonify({"error": "password is required"}), 400
    if phone_number is None:
        return jsonify({"error": "phone_number is required"}), 400
    if address is None:
        return jsonify({"error": "address is required"}), 400

    email_existente = Client.query.filter_by(email=email).first()
    if email_existente is not None:
        return jsonify({"error": "Email already registered"}), 400

    nuevo_cliente = Client(
        name=name,
        email=email,
        password=password,
        phone_number=phone_number,
        address=address,
    )

    db.session.add(nuevo_cliente)
    db.session.commit()

    return jsonify({
        "message": "Cliente registrado",
        "client": nuevo_cliente.serialize(),
    }), 201


@api.route('/signup/doctor', methods=['POST'])
def signup_doctor():

    body = request.get_json()
    if body is None:
        return jsonify({"error": "Request body is required"}), 400

    name = body.get("name")
    email = body.get("email")
    password = body.get("password")
    phone_number = body.get("phone_number")
    address = body.get("address")
    specialty = body.get("specialty")
    credentials = body.get("credentials")
    id_number = body.get("id_number")

    if name is None:
        return jsonify({"error": "name is required"}), 400
    if email is None:
        return jsonify({"error": "email is required"}), 400
    if password is None:
        return jsonify({"error": "password is required"}), 400
    if phone_number is None:
        return jsonify({"error": "phone_number is required"}), 400
    if address is None:
        return jsonify({"error": "address is required"}), 400
    if specialty is None:
        return jsonify({"error": "specialty is required"}), 400
    if credentials is None:
        return jsonify({"error": "credentials is required"}), 400
    if id_number is None:
        return jsonify({"error": "id_number is required"}), 400

    email_existente = Doctor.query.filter_by(email=email).first()
    if email_existente is not None:
        return jsonify({"error": "Email already registered"}), 400

    nuevo_doctor = Doctor(
        name=name,
        email=email,
        password=password,
        phone_number=phone_number,
        address=address,
        specialty=specialty,
        credentials=credentials,
        id_number=id_number,
    )

    db.session.add(nuevo_doctor)
    db.session.commit()

    return jsonify({
        "message": "Doctor registrado",
        "doctor": nuevo_doctor.serialize(),
        "role": "doctor",
    }), 201


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
        "message": "Notificaciones de cancelacion enviadas",
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
