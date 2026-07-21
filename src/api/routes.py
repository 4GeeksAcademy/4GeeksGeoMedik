from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import Client db, Doctor, Appointment
from api.models import db, Client, Doctor, Appointment
from api.utils import generate_sitemap, APIException
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

@api.route('/signup-doctor', methods=['POST'])
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
        return jsonify({"error": "id_number is required"}), 4

    email_existente = Doctor.query.filter_by(email=email).first()
    if email_existente is not None:
        return jsonify({"error": "Email already registered"}), 400

    cedula_existente = Doctor.query.filter_by(id_number=id_number).first()
    if cedula_existente is not None:
        return jsonify({"error": "id_number already registered"}), 400

    nuevo_doctor = Doctor(
        name=name,
        email=email,
        password=password,
        phone_number=phone_number,
        address=address,
        specialty=specialty,
        credentials=credentials,
        id_number=id_number,
        picture_url=body.get("picture_url"),
    )

    db.session.add(nuevo_doctor)
    db.session.commit()

    return jsonify({
        "message": "Doctor registrado",
        "doctor": nuevo_doctor.serialize(),
    }), 201


@api.route('/signup', methods=['POST'])
def signup():

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
        return jsonify({
            "message": "Body is required"
        }), 400

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


@api.route("/doctors/filter", methods=["GET"])
def filter_doctors_by_specialty():
    specialty = request.args.get("especialidad")
    
    if not specialty:
        return jsonify({"message": "especialidad parameter is required"}), 400

    doctors = Doctor.query.filter(Doctor.specialty.ilike(f"%{specialty}%"), Doctor.is_active == True).all()
    
    if not doctors:
        return jsonify({"message": "No doctors found with that specialty"}), 404

    return jsonify({
        "message": "Doctors filtered by specialty",
        "doctors": [doctor.serialize() for doctor in doctors]
    }), 200
