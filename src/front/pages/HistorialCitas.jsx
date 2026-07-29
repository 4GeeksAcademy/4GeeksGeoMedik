import { useEffect, useState } from "react";
import { Estrellas } from "../components/Estrellas";
import { ReminderBanner } from "../components/ReminderBanner";

export const HistorialCitas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [estado, setEstado] = useState("todas");
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [citaAResenar, setCitaAResenar] = useState(null);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [errorResena, setErrorResena] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [abriendoVideo, setAbriendoVideo] = useState(null);

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

  const abrirResena = (cita) => {
    setCitaAResenar(cita);
    setRating(0);
    setComentario("");
    setErrorResena("");
  };

  const enviarResena = async () => {
    if (rating < 1) {
      setErrorResena("Elige de 1 a 5 estrellas");
      return;
    }

    setProcesando(true);
    setErrorResena("");

    try {
      const respuesta = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/appointments/${citaAResenar.id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${obtenerToken()}`,
          },
          body: JSON.stringify({ rating, comentario }),
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        setErrorResena(data.message || "No se pudo guardar la resena");
        return;
      }

      setCitaAResenar(null);
      cargarCitas();
    } catch {
      setErrorResena("No se pudo conectar con el servidor");
    } finally {
      setProcesando(false);
    }
  };

  const citaPermiteAcciones = (cita) => {
    return !["cancelada", "completada"].includes(cita.status);
  };

  // La sala se abre 30 minutos antes de la hora y sigue disponible 1 hora
  // despues. El medico no tiene esta restriccion: el dirige la consulta.
  const MINUTOS_ANTES = 30;
  const MINUTOS_DESPUES = 60;

  const dentroDeVentana = (cita) => {
    if (!cita.date_time) return false;
    const inicio = new Date(cita.date_time).getTime();
    if (Number.isNaN(inicio)) return false;
    const ahora = Date.now();
    return (
      ahora >= inicio - MINUTOS_ANTES * 60000 &&
      ahora <= inicio + MINUTOS_DESPUES * 60000
    );
  };

  const puedeVideollamada = (cita) =>
    cita.status === "confirmada" && dentroDeVentana(cita);

  const unirseAVideollamada = async (cita) => {
    setVideoError("");
    setAbriendoVideo(cita.id);

    // Abrimos la pestana AHORA, antes del await. Si esperamos a la respuesta,
    // el navegador ya no la asocia al click y la bloquea como popup.
    const pestania = window.open("", "_blank", "noopener,noreferrer");

    try {
      const respuesta = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/appointments/${cita.id}/video`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${obtenerToken()}` },
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.message || "No se pudo abrir la videollamada."
        );
      }

      if (pestania) {
        pestania.location.href = data.video_link;
      } else {
        // El navegador bloqueo la pestana: al menos que no se quede colgado
        window.location.href = data.video_link;
      }

      cargarCitas();
    } catch (error) {
      if (pestania) pestania.close();
      setVideoError(error.message);
    } finally {
      setAbriendoVideo(null);
    }
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
          <ReminderBanner />

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

          {videoError && (
            <div className="alert alert-warning">
              {videoError}
            </div>
          )}

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

                      {cita.status === "completada" && (
                        <button
                          type="button"
                          className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1"
                          disabled={procesando}
                          onClick={() => abrirResena(cita)}
                        >
                          <span className="material-symbols-outlined fs-6">star</span>
                          Valorar consulta
                        </button>
                      )}

                      {puedeVideollamada(cita) && (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={abriendoVideo === cita.id}
                          onClick={() => unirseAVideollamada(cita)}
                        >
                          {abriendoVideo === cita.id
                            ? "Abriendo..."
                            : "Unirse a videollamada"}
                        </button>
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

      {citaAResenar && (
        <>
          <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Valorar consulta</h5>
                  <button type="button" className="btn-close" onClick={() => setCitaAResenar(null)} />
                </div>

                <div className="modal-body">
                  <p className="text-secondary small">
                    {citaAResenar.doctor?.name
                      ? `Consulta con ${citaAResenar.doctor.name}`
                      : "Cuentanos como fue la consulta"}
                  </p>

                  {errorResena && (
                    <div className="alert alert-danger py-2 small">{errorResena}</div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold small d-block">Tu valoracion</label>
                    <Estrellas valor={rating} onChange={setRating} tamano="fs-2" />
                  </div>

                  <label htmlFor="comentario" className="form-label fw-semibold small">
                    Comentario (opcional)
                  </label>
                  <textarea
                    id="comentario"
                    rows="3"
                    className="form-control"
                    maxLength={1000}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setCitaAResenar(null)}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={procesando}
                    onClick={enviarResena}
                  >
                    {procesando ? "Enviando..." : "Enviar valoracion"}
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