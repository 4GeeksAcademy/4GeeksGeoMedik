import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CampoPassword } from "../components/CampoPassword";
import logoGeoMedic from "../assets/img/geomedic-logo.png";

export const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Todos los campos son obligatorios");
      return;
    }

    setLoading(true);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const intentarLogin = async (ruta) => {
      const res = await fetch(backendUrl + ruta, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    };

    const clientRes = await intentarLogin("/api/login/client");

    if (clientRes.ok && clientRes.data.client) {
      localStorage.setItem("token", clientRes.data.token);
      localStorage.setItem("rol", "cliente");
      localStorage.setItem("usuario", JSON.stringify(clientRes.data.client));
      setLoading(false);
      navigate("/perfil-cliente");
      return;
    }

    if (clientRes.status === 401) {
      setError("Credenciales inválidas");
      setLoading(false);
      return;
    }

    const doctorRes = await intentarLogin("/api/login/doctor");

    if (doctorRes.ok && doctorRes.data.doctor) {
      localStorage.setItem("token", doctorRes.data.token);
      localStorage.setItem("rol", "doctor");
      localStorage.setItem("usuario", JSON.stringify(doctorRes.data.doctor));
      setLoading(false);
      navigate("/perfil-doctor");
      return;
    }

    if (doctorRes.status === 401) {
      setError("Credenciales inválidas");
    } else {
      setError("Usuario no encontrado");
    }

    setLoading(false);
  };

  return (
    <section className="bg-primary-subtle min-vh-100 d-flex align-items-center py-5">
      <div className="container-xl">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="text-center mb-4">
              <img
                src={logoGeoMedic}
                alt="GeoMedic Logo"
                width="72"
                height="72"
                className="mb-3"
              />
              <h1 className="fw-bold">Iniciar Sesión</h1>
              <p className="text-secondary">
                Accede a tu cuenta de GeoMedic
              </p>
            </div>

            <div className="card border-0 shadow-sm rounded-4 p-4">
              <form onSubmit={handleSubmit}>
                {error && (
                  <div className="alert alert-danger py-2 small" role="alert">
                    <span className="material-symbols-outlined fs-6 align-middle me-1">
                      error
                    </span>
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold small">
                    Correo Electrónico
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <span className="material-symbols-outlined">mail</span>
                    </span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      placeholder="tu@email.com"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label fw-semibold small">
                    Contraseña
                  </label>
                  <CampoPassword
                    icono="lock"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 btn-lg fw-semibold d-flex align-items-center justify-content-center gap-2 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" />
                      Ingresando...
                    </>
                  ) : (
                    <>
                      Ingresar
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-4 pt-3 border-top">
                <p className="text-secondary mb-0">
                  ¿No tienes cuenta?{" "}
                  <Link
                    to="/registro"
                    className="fw-bold text-primary text-decoration-none"
                  >
                    Regístrate
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
