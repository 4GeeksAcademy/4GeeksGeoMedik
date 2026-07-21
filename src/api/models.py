from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, DateTime, Float, Time, Integer, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, timezone, time
import enum

db = SQLAlchemy()


class Client(db.Model):
    __tablename__ = "client"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    register_date = db.Column(db.DateTime, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone_number": self.phone_number,
            "address": self.address,
            "is_active": self.is_active,
            "register_date": self.register_date.isoformat() if self.register_date else None,
        }


class Doctor(db.Model):
    __tablename__ = "doctor"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    address = db.Column(db.String(255), nullable=False)
    specialty = db.Column(db.String(120), nullable=False)
    credentials = db.Column(db.String(255), nullable=False)
    id_number = db.Column(db.String(50), unique=True, nullable=False)
    picture_url = db.Column(db.String(255), nullable=True)
    average_rating = db.Column(db.Float, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone_number": self.phone_number,
            "address": self.address,
            "specialty": self.specialty,
            "credentials": self.credentials,
            "id_number": self.id_number,
            "picture_url": self.picture_url,
            "average_rating": self.average_rating,
            "is_active": self.is_active,
        }


class Availability(db.Model):
    __tablename__ = "availability"
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=False)
    day = db.Column(db.Integer, nullable=False)  # 0=Lunes ... 6=Domingo
    time_start = db.Column(db.Time, nullable=False)
    time_end = db.Column(db.Time, nullable=False)
    picture_url = db.Column(db.String(255), nullable=True)

    doctor = db.relationship("Doctor", backref="availabilities")

    def serialize(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "day": self.day,
            "time_start": self.time_start.isoformat() if self.time_start else None,
            "time_end": self.time_end.isoformat() if self.time_end else None,
            "picture_url": self.picture_url,
        }


class Appointment(db.Model):
    __tablename__ = "appointment"
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey("client.id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=False)
    date_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    video_link = db.Column(db.String(255), nullable=True)
    reminder_sent = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    client = db.relationship("Client", backref="appointments")
    doctor = db.relationship("Doctor", backref="appointments")
    def serialize(self):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "doctor_id": self.doctor_id,
            "date_time": self.date_time.isoformat() if self.date_time else None,
            "status": self.status,
            "video_link": self.video_link,
            "reminder_sent": self.reminder_sent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }