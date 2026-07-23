import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Lista de doctores con buscador por nombre o especialidad
export const BuscarDoctores = () => {
  const [doctores, setDoctores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const traerDoctores = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/doctors`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Error al cargar los doctores");
          return;
        }
        setDoctores(data.doctors);
      } catch {
        setError("No se pudo conectar con el servidor");
      } finally {
        setCargando(false);
      }
    };
    traerDoctores();
  }, []);

  // Filtramos por nombre o especialidad segun lo que escriba el usuario
  const doctoresFiltrados = doctores.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <section className="bg-light min-vh-100" style={{ paddingTop: "90px" }}>
      <div className="container-xl pb-5">
        <div className="text-center mb-4">
          <h2 className="fw-bold">Buscar Medicos</h2>
          <p className="text-secondary">
            Encuentra a tu especialista y agenda tu cita
          </p>

          {/* Buscador */}
          <div className="input-group mx-auto" style={{ maxWidth: "500px" }}>
            <span className="input-group-text bg-white">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Busca por nombre o especialidad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        {cargando && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-secondary mt-2">Cargando doctores...</p>
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {!cargando && !error && doctoresFiltrados.length === 0 && (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
            <span className="material-symbols-outlined fs-1 text-secondary">person_search</span>
            <p className="fw-semibold mt-2 mb-1">
              {doctores.length === 0
                ? "Aun no hay doctores registrados"
                : "No encontramos doctores con esa busqueda"}
            </p>
            <p className="text-secondary small">
              {doctores.length === 0
                ? "Se el primero: registrate como medico desde el home."
                : "Intenta con otro nombre o especialidad."}
            </p>
          </div>
        )}

        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
          {doctoresFiltrados.map((doctor) => (
            <div className="col" key={doctor.id}>
              <div className="card h-100 border-0 shadow-sm rounded-4 text-center p-4">
                {/* Avatar con la inicial del doctor */}
                <div
                  className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-3 mx-auto mb-3"
                  style={{ width: "72px", height: "72px" }}
                >
                  {doctor.name.charAt(0).toUpperCase()}
                </div>
                <h5 className="fw-bold mb-1">{doctor.name}</h5>
                <p className="text-primary fw-semibold mb-1">{doctor.specialty}</p>
                <p className="text-secondary small mb-3">
                  <span className="material-symbols-outlined fs-6 align-middle me-1">location_on</span>
                  {doctor.address}
                </p>
                <Link
                  to={`/doctores/${doctor.id}`}
                  className="btn btn-outline-primary w-100 fw-semibold mt-auto"
                >
                  Ver perfil y agendar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
