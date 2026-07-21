import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ModalConfirmacion } from "./ModalConfirmacion";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const DetalleDoctor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diaSel, setDiaSel] = useState(null);
  const [horaSel, setHoraSel] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalAgendarAbierto, setModalAgendarAbierto] = useState(false);
  const [fechaSel, setFechaSel] = useState("");
  const [exitoAgendar, setExitoAgendar] = useState(false);
  const [errorAgendar, setErrorAgendar] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/doctors/${id}`).then((r) => r.json()),
      fetch(`/api/doctors/${id}/availability`).then((r) => r.json()),
    ])
      .then(([docRes, availRes]) => {
        if (docRes.doctor) setDoctor(docRes.doctor);
        else setError(docRes.message || "Doctor no encontrado");
        if (availRes.availabilities) setAvailabilities(availRes.availabilities);
      })
      .catch(() => setError("Error al cargar los datos"))
      .finally(() => setLoading(false));
  }, [id]);

  const generarHoras = (start, end) => {
    const horas = [];
    let [h, m] = start.split(":").map(Number);
    const [he] = end.split(":").map(Number);
    while (h < he) {
      horas.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      h += 1;
    }
    return horas;
  };

  const seleccionarHora = (dia, hora) => {
    setDiaSel(dia);
    setHoraSel(hora);
    setModalAbierto(true);
  };

  const confirmarAgendar = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          doctor_id: parseInt(id),
          date_time: `${fechaSel}T${horaSel}:00`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExitoAgendar(false);
        setErrorAgendar(data.message || "No se pudo agendar la cita");
      } else {
        setExitoAgendar(true);
        setErrorAgendar(null);
      }
      setModalAbierto(false);
      setModalAgendarAbierto(true);
    } catch {
      setExitoAgendar(false);
      setErrorAgendar("Error de conexión. Intenta nuevamente.");
      setModalAbierto(false);
      setModalAgendarAbierto(true);
    }
  };

  if (loading)
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Cargando doctor...</p>
      </div>
    );

  if (error)
    return (
      <div className="container text-center mt-5">
        <span className="material-symbols-outlined text-danger" style={{ fontSize: "4rem" }}>error</span>
        <h3 className="mt-3">{error}</h3>
        <button className="btn btn-primary mt-3" onClick={() => navigate("/doctores")}>Volver</button>
      </div>
    );

  return (
    <div className="container-xl py-4" style={{ marginTop: "80px" }}>
      <button className="btn btn-outline-secondary mb-4" onClick={() => navigate("/doctores")}>
        ← Volver
      </button>

      <div className="card shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="row align-items-center">
            <div className="col-md-3 text-center">
              <img
                src={doctor.picture_url || "https://via.placeholder.com/200x200?text=Doctor"}
                alt={doctor.name}
                className="rounded-circle img-thumbnail"
                style={{ width: "150px", height: "150px", objectFit: "cover" }}
              />
            </div>
            <div className="col-md-6">
              <h2 className="fw-bold mb-1">{doctor.name}</h2>
              <p className="text-muted fs-5 mb-2">{doctor.specialty}</p>
              <div className="d-flex align-items-center gap-3">
                <span className="badge bg-light text-dark">C.I.: {doctor.id_number}</span>
                <span className="text-warning fw-semibold">
                  {"★".repeat(Math.round(doctor.average_rating || 0))}
                  {"☆".repeat(5 - Math.round(doctor.average_rating || 0))}
                  <small className="text-muted ms-1">
                    ({doctor.average_rating ? doctor.average_rating.toFixed(1) : "Sin"})
                  </small>
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column gap-2">
                <span className="text-muted small">
                  <strong>Email:</strong> {doctor.email}
                </span>
                <span className="text-muted small">
                  <strong>Tel:</strong> {doctor.phone_number}
                </span>
                <span className="text-muted small">
                  <strong>Dirección:</strong> {doctor.address}
                </span>
                <span className="text-muted small">
                  <strong>Credenciales:</strong> {doctor.credentials}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-7">
          <h4 className="fw-bold mb-3">Disponibilidad</h4>
          {availabilities.length === 0 ? (
            <div className="alert alert-info">No hay disponibilidad registrada.</div>
          ) : (
            <div className="row g-3">
              {availabilities.map((a) => {
                const horas = generarHoras(a.time_start, a.time_end);
                return (
                  <div key={a.id} className="col-md-6">
                    <div className="card h-100">
                      <div className="card-header bg-light fw-semibold">
                        {DIAS[a.day] || `Día ${a.day}`}
                      </div>
                      <div className="card-body d-flex flex-wrap gap-2">
                        {horas.map((h) => (
                          <button
                            key={h}
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => seleccionarHora(a.day, h)}
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-md-5">
          <h4 className="fw-bold mb-3">Reviews y experiencia</h4>
          <div className="card shadow-sm">
            <div className="card-body">
              <p className="text-muted mb-3">No hay reviews todavía. Placeholder mock:</p>
              <div className="border rounded p-3 mb-2">
                <strong>María González</strong> <span className="text-warning">★★★★★</span>
                <p className="mb-0 mt-1">Excelente atención, muy profesional y puntual.</p>
              </div>
              <div className="border rounded p-3">
                <strong>Carlos Pérez</strong> <span className="text-warning">★★★★☆</span>
                <p className="mb-0 mt-1">Muy buen doctor, pero la sala de espera estuvo algo llena.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalAbierto && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Agendar cita con {doctor.name}</h5>
                <button type="button" className="btn-close" onClick={() => setModalAbierto(false)}></button>
              </div>
              <div className="modal-body">
                <p><strong>Especialidad:</strong> {doctor.specialty}</p>
                <p><strong>Día:</strong> {DIAS[diaSel]}</p>
                <p><strong>Hora:</strong> {horaSel}</p>
                <div className="mb-3">
                  <label className="form-label">Fecha específica</label>
                  <input
                    type="date"
                    className="form-control"
                    value={fechaSel}
                    onChange={(e) => setFechaSel(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={confirmarAgendar}>
                  Confirmar cita
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ModalConfirmacion
        abierto={modalAgendarAbierto}
        onClose={() => setModalAgendarAbierto(false)}
        exito={exitoAgendar}
        doctor={doctor}
        dia={diaSel !== null ? DIAS[diaSel] : ""}
        hora={horaSel}
        fecha={fechaSel}
        error={errorAgendar}
      />
    </div>
  );
};

export default DetalleDoctor;
