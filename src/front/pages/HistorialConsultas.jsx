import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Historial: solo las citas que ya pasaron (completadas o canceladas)
export const HistorialConsultas = () => {
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

    const traerHistorial = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Error al cargar el historial");
          return;
        }

        // Nos quedamos solo con las citas terminadas o canceladas
        const pasadas = data.filter(
          (cita) => cita.status === "completada" || cita.status === "cancelada"
        );
        setCitas(pasadas);
      } catch {
        setError("No se pudo conectar con el servidor");
      } finally {
        setCargando(false);
      }
    };

    traerHistorial();
  }, []);

  return (
    <section className="bg-light min-vh-100" style={{ paddingTop: "90px" }}>
      <div className="container-xl pb-5">
        <h2 className="fw-bold mb-1">Historial de consultas</h2>
        <p className="text-secondary mb-4">Tus consultas finalizadas y canceladas</p>

        {cargando && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-secondary mt-2">Cargando historial...</p>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!cargando && !error && citas.length === 0 && (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
            <span className="material-symbols-outlined fs-1 text-secondary">history</span>
            <p className="fw-semibold mt-2 mb-1">Aun no hay consultas en tu historial</p>
            <p className="text-secondary small">
              Aqui apareceran las consultas cuando se completen o cancelen.
            </p>
          </div>
        )}

        {citas.map((cita) => (
          <div key={cita.id} className="card border-0 shadow-sm rounded-4 mb-3">
            <div className="card-body d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="bg-secondary-subtle text-secondary rounded-3 d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px" }}
                >
                  <span className="material-symbols-outlined">history</span>
                </div>
                <div>
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
              <span
                className={`badge rounded-pill text-uppercase ${
                  cita.status === "completada" ? "text-bg-success" : "text-bg-danger"
                }`}
              >
                {cita.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
