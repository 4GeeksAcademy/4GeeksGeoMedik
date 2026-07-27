import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoGeoMedic from "../assets/img/geomedic-logo.png";
import { NotificacionesPanel } from "./NotificacionesPanel";

const API_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

// Opciones del menú desplegable según el rol
const opcionesDoctor = [
  { texto: "Perfil", icono: "person", ruta: "/perfil-doctor" },
  { texto: "Historial de consultas", icono: "history", ruta: "/historial-consultas" },
  { texto: "Calendario", icono: "calendar_month", ruta: "/calendario-doctor" },
];

const opcionesCliente = [
  { texto: "Perfil", icono: "person", ruta: "/perfil-cliente" },
  { texto: "Consultas", icono: "stethoscope", ruta: "/consultas" },
  { texto: "Calendario", icono: "calendar_month", ruta: "/calendario" },
];

export const Navbar = () => {
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [panelNotifAbierto, setPanelNotifAbierto] = useState(false);
  const navigate = useNavigate();

  // Leemos la sesión que guardó el Login en localStorage
  // rol: "cliente" o "doctor" | usuario: objeto con los datos del backend
  const rol = localStorage.getItem("rol");
  const usuarioGuardado = localStorage.getItem("usuario");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const token = localStorage.getItem("token");

  const opcionesMenu = rol === "doctor" ? opcionesDoctor : opcionesCliente;

  useEffect(() => {
    if (!token) {
      setNotificaciones([]);
      setNoLeidas(0);
      return;
    }

    const controlador = new AbortController();

    const cargarNotificaciones = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controlador.signal,
        });
        if (!res.ok) return;

        const data = await res.json();
        setNotificaciones(data.notifications || []);
        setNoLeidas(data.unread_count || 0);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error al cargar notificaciones:", error);
        }
      }
    };

    cargarNotificaciones();
    return () => controlador.abort();
  }, [token]);

  const marcarComoLeida = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      setNotificaciones(
        notificaciones.map((notificacion) =>
          notificacion.id === id
            ? { ...notificacion, leida: true }
            : notificacion
        )
      );
      setNoLeidas((cantidad) => Math.max(0, cantidad - 1));
    } catch (error) {
      console.error("Error al marcar notificacion:", error);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("usuario");
    setMenuUsuarioAbierto(false);
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-md bg-white shadow-sm fixed-top">
      <div className="container-xl">
        {/* Logo */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
          <img src={logoGeoMedic} alt="Logo de GeoMedic" width="40" height="40" />
          <span className="fs-4 fw-bold text-primary">GeoMedic</span>
        </Link>

        {/* Botón hamburguesa (solo móvil) */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#menuNavbar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="menuNavbar">
          {/* Links de navegación */}
          <ul className="navbar-nav mx-auto gap-md-3">
            <li className="nav-item">
              <Link to="/" className="nav-link fw-semibold">Home</Link>
            </li>
            {rol !== "doctor" && (
              <li className="nav-item">
                <Link to="/doctores" className="nav-link fw-semibold">Buscar Médicos</Link>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center gap-3">
            {/* Notificaciones */}
            {usuario && (
              <div className="position-relative">
                <button
                  className="btn btn-light rounded-circle position-relative"
                  onClick={() => setNotificacionesAbiertas(!notificacionesAbiertas)}
                >
                  <span className="material-symbols-outlined align-middle">notifications</span>
                  {noLeidas > 0 && (
                    <span className="position-absolute top-0 end-0 p-1 bg-danger rounded-circle border border-white"></span>
                  )}
                </button>

                {notificacionesAbiertas && (
                  <div
                    className="position-absolute end-0 mt-2 bg-white rounded-4 shadow border p-3"
                    style={{ width: "320px", zIndex: 1050 }}
                  >
                    <h6 className="fw-bold mb-3">Notificaciones</h6>
                    {notificaciones.length === 0 ? (
                      <p className="text-secondary small mb-0">No tienes notificaciones.</p>
                    ) : (
                      notificaciones.map((notificacion) => (
                        <div
                          key={notificacion.id}
                          className="border-bottom pb-2 mb-2"
                        >
                          <p className="small mb-2">{notificacion.mensaje}</p>
                          {!notificacion.leida && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => marcarComoLeida(notificacion.id)}
                            >
                              Marcar como leida
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="position-relative">
              <button
                className="btn btn-light rounded-circle position-relative"
                onClick={() => setPanelNotifAbierto(!panelNotifAbierto)}
                aria-label="Notificaciones"
              >
                <span className="material-symbols-outlined align-middle">notifications</span>
                <span className="position-absolute top-0 end-0 p-1 bg-danger rounded-circle border border-white"></span>
              </button>
              {panelNotifAbierto && (
                <NotificacionesPanel onClose={() => setPanelNotifAbierto(false)} />
              )}
            </div>

            {usuario ? (
              // Usuario logueado: avatar con su inicial que abre el menú desplegable
              <div className="position-relative">
                <button
                  className="btn btn-light d-flex align-items-center gap-2 rounded-pill"
                  onClick={() => setMenuUsuarioAbierto(!menuUsuarioAbierto)}
                >
                  <span
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: "32px", height: "32px" }}
                  >
                    {usuario.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="fw-semibold d-none d-sm-inline">{usuario.name}</span>
                  <span className="material-symbols-outlined">expand_more</span>
                </button>

                {/* Menú desplegable del usuario (doctor o cliente) */}
                {menuUsuarioAbierto && (
                  <div
                    className="position-absolute end-0 mt-2 bg-white rounded-4 shadow border p-3"
                    style={{ width: "260px", zIndex: 1050 }}
                  >
                    <div className="d-flex justify-content-end mb-2">
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => setMenuUsuarioAbierto(false)}
                      >
                        <span className="material-symbols-outlined fs-6 align-middle">close</span>
                      </button>
                    </div>

                    {/* Links según el rol */}
                    {opcionesMenu.map((opcion) => (
                      <Link
                        key={opcion.texto}
                        to={opcion.ruta}
                        onClick={() => setMenuUsuarioAbierto(false)}
                        className="btn btn-outline-secondary w-100 d-flex align-items-center gap-2 mb-2 text-start"
                      >
                        <span className="material-symbols-outlined fs-5">{opcion.icono}</span>
                        {opcion.texto}
                      </Link>
                    ))}

                    <hr />

                    <button
                      className="btn btn-outline-danger w-100 d-flex align-items-center gap-2"
                      onClick={cerrarSesion}
                    >
                      <span className="material-symbols-outlined fs-5">logout</span>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Usuario sin login: botones que llevan al login y al registro
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-primary fw-semibold">
                  Iniciar Sesión
                </Link>
                <Link to="/registro" className="btn btn-primary fw-semibold">
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
