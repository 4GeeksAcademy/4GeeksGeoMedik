import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ModalConfirmacion } from "./ModalConfirmacion";
import { Estrellas } from "./Estrellas";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
// Devuelve las proximas 6 fechas que caen en ese dia de la semana. Antes el
// modal dejaba elegir cualquier fecha, y si no coincidia con el dia del hueco
// el backend la rechazaba con "Doctor not available on this day".
const proximasFechas = (indiceDia, cuantas = 6) => {
  if (indiceDia === null || indiceDia === undefined) return [];

  const fechas = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (let i = 0; i < 60 && fechas.length < cuantas; i++) {
    const f = new Date(hoy);
    f.setDate(hoy.getDate() + i);
    // getDay(): 0=domingo. El backend usa 0=lunes.
    const diaBackend = (f.getDay() + 6) % 7;
    if (diaBackend !== indiceDia) continue;

    fechas.push({
      valor: `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`,
      etiqueta: f.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }),
    });
  }

  return fechas;
};

const DIAS_API = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

export const DetalleDoctor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [availabilities, setAvailabilities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diaSel, setDiaSel] = useState(null);
  const [horaSel, setHoraSel] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalAgendarAbierto, setModalAgendarAbierto] = useState(false);
  const [fechaSel, setFechaSel] = useState("");
  const [exitoAgendar, setExitoAgendar] = useState(false);
  const [errorAgendar, setErrorAgendar] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [mediaReviews, setMediaReviews] = useState(null);

  useEffect(() => {
    if (!id) return;

    const controlador = new AbortController();
    const base = import.meta.env.VITE_BACKEND_URL;
    setLoading(true);

    Promise.all([
      fetch(`${base}/api/doctors/${id}`, { signal: controlador.signal }).then((r) => r.json()),
      fetch(`${base}/api/doctors/${id}/availability`, { signal: controlador.signal }).then((r) =>
        r.json()
      ),
      fetch(`${base}/api/doctors/${id}/reviews`, { signal: controlador.signal }).then((r) =>
        r.json()
      ),
    ])
      .then(([docRes, availRes, revRes]) => {
        setReviews(revRes.reviews || []);
        setMediaReviews(revRes.media ?? null);
        if (docRes.doctor) setDoctor(docRes.doctor);
        else setError(docRes.message || "Doctor no encontrado");
        if (availRes.availability) setAvailabilities(availRes.availability);
      })
      .catch((err) => {
        // Al desmontar cancelamos las peticiones; ese error no es un fallo real
        if (err.name === "AbortError") return;
        setError("Error al cargar los datos");
      })
      .finally(() => {
        if (!controlador.signal.aborted) setLoading(false);
      });

    return () => controlador.abort();
  }, [id]);

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
                <span className="d-flex align-items-center gap-1">
                  <Estrellas valor={mediaReviews ?? doctor.average_rating ?? 0} />
                  <small className="text-muted ms-1">
                    {mediaReviews
                      ? `${mediaReviews.toFixed(1)} · ${reviews.length} ${
                          reviews.length === 1 ? "reseña" : "reseñas"
                        }`
                      : "Sin valoraciones"}
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
          {Object.keys(availabilities).length === 0 ? (
            <div className="alert alert-info">No hay disponibilidad registrada.</div>
          ) : (
            <div className="row g-3">
              {Object.entries(availabilities).map(([dia, horas]) => {
                const numeroDia = DIAS_API.indexOf(dia);
                return (
                  <div key={dia} className="col-md-6">
                    <div className="card h-100">
                      <div className="card-header bg-light fw-semibold">
                        {DIAS[numeroDia]}
                      </div>
                      <div className="card-body d-flex flex-wrap gap-2">
                        {horas.map((h) => (
                          <button
                            key={h}
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => seleccionarHora(numeroDia, h)}
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
              {reviews.length === 0 ? (
                <div className="text-center py-4">
                  <span className="material-symbols-outlined fs-1 text-secondary">reviews</span>
                  <p className="fw-semibold mt-2 mb-1">Todavía no hay reseñas</p>
                  <p className="text-secondary small mb-0">
                    Las opiniones aparecerán aquí cuando los pacientes valoren sus consultas.
                  </p>
                </div>
              ) : (
                <div className="d-grid gap-3">
                  {reviews.map((r) => (
                    <div className="border rounded-4 p-3" key={r.id}>
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <strong>{r.cliente || "Paciente"}</strong>
                        <Estrellas valor={r.rating} tamano="fs-6" />
                      </div>
                      {r.comentario && <p className="mb-0 mt-2">{r.comentario}</p>}
                      {r.fecha_creacion && (
                        <p className="text-secondary small mb-0 mt-2">
                          {new Date(r.fecha_creacion).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                  <label className="form-label">Fecha</label>
                  <select
                    className="form-select"
                    value={fechaSel}
                    onChange={(e) => setFechaSel(e.target.value)}
                  >
                    <option value="">Elige una fecha</option>
                    {proximasFechas(diaSel).map((f) => (
                      <option key={f.valor} value={f.valor}>
                        {f.etiqueta}
                      </option>
                    ))}
                  </select>
                  <div className="form-text">
                    Solo se muestran los próximos {DIAS[diaSel]?.toLowerCase()}.
                  </div>
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
