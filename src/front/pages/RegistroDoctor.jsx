import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logoGeoMedic from "../assets/img/geomedic-logo.png";

// Campos que pide el endpoint /api/signup/doctor
const camposFormulario = [
  { name: "name", label: "Nombre completo", tipo: "text", icono: "person", placeholder: "Dr. Juan Perez" },
  { name: "email", label: "Correo Electronico", tipo: "email", icono: "mail", placeholder: "tu@email.com" },
  { name: "phone_number", label: "Telefono", tipo: "tel", icono: "call", placeholder: "0412-1234567" },
  { name: "address", label: "Direccion del consultorio", tipo: "text", icono: "location_on", placeholder: "Caracas, Venezuela" },
  { name: "specialty", label: "Especialidad", tipo: "text", icono: "stethoscope", placeholder: "Cardiologia" },
  { name: "credentials", label: "Credenciales", tipo: "text", icono: "school", placeholder: "MPPS 12345, UCV" },
  { name: "id_number", label: "Cedula / ID profesional", tipo: "text", icono: "badge", placeholder: "V-12345678" },
  { name: "password", label: "Contrasena", tipo: "password", icono: "lock", placeholder: "********" },
  { name: "confirmar", label: "Confirmar contrasena", tipo: "password", icono: "lock", placeholder: "********" },
];

export const RegistroDoctor = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    address: "",
    specialty: "",
    credentials: "",
    id_number: "",
    password: "",
    confirmar: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const hayCampoVacio = Object.values(form).some((valor) => !valor.trim());
    if (hayCampoVacio) {
      setError("Todos los campos son obligatorios");
      return;
    }
    if (form.password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres");
      return;
    }
    if (form.password !== form.confirmar) {
      setError("Las contrasenas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/signup/doctor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone_number: form.phone_number,
          address: form.address,
          specialty: form.specialty,
          credentials: form.credentials,
          id_number: form.id_number,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "No se pudo crear la cuenta");
        return;
      }

      navigate("/login");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-primary-subtle min-vh-100 d-flex align-items-center py-5">
      <div className="container-xl">
        <div className="row justify-content-center">
          <div className="col-md-9 col-lg-7">
            <div className="text-center mb-4">
              <img src={logoGeoMedic} alt="GeoMedic Logo" width="72" height="72" className="mb-3" />
              <h1 className="fw-bold">Registro de Medicos</h1>
              <p className="text-secondary">
                Unete a nuestra red de especialistas en Caracas
              </p>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4">
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger py-2 small" role="alert">
                    <span className="material-symbols-outlined fs-6 align-middle me-1">error</span>
                    {error}
                  </div>
                )}

                <div className="row">
                  {camposFormulario.map((campo) => (
                    <div className="col-md-6 mb-3" key={campo.name}>
                      <label htmlFor={campo.name} className="form-label fw-semibold small">
                        {campo.label}
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light">
                          <span className="material-symbols-outlined">{campo.icono}</span>
                        </span>
                        <input
                          type={campo.tipo}
                          id={campo.name}
                          name={campo.name}
                          className="form-control"
                          placeholder={campo.placeholder}
                          value={form[campo.name]}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 btn-lg fw-semibold d-flex align-items-center justify-content-center gap-2 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      Registrarme como medico
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-secondary mb-0">
                  Ya tienes cuenta?{" "}
                  <Link to="/login" className="fw-bold text-primary text-decoration-none">
                    Inicia Sesion
                  </Link>
                  {" - "}
                  Eres paciente?{" "}
                  <Link to="/registro" className="fw-bold text-primary text-decoration-none">
                    Registrate aqui
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
