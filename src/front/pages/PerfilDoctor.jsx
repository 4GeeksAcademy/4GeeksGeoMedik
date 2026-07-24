import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export const PerfilDoctor = () => {
  const [mostrarDatos, setMostrarDatos] = useState(false);
  const navigate = useNavigate();

  // Doctor guardado por el login
  const usuarioGuardado = localStorage.getItem("usuario");
  const usuario = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;

  useEffect(() => {
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
            <h2 className="fw-bold mb-0">Dr. {usuario.name}</h2>
            <p className="text-secondary mb-0">
              {usuario.specialty} - Gestiona tus consultas y horarios
            </p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-primary">person</span>
                <h5 className="fw-bold mt-2">Mi Perfil</h5>
                <p className="text-secondary small">Informacion profesional y credenciales</p>
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
                    <p className="mb-1"><strong>Especialidad:</strong> {usuario.specialty}</p>
                    <p className="mb-1"><strong>Credenciales:</strong> {usuario.credentials}</p>
                    <p className="mb-0"><strong>ID:</strong> {usuario.id_number}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-success">calendar_month</span>
                <h5 className="fw-bold mt-2">Mis Consultas</h5>
                <p className="text-secondary small">Citas agendadas con pacientes</p>
                <Link to="/consultas" className="btn btn-outline-primary w-100">
                  Ver consultas
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3 h-100">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-warning">schedule</span>
                <h5 className="fw-bold mt-2">Calendario</h5>
                <p className="text-secondary small">Tus proximas citas ordenadas</p>
                <Link to="/calendario-doctor" className="btn btn-outline-primary w-100">
                  Ver calendario
                </Link>
              </div>
            </div>
          </div>
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
