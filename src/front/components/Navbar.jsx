import { useState } from "react";
import { Link } from "react-router-dom";

// Único logo del proyecto (va solo en el navbar)
const LOGO_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBXLAcu67FCpeTOFCHu5mQFJ9wQj6Ww-vq0dM-jbr4MIHmAUAw0p4w8ilzfe24KLrkTT3E2VxADyVS3g_2XxJZ6vvDfruAkcBFO6cvcufmUNGFSwxyr303Z5UVHktzH4FoYhuQ39k7TUasOWG0inz-hWcb5BAYPpIXCLS_Bv9V4uBgV5fDHEudxEhmZI4UfJpjEGIV3pfR14aSAgHa9Y7FuKtwLbnfJNFWnNZKlRlB8O5K8uuBEjeXO3sxW_0qysEUXKqNDX2KVk5E";

// Opciones del menú desplegable según el rol (como en el wireframe).
// Cada opción es un link a una página que haremos después.
const opcionesDoctor = [
  { texto: "Perfil", icono: "person", ruta: "/perfil" },
  { texto: "Historial de consultas", icono: "history", ruta: "/historial-consultas" },
  { texto: "Calendario", icono: "calendar_month", ruta: "/calendario" },
];

const opcionesCliente = [
  { texto: "Perfil", icono: "person", ruta: "/perfil" },
  { texto: "Consultas", icono: "stethoscope", ruta: "/consultas" },
  { texto: "Calendario", icono: "calendar_month", ruta: "/calendario" },
];

export const Navbar = () => {
  // Usuario logueado. En el proyecto real este dato vendrá del login (context o backend).
  // Lo dejamos con un usuario de prueba para poder ver el menú desplegable.
  // Cambia el rol a "cliente" para ver el menú del cliente, o pon null para verlo deslogueado.
  const [usuario, setUsuario] = useState({ nombre: "Alejandro", rol: "doctor" });

  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  // Elegimos las opciones del menú según el rol del usuario
  const opcionesMenu =
    usuario && usuario.rol === "doctor" ? opcionesDoctor : opcionesCliente;

  return (
    <nav className="navbar navbar-expand-md bg-white shadow-sm fixed-top">
      <div className="container-xl">
        {/* Logo */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
          <img src={LOGO_URL} alt="Logo de GeoMedic" width="40" height="40" />
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
              <Link to="/" className="nav-link active fw-semibold text-primary">Home</Link>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link fw-semibold">Buscar Médicos</a>
            </li>
            <li className="nav-item">
              <a href="#" className="nav-link fw-semibold">Especialidades</a>
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
                    {usuario.nombre.charAt(0).toUpperCase()}
                  </span>
                  <span className="fw-semibold d-none d-sm-inline">{usuario.nombre}</span>
                  <span className="material-symbols-outlined">expand_more</span>
                </button>

                {/* Menú desplegable del usuario (doctor o cliente) */}
                {menuUsuarioAbierto && (
                  <div
                    className="position-absolute end-0 mt-2 bg-white rounded-4 shadow border p-3"
                    style={{ width: "260px", zIndex: 1050 }}
                  >
                    {/* Botón X para cerrar el menú (como en el wireframe) */}
                    <div className="d-flex justify-content-end mb-2">
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => setMenuUsuarioAbierto(false)}
                      >
                        <span className="material-symbols-outlined fs-6 align-middle">close</span>
                      </button>
                    </div>

                    {/* Links de navegación según el rol */}
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

                    {/* Cerrar sesión: no es una página, solo limpia el usuario */}
                    <button
                      className="btn btn-outline-danger w-100 d-flex align-items-center gap-2"
                      onClick={() => {
                        setMenuUsuarioAbierto(false);
                        setUsuario(null);
                      }}
                    >
                      <span className="material-symbols-outlined fs-5">logout</span>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Usuario sin login: botones de acceso
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary fw-semibold">Iniciar Sesión</button>
                <button className="btn btn-primary fw-semibold">Registrarse</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};