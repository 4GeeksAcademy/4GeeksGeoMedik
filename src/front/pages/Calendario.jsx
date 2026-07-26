import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

// Calendario: proximas citas (agendadas o confirmadas) ordenadas por fecha
export const Calendario = () => {
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
          setError(data.message || "Error al cargar el calendario");
          return;
        }

        // Solo citas activas, ordenadas de la mas proxima a la mas lejana
        const proximas = data
          .filter((cita) => cita.status === "agendada" || cita.status === "confirmada")
          .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
        setCitas(proximas);
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
            <h2 className="fw-bold mb-1">Calendario</h2>
            <p className="text-secondary mb-0">Tus proximas citas ordenadas por fecha</p>
          </div>
          {rol !== "doctor" && (
            <Link to="/doctores" className="btn btn-primary fw-semibold">
              Agendar cita
            </Link>
          )}
        </div>

        {cargando && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-secondary mt-2">Cargando calendario...</p>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!cargando && !error && citas.length === 0 && (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
            <span className="material-symbols-outlined fs-1 text-secondary">calendar_month</span>
            <p className="fw-semibold mt-2 mb-1">No tienes citas proximas</p>
            <p className="text-secondary small">Tu agenda esta libre por ahora.</p>
          </div>
        )}

        {citas.map((cita) => {
          const fecha = new Date(cita.date_time);
          return (
            <div key={cita.id} className="card border-0 shadow-sm rounded-4 mb-3">
              <div className="card-body d-flex align-items-center gap-3">
                {/* Cuadro con el dia y el mes, estilo calendario */}
                <div
                  className="bg-primary text-white rounded-3 text-center flex-shrink-0 d-flex flex-column justify-content-center"
                  style={{ width: "60px", height: "60px" }}
                >
                  <p className="fw-bold fs-5 mb-0 lh-1">{fecha.getDate()}</p>
                  <p className="small mb-0 text-uppercase">
                    {fecha.toLocaleString("es-VE", { month: "short" })}
                  </p>
                </div>
                <div className="flex-grow-1">
                  <p className="fw-bold mb-0">
                    {rol === "doctor" ? cita.client?.name : cita.doctor?.name}
                  </p>
                  <p className="text-secondary small mb-0">
                    {fecha.toLocaleString("es-VE", { weekday: "long", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span
                  className={`badge rounded-pill text-uppercase ${
                    cita.status === "confirmada" ? "text-bg-success" : "text-bg-primary"
                  }`}
                >
                  {cita.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
