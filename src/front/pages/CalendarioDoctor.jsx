import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

// Dias de la semana (el backend usa 0=Lunes ... 6=Domingo)
const diasSemana = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

// Calendario del doctor: gestiona su disponibilidad (horarios de atencion).
// Los clientes solo pueden agendar citas dentro de estos horarios.
export const CalendarioDoctor = () => {
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [dia, setDia] = useState(0);
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuario") || "null");
  const token = localStorage.getItem("token");

  // Trae los horarios del doctor logueado
  const traerDisponibilidad = async (signal) => {
    try {
      // Endpoint propio del medico: devuelve los horarios con su id, que es
      // lo que necesita el boton de borrar. El publico solo da huecos libres.
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/doctors/me/availability`,
        {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        }
      );
      const data = await res.json();
      if (res.ok) setDisponibilidades(data.availabilities || []);
    } catch (err) {
      // Al desmontar cancelamos la peticion; ese error no es un fallo real
      if (err.name === "AbortError") return;
      setError("No se pudo conectar con el servidor");
    } finally {
      if (!signal?.aborted) setCargando(false);
    }
  };

  useEffect(() => {
    if (!token || !usuario) {
      navigate("/login");
      return;
    }

    const controlador = new AbortController();
    traerDisponibilidad(controlador.signal);
    return () => controlador.abort();
  }, []);

  // Agrega un horario nuevo
  const agregarHorario = async (e) => {
    e.preventDefault();
    setError("");

    if (!horaInicio || !horaFin) {
      setError("Debes elegir hora de inicio y de fin");
      return;
    }
    if (horaInicio >= horaFin) {
      setError("La hora de inicio debe ser antes que la de fin");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          day: Number(dia),
          time_start: horaInicio,
          time_end: horaFin,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "No se pudo guardar el horario");
        return;
      }

      setHoraInicio("");
      setHoraFin("");
      traerDisponibilidad(); // refrescamos la lista
    } catch {
      setError("No se pudo conectar con el servidor");
    }
  };

  // Elimina un horario
  const eliminarHorario = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/availability/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      traerDisponibilidad();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
  };

  return (
    <section className="bg-light min-vh-100" style={{ paddingTop: "90px" }}>
      <div className="container-xl pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Mi disponibilidad</h2>
            <p className="text-secondary mb-0">
              Define los horarios en los que tus pacientes pueden agendar citas
            </p>
          </div>
          <Link to="/consultas" className="btn btn-outline-primary fw-semibold">
            Ver mis consultas
          </Link>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-4">
          {/* Formulario para agregar horario */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <div className="card-body">
                <h5 className="fw-bold mb-3">Agregar horario</h5>
                <form onSubmit={agregarHorario}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Dia de la semana</label>
                    <select
                      className="form-select"
                      value={dia}
                      onChange={(e) => setDia(e.target.value)}
                    >
                      {diasSemana.map((nombre, index) => (
                        <option key={nombre} value={index}>{nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="row">
                    <div className="col-6 mb-3">
                      <label className="form-label fw-semibold small">Desde</label>
                      <input
                        type="time"
                        className="form-control"
                        value={horaInicio}
                        onChange={(e) => setHoraInicio(e.target.value)}
                      />
                    </div>
                    <div className="col-6 mb-3">
                      <label className="form-label fw-semibold small">Hasta</label>
                      <input
                        type="time"
                        className="form-control"
                        value={horaFin}
                        onChange={(e) => setHoraFin(e.target.value)}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 fw-semibold">
                    Guardar horario
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Lista de horarios actuales */}
          <div className="col-lg-7">
            {cargando && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-secondary mt-2">Cargando horarios...</p>
              </div>
            )}

            {!cargando && disponibilidades && disponibilidades.length === 0 && (
              <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
                <span className="material-symbols-outlined fs-1 text-secondary">schedule</span>
                <p className="fw-semibold mt-2 mb-1">Aun no tienes horarios definidos</p>
                <p className="text-secondary small">
                  Agrega tu primer horario para que los pacientes puedan agendar contigo.
                </p>
              </div>
            )}

            {disponibilidades && disponibilidades.map((horario) => ( 
              <div key={horario.id} className="card border-0 shadow-sm rounded-4 mb-3">
                <div className="card-body d-flex align-items-center gap-3">
                  <div
                    className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: "48px", height: "48px" }}
                  >
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div className="flex-grow-1">
                    <p className="fw-bold mb-0">{diasSemana[horario.day]}</p>
                    <p className="text-secondary small mb-0">
                      {horario.time_start?.slice(0, 5)} - {horario.time_end?.slice(0, 5)}
                    </p>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => eliminarHorario(horario.id)}
                  >
                    <span className="material-symbols-outlined fs-6 align-middle">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
