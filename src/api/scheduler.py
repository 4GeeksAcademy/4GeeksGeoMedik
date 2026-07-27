from apscheduler.schedulers.background import BackgroundScheduler
from api.reminders import revisar_citas_proximas

scheduler = BackgroundScheduler()

def ejecutar_revision_con_contexto(app):

    with app.app_context():
        revisar_citas_proximas()


def iniciar_scheduler(app):

    if scheduler.running:
        print("[SCHEDULER] El scheduler ya estaba iniciado")
        return

    scheduler.add_job(
        func=ejecutar_revision_con_contexto,
        trigger="cron",
        minute="0,30",
        args=[app],
        id="revisar_citas_proximas",
        name="Revisar citas próximas",
        replace_existing=True,
        max_instances=1,
        coalesce=True
    )

    scheduler.start()

    print("[SCHEDULER] Scheduler iniciado correctamente")
    print("[SCHEDULER] Revisará citas en los minutos 00 y 30")