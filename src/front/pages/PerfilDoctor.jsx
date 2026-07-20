import { Link } from "react-router-dom";

export const PerfilDoctor = () => {
  return (
    <section className="bg-light min-vh-100 py-5" style={{ paddingTop: "90px" }}>
      <div className="container-xl">
        <div className="d-flex align-items-center gap-3 mb-4">
          <span
            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4"
            style={{ width: "56px", height: "56px" }}
          >
            D
          </span>
          <div>
            <h2 className="fw-bold mb-0">Perfil del Doctor</h2>
            <p className="text-secondary mb-0">Gestiona tus consultas y horarios</p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-primary">person</span>
                <h5 className="fw-bold mt-2">Mi Perfil</h5>
                <p className="text-secondary small">Información profesional y credenciales</p>
                <button className="btn btn-outline-primary w-100">Editar perfil</button>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-success">calendar_month</span>
                <h5 className="fw-bold mt-2">Mis Consultas</h5>
                <p className="text-secondary small">Citas agendadas con pacientes</p>
                <button className="btn btn-outline-primary w-100">Ver consultas</button>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-warning">schedule</span>
                <h5 className="fw-bold mt-2">Horarios</h5>
                <p className="text-secondary small">Gestiona tu disponibilidad</p>
                <button className="btn btn-outline-primary w-100">Gestionar</button>
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
