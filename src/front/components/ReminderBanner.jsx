import { useState, useEffect, useCallback } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

const sendBrowserNotification = (title, body) => {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, { body, icon: "/4geeks.ico" });
};

export const ReminderBanner = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  const obtenerToken = () => localStorage.getItem("token");

  const fetchReminders = useCallback(async () => {
    try {
      const token = obtenerToken();
      if (!token) return;

      const res = await fetch(
        `${BACKEND_URL}/api/notifications?solo_no_leidas=true&tipo=recordatorio`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) return;

      const data = await res.json();
      const lista = Array.isArray(data) ? data : data.notifications || [];
      const recordatorios = lista.filter((n) => !n.leida);

      const conDetalles = await Promise.all(
        recordatorios.map(async (reminder) => {
          if (!reminder.appointment_id) return null;
          try {
            const aptRes = await fetch(
              `${BACKEND_URL}/api/appointments/${reminder.appointment_id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (!aptRes.ok) return null;
            const aptData = await aptRes.json();
            return { ...reminder, appointment: aptData };
          } catch {
            return null;
          }
        })
      );

      const filtro = conDetalles.filter(Boolean);
      setReminders(filtro);

      const permisionConcedida = await requestNotificationPermission();
      if (permisionConcedida && filtro.length > 0) {
        const cita = filtro[0].appointment;
        if (cita) {
          const fecha = new Date(cita.date_time);
          const hora = fecha.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          });
          sendBrowserNotification(
            "Recordatorio de cita",
            `Tienes una cita hoy a las ${hora} con ${cita.doctor?.name || "tu médico"}`
          );
        }
      }
    } catch (err) {
      console.error("Error al cargar recordatorios:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const marcarComoLeida = async (notificationId) => {
    const token = obtenerToken();
    if (!token) return;
    try {
      await fetch(`${BACKEND_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Error al marcar notificación como leída:", err);
    }
  };

  const cerrarBanner = (notificationId) => {
    setDismissedIds((prev) => new Set(prev).add(notificationId));
    marcarComoLeida(notificationId);
  };

  if (loading || reminders.length === 0) return null;

  const visibleReminders = reminders.filter(
    (r) => !dismissedIds.has(r.id)
  );

  if (visibleReminders.length === 0) return null;

  return (
    <div className="mb-3" role="alert">
      {visibleReminders.map((reminder) => {
        const apt = reminder.appointment;
        if (!apt) return null;

        const fecha = new Date(apt.date_time);
        const hora = fecha.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const nombreDoctor = apt.doctor?.name || "Tu médico";
        const videoLink = apt.video_link;

        return (
          <div
            key={reminder.id}
            className="alert alert-info d-flex align-items-center gap-3 flex-wrap"
            style={{ borderRadius: "0.75rem" }}
          >
            <span className="material-symbols-outlined text-info fs-5">
              notifications
            </span>

            <div className="flex-grow-1">
              <strong>Recordatorio:</strong> Tienes una cita hoy a las{" "}
              {hora} con <strong>{nombreDoctor}</strong>
            </div>

            {videoLink && (
              <a
                href={videoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-success"
              >
                Unirse a videollamada
              </a>
            )}

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => cerrarBanner(reminder.id)}
              aria-label="Cerrar recordatorio"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};