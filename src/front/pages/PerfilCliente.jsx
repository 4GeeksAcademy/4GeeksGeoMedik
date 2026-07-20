import { Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const PerfilCliente = () => {
  const { store } = useGlobalReducer();

  return (
    <section className="bg-light min-vh-100 py-5" style={{ paddingTop: "90px" }}>
      <div className="container-xl">
        <div className="d-flex align-items-center gap-3 mb-4">
          <span
            className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-4"
            style={{ width: "56px", height: "56px" }}
          >
            C
          </span>
          <div>
            <h2 className="fw-bold mb-0">Perfil del Cliente</h2>
            <p className="text-secondary mb-0">Bienvenido a tu panel de control</p>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-primary">person</span>
                <h5 className="fw-bold mt-2">Mis Datos</h5>
                <p className="text-secondary small">Información personal y preferencias</p>
                <button className="btn btn-outline-primary w-100">Ver perfil</button>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-success">calendar_month</span>
                <h5 className="fw-bold mt-2">Mis Citas</h5>
                <p className="text-secondary small">Historial y próximas citas</p>
                <button className="btn btn-outline-primary w-100">Ver citas</button>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-3">
              <div className="card-body text-center">
                <span className="material-symbols-outlined fs-1 text-warning">description</span>
                <h5 className="fw-bold mt-2">Resultados</h5>
                <p className="text-secondary small">Exámenes y resultados médicos</p>
                <button className="btn btn-outline-primary w-100">Ver resultados</button>
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
