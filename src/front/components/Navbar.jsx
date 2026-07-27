import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logoGeoMedic from "../assets/img/geomedic-logo.png";

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
  const navigate = useNavigate();

  // Leemos la sesión que guardó el Login en localStorage
  // rol: "cliente" o "doctor" | usuario: objeto con los datos del backend
  const rol = localStorage.getItem("rol");
  const usuarioGuardado = localStorage.getItem("usuario");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  const opcionesMenu = rol === "doctor" ? opcionesDoctor : opcionesCliente;

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
            <li className="nav-item">
              <Link to="/doctores" className="nav-link fw-semibold">Buscar Médicos</Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            {/* Notificaciones */}
            <button className="btn btn-light rounded-circle position-relative">
              <span className="material-symbols-outlined align-middle">notifications</span>
              <span className="position-absolute top-0 end-0 p-1 bg-danger rounded-circle border border-white"></span>
            </button>

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
