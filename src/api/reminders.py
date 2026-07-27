from datetime import datetime, timedelta
from api.models import db, Appointment, Notification

MINUTOS_ANTES_RECORDATORIO = 30


def crear_notificacion(
    usuario_id,
    usuario_tipo,
    tipo,
    mensaje,
    appointment_id=None
):

    nueva_notificacion = Notification(
        usuario_id=usuario_id,
        usuario_tipo=usuario_tipo,
        tipo=tipo,
        mensaje=mensaje,
        appointment_id=appointment_id
    )

    db.session.add(nueva_notificacion)


def revisar_citas_proximas():

    ahora = datetime.utcnow()
    limite_recordatorio = ahora + timedelta(
        minutes=MINUTOS_ANTES_RECORDATORIO
    )

    print("\n==========================================")
    print("[RECORDATORIOS] Iniciando revisión")
    print(f"[RECORDATORIOS] Hora actual UTC: {ahora}")
    print(
        "[RECORDATORIOS] Buscando citas entre "
        f"{ahora} y {limite_recordatorio}"
    )

    try:
        citas_proximas = Appointment.query.filter(
            Appointment.status == "confirmada",
            Appointment.reminder_sent.is_(False),
            Appointment.date_time >= ahora,
            Appointment.date_time <= limite_recordatorio
        ).all()

        print(
            f"[RECORDATORIOS] Citas encontradas: "
            f"{len(citas_proximas)}"
        )

        if not citas_proximas:
            print("[RECORDATORIOS] No hay recordatorios para enviar")
            print("==========================================\n")
            return

        for cita in citas_proximas:
            fecha_cita = cita.date_time.strftime("%d/%m/%Y")
            hora_cita = cita.date_time.strftime("%H:%M")

            mensaje_cliente = (
                f"Tienes una cita médica en menos de "
                f"{MINUTOS_ANTES_RECORDATORIO} minutos. "
                f"Fecha: {fecha_cita}, hora: {hora_cita}."
            )

            mensaje_doctor = (
                f"Tienes una cita con un paciente en menos de "
                f"{MINUTOS_ANTES_RECORDATORIO} minutos. "
                f"Fecha: {fecha_cita}, hora: {hora_cita}."
            )

            crear_notificacion(
                usuario_id=cita.client_id,
                usuario_tipo="client",
                tipo="recordatorio",
                mensaje=mensaje_cliente,
                appointment_id=cita.id
            )

            crear_notificacion(
                usuario_id=cita.doctor_id,
                usuario_tipo="doctor",
                tipo="recordatorio",
                mensaje=mensaje_doctor,
                appointment_id=cita.id
            )

            cita.reminder_sent = True

            print(
                f"[RECORDATORIOS] Recordatorio creado "
                f"para la cita ID {cita.id}"
            )

        db.session.commit()

        print(
            f"[RECORDATORIOS] Proceso completado. "
            f"Recordatorios enviados: {len(citas_proximas)}"
        )
        print("==========================================\n")

    except Exception as error:
        db.session.rollback()

        print("[RECORDATORIOS] Error durante la revisión")
        print(f"[RECORDATORIOS] Detalle: {str(error)}")
        print("==========================================\n")
