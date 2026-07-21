import { useState } from "react";
import { Link } from "react-router-dom";

// Logo URL from existing Navbar
const LOGO_URL =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBXLAcu67FCpeTOFCHu5mQFJ9wQj6Ww-vq0dM-jbr4MIHmAUAw0p4w8ilzfe24KLrkTT3E2VxADyVS3g_2XxJZ6vvDfruAkcBFO6cvcufmUNGFSwxyr303Z5UVHktzH4FoYhuQ39k7TUasOWG0inz-hWcb5BAYPpIXCLS_Bv9V4uBgV5fDHEudxEhmZI4UfJpjEGIV3pfR14aSAgHa9Y7FuKtwLbnfJNFWnNZKlRlB8O5K8uuBEjeXO3sxW_0qysEUXKqNDX2KVE5E5MrY2Lv4OtNrV";

// Navigation options - using "Buscar Médicos" for the doctors list link
const opcionesDoctor = [
  { texto: "Perfil", icono: "person", ruta: "/perfil-doctor" },
  { texto: "Historial de consultas", icono: "history", ruta: "/historial-consultas" },
  { texto: "Calendario", icono: "calendar_month", ruta: "/calendario" },
];

const opcionesCliente = [
  { texto: "Perfil", icono: "person", ruta: "/perfil-cliente" },
  { texto: "Consultas", icono: "stethoscope", ruta: "/consultas" },
  { texto: "Calendario", icono: "calendar_month", ruta: "/calendario" },
];

export const Navbar = () => {
  const [usuario] = useState({ nombre: "Alejandro", rol: "doctor" });
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);

  const opcionesMenu =
    usuario && usuario.rol === "doctor" ? opcionesDoctor : opcionesCliente;

  return (
    <nav className="navbar navbar-expand-md bg-white shadow-sm fixed-top">
      <div className="container-xl">
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
          <img src={LOGO_URL} alt="Logo de GeoMedic" width="40" height="40" />
          <span className="fs-4 fw-bold text-primary">GeoMedic</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#menuNavbar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="menuNavbar">
          <ul className="navbar-nav mx-auto gap-md-3">
            <li className="nav-item">
              <Link to="/" className="nav-link fw-semibold">Home</Link>
            </li>

            {/* NEW: Link to Buscar Médicos page */}
            <li className="nav-item">
              <Link to="/doctores" className="nav-link fw-semibold">Buscar Médicos</Link>
            </li>

            <li className="nav-item">
              <Link to="/" className="nav-link fw-semibold">Especialidades</Link>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-light rounded-circle position-relative">
              <span className="material-symbols-outlined align-middle">notifications</span>
              <span className="position-absolute top-0 end-0 p-1 bg-danger rounded-circle border border-white"></span>
            </button>

            {usuario ? (
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

export default Navbar;