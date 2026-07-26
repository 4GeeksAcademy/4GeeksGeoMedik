import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HistorialCitas } from "./HistorialCitas";

export const PerfilCliente = () => {
  const [mostrarDatos, setMostrarDatos] = useState(false);
  const navigate = useNavigate();

  // Usuario guardado por el login
  const usuarioGuardado = localStorage.getItem("usuario");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  useEffect(() => {
    // Si no hay sesion, al login
    if (!usuario) navigate("/login");
  }, []);

  if (!usuario) return null;

  return (
    <section className="bg-light min-vh-100 py-5" style={{ paddingTop: "90px" }}>
      <div className="container-xl">
        <div className="d-flex align-items-center gap-3 mb-4">
          <span
            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4"
            style={{ width: "56px", height: "56px" }}
          >
            {usuario.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h2 className="fw-bold mb-0">Bienvenido, {usuario.name}</h2>
            <p className="text-secondary mb-0">Bienvenido a tu panel de control</p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-primary">person</span>
                <h5 className="fw-bold mt-2">Mis Datos</h5>
                <p className="text-secondary small">Informacion personal y preferencias</p>
                {/* Muestra/oculta los datos del usuario */}
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => setMostrarDatos(!mostrarDatos)}
                >
                  {mostrarDatos ? "Ocultar datos" : "Ver perfil"}
                </button>

                {mostrarDatos && (
                  <div className="text-start mt-3 border-top pt-3 small">
                    <p className="mb-1"><strong>Nombre:</strong> {usuario.name}</p>
                    <p className="mb-1"><strong>Email:</strong> {usuario.email}</p>
                    <p className="mb-1"><strong>Telefono:</strong> {usuario.phone_number}</p>
                    <p className="mb-0"><strong>Direccion:</strong> {usuario.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-success">calendar_month</span>
                <h5 className="fw-bold mt-2">Mis Citas</h5>

                <p className="text-secondary small">Historial y próximas citas</p>
                <button
                  className="btn btn-outline-primary w-100"
                  onClick={() => {
                    document
                      .getElementById("historial-citas")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Ver citas
                </button>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-warning">search</span>
                <h5 className="fw-bold mt-2">Buscar Doctores</h5>
                <p className="text-secondary small">Encuentra tu especialista y agenda</p>
                <Link to="/doctores" className="btn btn-outline-primary w-100">
                  Buscar
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div id="historial-citas">
          <HistorialCitas />
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-decoration-none text-secondary">
            <span className="material-symbols-outlined align-middle fs-5">arrow_back</span> Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
};
