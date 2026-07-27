import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const TIPO_CONFIG = {
  cita_nueva: { icono: "event_available", color: "text-primary", bg: "bg-primary-subtle" },
  recordatorio: { icono: "notifications_active", color: "text-warning", bg: "bg-warning-subtle" },
  video: { icono: "videocam", color: "text-success", bg: "bg-success-subtle" },
  cancelacion: { icono: "cancel", color: "text-danger", bg: "bg-danger-subtle" },
};

function timeAgo(fecha) {
  const ahora = new Date();
  const fechaNotif = new Date(fecha);
  const diffMs = ahora - fechaNotif;
  const diffSeg = Math.floor(diffMs / 1000);
  if (diffSeg < 60) return "hace unos seg";
  const diffMin = Math.floor(diffSeg / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `hace ${diffHrs} hr`;
  const diffDias = Math.floor(diffHrs / 24);
  return `hace ${diffDias} día${diffDias > 1 ? "s" : ""}`;
}

export const NotificacionesPanel = ({ onClose }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marcandoTodas, setMarcandoTodas] = useState(false);
  const navigate = useNavigate();
  const controlador = useRef(null);

  const obtenerToken = () => localStorage.getItem("token");

  const cargarNotificaciones = useCallback(async () => {
    const token = obtenerToken();
    if (!token) {
      setLoading(false);
      return;
    }

    if (controlador.current) {
      controlador.current.abort();
    }
    controlador.current = new AbortController();

    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controlador.current.signal,
      });

      if (!res.ok) return;

      const data = await res.json();
      const lista = Array.isArray(data) ? data : data.notifications || [];
      setNotificaciones(lista);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error al cargar notificaciones:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarNotificaciones();
    return () => {
      if (controlador.current) {
        controlador.current.abort();
      }
    };
  }, [cargarNotificaciones]);

  const marcarComoLeida = async (id) => {
    const token = obtenerToken();
    if (!token) return;
    try {
      await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
    } catch (err) {
      console.error("Error al marcar como leída:", err);
    }
  };

  const marcarTodasComoLeidas = async () => {
    setMarcandoTodas(true);
    const token = obtenerToken();
    if (!token) {
      setMarcandoTodas(false);
      return;
    }

    const noLeidas = notificaciones.filter((n) => !n.leida);
    try {
      await Promise.all(
        noLeidas.map((n) =>
          fetch(`${BACKEND_URL}/api/notifications/${n.id}/read`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err);
    } finally {
      setMarcandoTodas(false);
    }
  };

  const handleClickNotificacion = async (notif) => {
    await marcarComoLeida(notif.id);
    onClose?.();

    const citaId = notif.appointment_id || notif.cita_id;
    if (citaId) {
      navigate(`/mis-citas#cita-${citaId}`);
    } else {
      navigate("/mis-citas");
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leida);

  return (
    <div
      className="position-absolute end-0 mt-2 bg-white rounded-4 shadow border"
      style={{ width: "380px", maxHeight: "480px", zIndex: 1050, overflow: "hidden" }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
        <h6 className="fw-bold mb-0">Notificaciones</h6>
        <div className="d-flex gap-2">
          {noLeidas.length > 0 && (
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={marcarTodasComoLeidas}
              disabled={marcandoTodas}
            >
              {marcandoTodas ? "Guardando..." : "Marcar todas como leídas"}
            </button>
          )}
          <button
            className="btn btn-sm btn-light"
            onClick={onClose}
            aria-label="Cerrar notificaciones"
          >
            <span className="material-symbols-outlined fs-6 align-middle">close</span>
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-auto" style={{ maxHeight: "420px" }}>
        {loading ? (
          <div className="p-4 text-center text-secondary">
            <div className="spinner-border spinner-border-sm me-2" role="status"></div>
            Cargando...
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="p-5 text-center">
            <span className="material-symbols-outlined fs-1 text-secondary">
              notifications_off
            </span>
            <p className="fw-semibold mt-2 mb-1">No tienes notificaciones</p>
            <p className="text-secondary small">
              Te avisaremos cuando tengas novedades
            </p>
          </div>
        ) : (
          notificaciones.map((notif) => {
            const config = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.cita_nueva;
            const esNoLeida = !notif.leida;

            return (
              <div
                key={notif.id}
                onClick={() => handleClickNotificacion(notif)}
                className={`d-flex align-items-start gap-3 p-3 border-bottom cursor-pointer ${
                  esNoLeida ? "bg-primary-subtle" : "bg-white"
                }`}
                style={{ cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={(e) => {
                  if (esNoLeida) {
                    e.currentTarget.style.background = "#e7f1ff";
                  } else {
                    e.currentTarget.style.background = "#f8f9fa";
                  }
                }}
                onMouseLeave={(e) => {
                  if (esNoLeida) {
                    e.currentTarget.style.background = "";
                  } else {
                    e.currentTarget.style.background = "";
                  }
                }}
              >
                {/* Icono */}
                <div
                  className={`rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 ${config.bg}`}
                  style={{ width: "40px", height: "40px" }}
                >
                  <span
                    className={`material-symbols-outlined ${config.color}`}
                    style={{ fontSize: "20px" }}
                  >
                    {config.icono}
                  </span>
                </div>

                {/* Contenido */}
                <div className="flex-grow-1 min-width-0">
                  <p
                    className={`mb-1 small ${
                      esNoLeida ? "fw-semibold text-dark" : "text-secondary"
                    }`}
                  >
                    {notif.mensaje || "Tienes una nueva notificación"}
                  </p>
                  <span className="text-secondary" style={{ fontSize: "0.75rem" }}>
                    {timeAgo(notif.created_at || notif.fecha || Date.now())}
                  </span>
                </div>

                {/* Indicador de no leída */}
                {esNoLeida && (
                  <span
                    className="rounded-circle flex-shrink-0"
                    style={{ width: "8px", height: "8px", background: "#0d6efd", marginTop: "6px" }}
                  ></span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
