import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

const diasNombres = {
  0: "lunes", 1: "martes", 2: "miercoles", 3: "jueves",
  4: "viernes", 5: "sabado", 6: "domingo"
};

export const SeleccionarHora = ({ show, onClose, doctorId, doctorName, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [baseHours, setBaseHours] = useState(null);
  const [availableHours, setAvailableHours] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHour, setSelectedHour] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!show || !doctorId) return;
    setLoading(true);
    setError(null);
    setSelectedHour(null);
    setSelectedDate("");
    setAvailableHours([]);
    setBaseHours(null);

    fetch(`/api/doctors/${doctorId}/availability`)
      .then(r => r.json())
      .then(data => {
        if (data.error || data.message?.includes("no availability")) {
          setBaseHours({});
        } else if (data.availability) {
          setBaseHours(data.availability);
        } else {
          setBaseHours({});
        }
      })
      .catch(() => setError("Error al cargar disponibilidad"))
      .finally(() => setLoading(false));
  }, [show, doctorId]);

  useEffect(() => {
    if (!selectedDate || !doctorId) {
      setAvailableHours([]);
      setSelectedHour(null);
      return;
    }
    setLoading(true);
    setSelectedHour(null);

    fetch(`/api/doctors/${doctorId}/availability?fecha=${selectedDate}`)
      .then(r => r.json())
      .then(data => {
        if (data.availability && typeof data.availability === "object") {
          setAvailableHours(Object.values(data.availability).flat());
        } else {
          setAvailableHours([]);
        }
      })
      .catch(() => setError("Error al cargar horas disponibles"))
      .finally(() => setLoading(false));
  }, [selectedDate, doctorId]);

  const getDayNameForDate = useCallback((dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr + "T12:00:00");
    const jsDay = d.getDay();
    const modelDay = (jsDay + 6) % 7;
    return diasNombres[modelDay];
  }, []);

  const getHoursForSelectedDate = () => {
    const dayName = getDayNameForDate(selectedDate);
    if (!dayName || !baseHours || !baseHours[dayName]) return [];

    return baseHours[dayName].map(hour => ({
      hour,
      available: availableHours.includes(hour)
    }));
  };

  const handleConfirm = async () => {
    if (!selectedHour || !selectedDate) return;
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Debes iniciar sesión para agendar una cita");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const dateTime = `${selectedDate}T${selectedHour}:00`;
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ doctor_id: doctorId, date_time: dateTime })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al agendar cita");

      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const dayName = getDayNameForDate(selectedDate);
  const hoursForDate = getHoursForSelectedDate();
  const hasAvailable = hoursForDate.some(h => h.available);

  if (!show) return null;

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Seleccionar hora</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body">
            {doctorName && (
              <p className="text-muted mb-3">
                Agendando cita con: <strong>{doctorName}</strong>
              </p>
            )}

            {error && (
              <div className="alert alert-danger alert-dismissible fade show py-2">
                {error}
                <button type="button" className="btn-close py-2" onClick={() => setError(null)}></button>
              </div>
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold">Selecciona una fecha</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                min={todayStr}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Cargando horas disponibles...</p>
              </div>
            )}

            {!loading && baseHours && Object.keys(baseHours).length === 0 && (
              <div className="alert alert-info">El doctor no tiene disponibilidad configurada.</div>
            )}

            {!loading && selectedDate && baseHours && Object.keys(baseHours).length > 0 && (
              <>
                {dayName && !baseHours[dayName] && (
                  <div className="alert alert-info">El doctor no atiende este día.</div>
                )}

                {dayName && baseHours[dayName] && hoursForDate.length > 0 && !hasAvailable && (
                  <div className="alert alert-warning">Todas las horas están ocupadas para esta fecha.</div>
                )}

                {dayName && baseHours[dayName] && hoursForDate.length > 0 && (
                  <>
                    <p className="fw-semibold mb-2">
                      Horas disponibles para {dayName} ({selectedDate})
                    </p>
                    <div className="d-flex flex-wrap gap-2">
                      {hoursForDate.map(({ hour, available }) => (
                        <button
                          key={hour}
                          className={`btn btn-sm ${selectedHour === hour ? "btn-primary" : available ? "btn-outline-primary" : "btn-outline-secondary"}`}
                          disabled={!available}
                          onClick={() => setSelectedHour(hour)}
                        >
                          {hour}
                          {!available && (
                            <span className="material-symbols-outlined ms-1" style={{ fontSize: "14px", verticalAlign: "middle" }}>
                              block
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {dayName && baseHours[dayName] && hoursForDate.length === 0 && (
                  <div className="alert alert-info">No hay horas disponibles para esta fecha.</div>
                )}
              </>
            )}

            {!loading && !selectedDate && baseHours && Object.keys(baseHours).length > 0 && (
              <div className="alert alert-light text-center mb-0">
                Selecciona una fecha para ver las horas disponibles.
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button
              className="btn btn-primary"
              disabled={!selectedHour || submitting}
              onClick={handleConfirm}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  Agendando...
                </>
              ) : "Agendar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

SeleccionarHora.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  doctorId: PropTypes.number.isRequired,
  doctorName: PropTypes.string,
  onSuccess: PropTypes.func
};

export default SeleccionarHora;
