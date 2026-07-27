import { useEffect, useState } from "react";

export const HistorialCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [estado, setEstado] = useState("todas");
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();
    cargarCitas(controlador.signal);
    return () => controlador.abort();
  }, []);

  const obtenerToken = () => {
    return localStorage.getItem("token");
  };

  const cargarCitas = async (signal) => {
    try {
      setLoading(true);
      setError("");

      const token = obtenerToken();

      if (!token) {
        throw new Error(
          "Debes iniciar sesión para consultar tus citas."
        );
      }

      const respuesta = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/appointments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.message || "No fue posible cargar las citas."
        );
      }

      const listaCitas = Array.isArray(data)
        ? data
        : data.appointments || [];

      setCitas(listaCitas);
    } catch (error) {
      // Al desmontar cancelamos la peticion; ese error no es un fallo real
      if (error.name === "AbortError") return;
      console.error("Error al cargar citas:", error);
      setError(error.message);
      setCitas([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const cancelarCita = async (id) => {
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas cancelar esta cita?"
    );

    if (!confirmar) return;

    try {
      setProcesando(true);

      const token = obtenerToken();

      const respuesta = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/appointments/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "cancelada",
          }),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.message || "No fue posible cancelar la cita."
        );
      }

      await cargarCitas();
    } catch (error) {
      console.error("Error al cancelar la cita:", error);
      alert(error.message);
    } finally {
      setProcesando(false);
    }
  };

  const abrirModalReprogramar = (cita) => {
    setCitaSeleccionada(cita);
    setNuevaFecha("");
  };

  const cerrarModalReprogramar = () => {
    setCitaSeleccionada(null);
    setNuevaFecha("");
  };

  const reprogramarCita = async () => {
    if (!citaSeleccionada) return;

    if (!nuevaFecha) {
      alert("Selecciona una nueva fecha y hora.");
      return;
    }

    try {
      setProcesando(true);

      const token = obtenerToken();

      const respuesta = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/appointments/${citaSeleccionada.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            date_time: nuevaFecha,
          }),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.message || "No fue posible reprogramar la cita."
        );
      }

      cerrarModalReprogramar();
      await cargarCitas();
    } catch (error) {
      console.error("Error al reprogramar la cita:", error);
      alert(error.message);
    } finally {
      setProcesando(false);
    }
  };

  const citasFiltradas =
    estado === "todas"
      ? citas
      : citas.filter((cita) => cita.status === estado);

  const formatearFecha = (fecha) => {
    if (!fecha) return "Fecha no disponible";

    return new Date(fecha).toLocaleString("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatearEstado = (status) => {
    const estados = {
      agendada: "Agendada",
      confirmada: "Confirmada",
      cancelada: "Cancelada",
      completada: "Completada",
      pendiente: "Pendiente",
    };

    return estados[status] || status;
  };

  const obtenerClaseEstado = (status) => {
    const clases = {
      agendada: "bg-primary",
      pendiente: "bg-warning text-dark",
      confirmada: "bg-success",
      completada: "bg-secondary",
      cancelada: "bg-danger",
    };

    return clases[status] || "bg-secondary";
  };

  const citaPermiteAcciones = (cita) => {
    return !["cancelada", "completada"].includes(cita.status);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <div
          className="spinner-border text-primary"
          role="status"
        >
          <span className="visually-hidden">
            Cargando...
          </span>
        </div>

        <p className="mt-3">
          Cargando historial de citas...
        </p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="card shadow-sm">
        <div className="card-body">
          <h3 className="mb-4">
            Historial de Citas
          </h3>

          <div className="d-flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              className={`btn ${estado === "todas"
                  ? "btn-primary"
                  : "btn-outline-primary"
                }`}
              onClick={() => setEstado("todas")}
            >
              Todas
            </button>

            <button
              type="button"
              className={`btn ${estado === "agendada"
                  ? "btn-primary"
                  : "btn-outline-primary"
                }`}
              onClick={() => setEstado("agendada")}
            >
              Agendadas
            </button>

            <button
              type="button"
              className={`btn ${estado === "cancelada"
                  ? "btn-primary"
                  : "btn-outline-primary"
                }`}
              onClick={() => setEstado("cancelada")}
            >
              Canceladas
            </button>

            <button
              type="button"
              className={`btn ${estado === "completada"
                  ? "btn-primary"
                  : "btn-outline-primary"
                }`}
              onClick={() => setEstado("completada")}
            >
              Completadas
            </button>
          </div>

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {!error && citasFiltradas.length === 0 ? (
            <div className="alert alert-info">
              {citas.length === 0
                ? "Todavía no tienes citas registradas."
                : "No existen citas con el estado seleccionado."}
            </div>
          ) : (
            citasFiltradas.map((cita) => (
              <div
                key={cita.id}
                className="card mb-3"
              >
                <div className="card-body">
                  <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                    <div>
                      <h5 className="mb-2">
                        {cita.doctor?.name ||
                          cita.client?.name ||
                          "Usuario no disponible"}
                      </h5>

                      {cita.doctor?.specialty && (
                        <p className="mb-1">
                          <strong>
                            Especialidad:
                          </strong>{" "}
                          {cita.doctor.specialty}
                        </p>
                      )}

                      <p className="mb-1">
                        <strong>Fecha:</strong>{" "}
                        {formatearFecha(
                          cita.date_time
                        )}
                      </p>

                      <p className="mb-1">
                        <strong>Estado:</strong>{" "}
                        <span
                          className={`badge ${obtenerClaseEstado(
                            cita.status
                          )}`}
                        >
                          {formatearEstado(
                            cita.status
                          )}
                        </span>
                      </p>
                    </div>

                    <div className="d-flex flex-wrap align-items-start gap-2">
                      {citaPermiteAcciones(cita) && (
                        <>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={procesando}
                            onClick={() =>
                              cancelarCita(cita.id)
                            }
                          >
                            Cancelar
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            disabled={procesando}
                            onClick={() =>
                              abrirModalReprogramar(
                                cita
                              )
                            }
                          >
                            Reprogramar
                          </button>
                        </>
                      )}

                      {cita.video_link &&
                        citaPermiteAcciones(cita) && (
                          <a
                            href={cita.video_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-success btn-sm"
                          >
                            Unirse a videollamada
                          </a>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {citaSeleccionada && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block" }}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Reprogramar cita
                  </h5>

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    disabled={procesando}
                    onClick={
                      cerrarModalReprogramar
                    }
                  />
                </div>

                <div className="modal-body">
                  <p>
                    Selecciona una nueva fecha y hora
                    para la cita con{" "}
                    <strong>
                      {citaSeleccionada.doctor
                        ?.name ||
                        citaSeleccionada.client
                          ?.name}
                    </strong>
                    .
                  </p>

                  <label
                    htmlFor="nuevaFecha"
                    className="form-label"
                  >
                    Nueva fecha y hora
                  </label>

                  <input
                    id="nuevaFecha"
                    type="datetime-local"
                    className="form-control"
                    value={nuevaFecha}
                    min={new Date()
                      .toISOString()
                      .slice(0, 16)}
                    disabled={procesando}
                    onChange={(event) =>
                      setNuevaFecha(
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={procesando}
                    onClick={
                      cerrarModalReprogramar
                    }
                  >
                    Cerrar
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={
                      procesando || !nuevaFecha
                    }
                    onClick={reprogramarCita}
                  >
                    {procesando
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
};