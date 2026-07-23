import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// Color del badge segun el estado de la cita
const colorEstado = (estado) => {
  if (estado === "confirmada") return "text-bg-success";
  if (estado === "agendada") return "text-bg-primary";
  if (estado === "cancelada") return "text-bg-danger";
  return "text-bg-secondary"; // completada
};

// Pagina de consultas: muestra las citas del usuario logueado.
// La API ya filtra por rol (cliente ve sus citas, doctor ve las suyas).
export const Consultas = () => {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const rol = localStorage.getItem("rol");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const traerCitas = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Error al cargar las citas");
          return;
        }
        setCitas(data);
      } catch {
        setError("No se pudo conectar con el servidor");
      } finally {
        setCargando(false);
      }
    };

    traerCitas();
  }, []);

  return (
    <section className="bg-light min-vh-100" style={{ paddingTop: "90px" }}>
      <div className="container-xl pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">
              {rol === "doctor" ? "Consultas con pacientes" : "Mis Consultas"}
            </h2>
            <p className="text-secondary mb-0">Todas tus citas medicas en un solo lugar</p>
          </div>
          {rol !== "doctor" && (
            <Link to="/doctores" className="btn btn-primary fw-semibold">
              Agendar nueva cita
            </Link>
          )}
        </div>

        {cargando && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-secondary mt-2">Cargando citas...</p>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!cargando && !error && citas.length === 0 && (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
            <span className="material-symbols-outlined fs-1 text-secondary">event_busy</span>
            <p className="fw-semibold mt-2 mb-1">No tienes citas todavia</p>
            <p className="text-secondary small">
              {rol === "doctor"
                ? "Cuando los pacientes agenden contigo, apareceran aqui."
                : "Busca un doctor y agenda tu primera cita."}
            </p>
          </div>
        )}

        {citas.map((cita) => (
          <div key={cita.id} className="card border-0 shadow-sm rounded-4 mb-3">
            <div className="card-body d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <span className="material-symbols-outlined">stethoscope</span>
                </div>
                <div>
                  {/* Si soy cliente veo al doctor, si soy doctor veo al paciente */}
                  <p className="fw-bold mb-0">
                    {rol === "doctor" ? cita.client?.name : cita.doctor?.name}
                  </p>
                  <p className="text-secondary small mb-0">
                    {new Date(cita.date_time).toLocaleString("es-VE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
              </div>
              <span className={`badge rounded-pill text-uppercase ${colorEstado(cita.status)}`}>
                {cita.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
