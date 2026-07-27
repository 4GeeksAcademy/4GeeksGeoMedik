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
    picture_url = db.Column(db.Text, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    register_date = db.Column(db.DateTime, default=datetime.utcnow)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone_number": self.phone_number,
            "address": self.address,
            "picture_url": self.picture_url,
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
    picture_url = db.Column(db.Text, nullable=True)
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

class Notification(db.Model):
    __tablename__ = "notification"

    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, nullable=False)
    usuario_tipo = db.Column(db.String(10), nullable=False)
    tipo = db.Column(db.String(30), nullable=False)
    mensaje = db.Column(db.String(250), nullable=False)
    appointment_id = db.Column(
        db.Integer,
        db.ForeignKey("appointment.id"),
        nullable=True
    )
    leida = db.Column(db.Boolean, nullable=False, default=False)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.Index(
            "ix_notification_usuario",
            "usuario_id",
            "usuario_tipo",
            "leida"
        ),
    )

    def serialize(self):
        return {
            "id": self.id,
            "usuario_id": self.usuario_id,
            "usuario_tipo": self.usuario_tipo,
            "tipo": self.tipo,
            "mensaje": self.mensaje,
            "appointment_id": self.appointment_id,
            "leida": self.leida,
            "fecha_creacion": (
                self.fecha_creacion.isoformat()
                if self.fecha_creacion
                else None
            ),
        }


class HistoriaClinica(db.Model):
    """Ficha de salud que rellena el propio cliente.

    Vive en tabla aparte y NO se expone en Client.serialize(): ese objeto se
    guarda entero en localStorage y lo devuelven varios endpoints, y datos
    como enfermedades o medicamentos no deben andar dando vueltas por ahi.
    """

    __tablename__ = "historia_clinica"

    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(
        db.Integer, db.ForeignKey("client.id"), unique=True, nullable=False
    )

    fecha_nacimiento = db.Column(db.Date, nullable=True)
    altura_cm = db.Column(db.Integer, nullable=True)
    peso_kg = db.Column(db.Float, nullable=True)
    tipo_sangre = db.Column(db.String(5), nullable=True)

    # Las "_comunes" son las casillas marcadas. Se guardan separadas por "|"
    # (no por coma, que puede aparecer dentro de un item) para no depender
    # de columnas JSON. El texto libre va en su campo aparte.
    alergias_comunes = db.Column(db.Text, nullable=True)
    alergias = db.Column(db.Text, nullable=True)
    enfermedades_comunes = db.Column(db.Text, nullable=True)
    enfermedades = db.Column(db.Text, nullable=True)
    medicamentos = db.Column(db.Text, nullable=True)
    discapacidades = db.Column(db.Text, nullable=True)

    contacto_emergencia_nombre = db.Column(db.String(120), nullable=True)
    contacto_emergencia_telefono = db.Column(db.String(20), nullable=True)

    actualizado_en = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    client = db.relationship(
        "Client", backref=db.backref("historia_clinica", uselist=False)
    )

    @staticmethod
    def texto_a_lista(valor):
        if not valor:
            return []
        return [p for p in (x.strip() for x in valor.split("|")) if p]

    @property
    def completa(self):
        """Minimo para que un medico se haga una idea del paciente."""
        return bool(self.fecha_nacimiento and self.altura_cm and self.peso_kg)

    def serialize(self):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "fecha_nacimiento": (
                self.fecha_nacimiento.isoformat() if self.fecha_nacimiento else None
            ),
            "altura_cm": self.altura_cm,
            "peso_kg": self.peso_kg,
            "tipo_sangre": self.tipo_sangre,
            "alergias_comunes": self.texto_a_lista(self.alergias_comunes),
            "alergias": self.alergias,
            "enfermedades_comunes": self.texto_a_lista(self.enfermedades_comunes),
            "enfermedades": self.enfermedades,
            "medicamentos": self.medicamentos,
            "discapacidades": self.discapacidades,
            "contacto_emergencia_nombre": self.contacto_emergencia_nombre,
            "contacto_emergencia_telefono": self.contacto_emergencia_telefono,
            "completa": self.completa,
            "actualizado_en": (
                self.actualizado_en.isoformat() if self.actualizado_en else None
            ),
        }
