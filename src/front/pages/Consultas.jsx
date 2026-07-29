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
  const [procesando, setProcesando] = useState(null);

  const navigate = useNavigate();
  const rol = localStorage.getItem("rol");

  const token = localStorage.getItem("token");

  // El doctor mueve el estado de la cita. El backend ya comprueba que sea
  // suya; aqui solo decidimos que boton tiene sentido en cada estado.
  const cambiarEstado = async (cita, estado) => {
    setProcesando(cita.id);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/appointments/${cita.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: estado }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "No se pudo actualizar la cita");
        return;
      }

      setCitas((anteriores) =>
        anteriores.map((c) => (c.id === cita.id ? { ...c, status: estado } : c))
      );
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setProcesando(null);
    }
  };

  // El medico puede abrir la sala en cuanto la cita este confirmada, sin
  // esperar a la hora: es quien dirige la consulta.
  const abrirVideollamada = async (cita) => {
    setProcesando(cita.id);
    setError("");

    // La pestana se abre antes del await o el navegador la bloquea como popup
    const pestania = window.open("", "_blank", "noopener,noreferrer");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/appointments/${cita.id}/video`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        if (pestania) pestania.close();
        setError(data.message || "No se pudo abrir la videollamada");
        return;
      }

      if (pestania) pestania.location.href = data.video_link;
      else window.location.href = data.video_link;
    } catch {
      if (pestania) pestania.close();
      setError("No se pudo conectar con el servidor");
    } finally {
      setProcesando(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const controlador = new AbortController();

    const traerCitas = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controlador.signal,
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Error al cargar las citas");
          return;
        }
        setCitas(data);
      } catch (err) {
        // Al desmontar cancelamos la peticion; ese error no es un fallo real
        if (err.name === "AbortError") return;
        setError("No se pudo conectar con el servidor");
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    };

    traerCitas();
    return () => controlador.abort();
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
              <div className="d-flex flex-wrap align-items-center gap-2">
                <span className={`badge rounded-pill text-uppercase ${colorEstado(cita.status)}`}>
                  {cita.status}
                </span>

                {rol === "doctor" && cita.status === "agendada" && (
                  <button
                    type="button"
                    className="btn btn-sm btn-success fw-semibold"
                    disabled={procesando === cita.id}
                    onClick={() => cambiarEstado(cita, "confirmada")}
                  >
                    Confirmar
                  </button>
                )}

                {rol === "doctor" && cita.status === "confirmada" && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary fw-semibold d-flex align-items-center gap-1"
                      disabled={procesando === cita.id}
                      onClick={() => abrirVideollamada(cita)}
                    >
                      <span className="material-symbols-outlined fs-6">videocam</span>
                      Iniciar videollamada
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary fw-semibold"
                      disabled={procesando === cita.id}
                      onClick={() => cambiarEstado(cita, "completada")}
                    >
                      Marcar completada
                    </button>
                  </>
                )}

                {rol === "doctor" &&
                  !["cancelada", "completada"].includes(cita.status) && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      disabled={procesando === cita.id}
                      onClick={() => cambiarEstado(cita, "cancelada")}
                    >
                      Cancelar
                    </button>
                  )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
