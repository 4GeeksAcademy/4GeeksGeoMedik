from flask import request, jsonify, Blueprint
from api.models import db, Client, Doctor, Appointment, Availability
from api.utils import APIException
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime


api = Blueprint('api', __name__)

CORS(api)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    return jsonify({
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }), 200


@api.route("/signup/client", methods=["POST"])
def signup_client():
    body = request.get_json()
    if body is None:
        return jsonify({"message": "Body is required"}), 400

    required_fields = ["name", "email", "password", "phone_number", "address"]
    for field in required_fields:
        if not body.get(field):
            return jsonify({"message": f"{field} is required"}), 400

    if Client.query.filter_by(email=body["email"]).first():
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

    return jsonify({"message": "Client created successfully"}), 201


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

    access_token = create_access_token(identity=str(client.id))

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

    access_token = create_access_token(identity=str(doctor.id))

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

    client = Client.query.get(user_id)
    if client:
        appointments = Appointment.query.filter_by(client_id=user_id).order_by(Appointment.date_time.desc()).all()
        return jsonify({
            "message": "Appointments retrieved",
            "appointments": [a.serialize() for a in appointments]
        }), 200

    doctor = Doctor.query.get(user_id)
    if doctor:
        appointments = Appointment.query.filter_by(doctor_id=user_id).order_by(Appointment.date_time.desc()).all()
        return jsonify({
            "message": "Appointments retrieved",
            "appointments": [a.serialize() for a in appointments]
        }), 200

    return jsonify({"message": "User not found"}), 404


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

@api.route("/notifications/appointment-created", methods=["POST"])
def notify_appointment_created():
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

        doctor = Doctor.query.get(user_id)
        if doctor and appointment.doctor_id == doctor.id:
            appointment.status = new_status
            updated = True
        else:
            if new_status != "cancelada":
                return jsonify({"message": "Clients can only cancel appointments"}), 403
            appointment.status = new_status
            updated = True

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
    appointment_id = body.get("appointment_id")
    if appointment_id is None:
        return jsonify({"message": "appointment_id is required"}), 400

    return jsonify({"message": "Notification sent"}), 200
