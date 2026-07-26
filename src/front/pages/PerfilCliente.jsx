import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AvatarPerfil } from "../components/AvatarPerfil";
import { HistorialCitas } from "./HistorialCitas";
import { archivoAImagenBase64 } from "../utils/imagen";

const API = import.meta.env.VITE_BACKEND_URL;

// Degradado con el azul primary de Bootstrap, para no salirnos de la paleta
const ESTILO_BANNER = {
  background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 55%, #084298 100%)",
  height: "140px",
};

// Campos editables del cliente
const CAMPOS = [
  { name: "name", label: "Nombre completo", icono: "person", type: "text" },
  { name: "email", label: "Correo electronico", icono: "mail", type: "email" },
  { name: "phone_number", label: "Telefono", icono: "call", type: "tel" },
  { name: "address", label: "Direccion", icono: "home", type: "text" },
];

const ACCESOS = [
  {
    titulo: "Mis citas",
    texto: "Historial y proximas citas",
    icono: "event_available",
    color: "success",
    ancla: "historial-citas",
  },
  {
    titulo: "Calendario",
    texto: "Tus proximas citas por fecha",
    icono: "calendar_month",
    color: "primary",
    ruta: "/calendario",
  },
  {
    titulo: "Buscar doctores",
    texto: "Encuentra tu especialista",
    icono: "search",
    color: "warning",
    ruta: "/doctores",
  },
];

const formatearFecha = (iso) => {
  if (!iso) return null;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const PerfilCliente = () => {
  const navigate = useNavigate();
  const inputFoto = useRef(null);

  const [usuario, setUsuario] = useState(null);

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [foto, setFoto] = useState(null); // data URL o null
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  // Cambio de contrasena
  const [abrirPassword, setAbrirPassword] = useState(false);
  const [passwords, setPasswords] = useState({ actual: "", nueva: "", repetir: "" });
  const [errorPassword, setErrorPassword] = useState("");
  const [exitoPassword, setExitoPassword] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);

  const token = localStorage.getItem("token");

  const cerrarSesionPorTokenInvalido = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  // Pintamos primero lo que hay en localStorage y luego refrescamos con la API
  useEffect(() => {
    const guardado = localStorage.getItem("usuario");
    if (!token || !guardado) {
      navigate("/login");
      return;
    }

    setUsuario(JSON.parse(guardado));

    const traerPerfil = async () => {
      try {
        const res = await fetch(`${API}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401 || res.status === 422) {
          cerrarSesionPorTokenInvalido();
          return;
        }

        const data = await res.json();
        if (res.ok && data.user) {
          setUsuario(data.user);
          localStorage.setItem("usuario", JSON.stringify(data.user));
        }
      } catch {
        // Si falla la red seguimos mostrando los datos de localStorage
      }
    };

    traerPerfil();
  }, []);

  const abrirEdicion = () => {
    setForm({
      name: usuario.name || "",
      email: usuario.email || "",
      phone_number: usuario.phone_number || "",
      address: usuario.address || "",
    });
    setFoto(usuario.picture_url || null);
    setError("");
    setExito("");
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setError("");
    if (inputFoto.current) inputFoto.current.value = "";
  };

  const cambiarCampo = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const elegirFoto = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    try {
      const base64 = await archivoAImagenBase64(archivo);
      setFoto(base64);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");

    for (const campo of CAMPOS) {
      if (!String(form[campo.name] || "").trim()) {
        setError(`El campo "${campo.label}" no puede quedar vacio`);
        return;
      }
    }

    setGuardando(true);

    try {
      const res = await fetch(`${API}/api/clients/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, picture_url: foto ?? "" }),
      });

      if (res.status === 401 || res.status === 422) {
        cerrarSesionPorTokenInvalido();
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "No se pudieron guardar los cambios");
        return;
      }

      setUsuario(data.client);
      localStorage.setItem("usuario", JSON.stringify(data.client));
      setEditando(false);
      setExito("Tus datos se actualizaron correctamente");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  };

  const guardarPassword = async (e) => {
    e.preventDefault();
    setErrorPassword("");
    setExitoPassword("");

    if (!passwords.actual || !passwords.nueva) {
      setErrorPassword("Completa los dos campos de contrasena");
      return;
    }
    if (passwords.nueva.length < 6) {
      setErrorPassword("La contrasena nueva debe tener al menos 6 caracteres");
      return;
    }
    if (passwords.nueva !== passwords.repetir) {
      setErrorPassword("Las contrasenas nuevas no coinciden");
      return;
    }

    setGuardandoPassword(true);

    try {
      const res = await fetch(`${API}/api/clients/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwords.actual,
          new_password: passwords.nueva,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorPassword(data.message || "No se pudo cambiar la contrasena");
        return;
      }

      setPasswords({ actual: "", nueva: "", repetir: "" });
      setAbrirPassword(false);
      setExitoPassword("Contrasena actualizada");
    } catch {
      setErrorPassword("No se pudo conectar con el servidor");
    } finally {
      setGuardandoPassword(false);
    }
  };

  if (!usuario) {
    return (
      <section className="bg-light min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status" />
      </section>
    );
  }

  const miembroDesde = formatearFecha(usuario.register_date);

  return (
    <section className="bg-light min-vh-100 pb-5" style={{ paddingTop: "90px" }}>
      <div className="container-xl">

        {/* ---------- Cabecera con foto ---------- */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div style={ESTILO_BANNER} />
          <div className="card-body px-4 pb-4 pt-0">
            <div className="d-flex flex-column flex-md-row align-items-center align-items-md-end gap-3">
              <div style={{ marginTop: "-56px" }}>
                <AvatarPerfil
                  nombre={usuario.name}
                  fotoUrl={usuario.picture_url}
                  tamano={112}
                />
              </div>

              <div className="flex-grow-1 text-center text-md-start pt-2">
                <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 flex-wrap">
                  <h2 className="fw-bold mb-0">{usuario.name}</h2>
                  <span className="badge rounded-pill bg-primary-subtle text-primary border border-primary-subtle">
                    Paciente
                  </span>
                </div>
                <p className="text-secondary mb-0 d-flex align-items-center justify-content-center justify-content-md-start gap-1">
                  <span className="material-symbols-outlined fs-6">mail</span>
                  {usuario.email}
                </p>
              </div>

              {!editando && (
                <button
                  className="btn btn-primary fw-semibold d-flex align-items-center gap-2 px-3"
                  onClick={abrirEdicion}
                >
                  <span className="material-symbols-outlined fs-5">edit</span>
                  Editar perfil
                </button>
              )}
            </div>
          </div>
        </div>

        {exito && (
          <div className="alert alert-success d-flex align-items-center gap-2 rounded-4 border-0 shadow-sm">
            <span className="material-symbols-outlined">check_circle</span>
            {exito}
          </div>
        )}

        <div className="row g-4">
          {/* ---------- Columna principal ---------- */}
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-2 mb-4">
                  <span className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
                        style={{ width: "40px", height: "40px" }}>
                    <span className="material-symbols-outlined">badge</span>
                  </span>
                  <div>
                    <h5 className="fw-bold mb-0">Informacion personal</h5>
                    <p className="text-secondary small mb-0">
                      {editando ? "Modifica tus datos y guarda los cambios" : "Tus datos de contacto"}
                    </p>
                  </div>
                </div>

                {/* --- Modo lectura --- */}
                {!editando && (
                  <div className="row g-3">
                    {CAMPOS.map((campo) => (
                      <div className="col-sm-6" key={campo.name}>
                        <div className="border rounded-4 p-3 h-100 bg-body-tertiary">
                          <p className="text-secondary small mb-1 d-flex align-items-center gap-1">
                            <span className="material-symbols-outlined fs-6">{campo.icono}</span>
                            {campo.label}
                          </p>
                          <p className="fw-semibold mb-0 text-break">
                            {usuario[campo.name] || <span className="text-secondary fw-normal">Sin definir</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* --- Modo edicion --- */}
                {editando && (
                  <form onSubmit={guardar}>
                    {error && (
                      <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small">
                        <span className="material-symbols-outlined fs-6">error</span>
                        {error}
                      </div>
                    )}

                    {/* Foto de perfil */}
                    <div className="d-flex align-items-center gap-3 mb-4 p-3 border rounded-4 bg-body-tertiary">
                      <AvatarPerfil
                        nombre={form.name}
                        fotoUrl={foto}
                        tamano={72}
                        conBorde={false}
                        className="border"
                      />
                      <div className="flex-grow-1">
                        <p className="fw-semibold mb-1">Foto de perfil</p>
                        <p className="text-secondary small mb-2">
                          JPG, PNG o WEBP. Se recorta en cuadrado automaticamente.
                        </p>
                        <div className="d-flex gap-2 flex-wrap">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                            onClick={() => inputFoto.current?.click()}
                          >
                            <span className="material-symbols-outlined fs-6">upload</span>
                            {foto ? "Cambiar foto" : "Subir foto"}
                          </button>
                          {foto && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                              onClick={() => {
                                setFoto(null);
                                if (inputFoto.current) inputFoto.current.value = "";
                              }}
                            >
                              <span className="material-symbols-outlined fs-6">delete</span>
                              Quitar
                            </button>
                          )}
                        </div>
                        <input
                          ref={inputFoto}
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={elegirFoto}
                        />
                      </div>
                    </div>

                    <div className="row g-3">
                      {CAMPOS.map((campo) => (
                        <div className="col-sm-6" key={campo.name}>
                          <label htmlFor={campo.name} className="form-label fw-semibold small">
                            {campo.label}
                          </label>
                          <div className="input-group">
                            <span className="input-group-text bg-white">
                              <span className="material-symbols-outlined fs-6">{campo.icono}</span>
                            </span>
                            <input
                              id={campo.name}
                              name={campo.name}
                              type={campo.type}
                              className="form-control"
                              value={form[campo.name] || ""}
                              onChange={cambiarCampo}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary fw-semibold d-flex align-items-center gap-2"
                        disabled={guardando}
                      >
                        {guardando ? (
                          <>
                            <span className="spinner-border spinner-border-sm" role="status" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined fs-5">save</span>
                            Guardar cambios
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary fw-semibold"
                        onClick={cancelarEdicion}
                        disabled={guardando}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* ---------- Seguridad ---------- */}
            <div className="card border-0 shadow-sm rounded-4 mt-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-2">
                    <span className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
                          style={{ width: "40px", height: "40px" }}>
                      <span className="material-symbols-outlined">lock</span>
                    </span>
                    <div>
                      <h5 className="fw-bold mb-0">Seguridad</h5>
                      <p className="text-secondary small mb-0">Cambia tu contrasena</p>
                    </div>
                  </div>
                  <button
                    className="btn btn-outline-primary fw-semibold"
                    onClick={() => setAbrirPassword(!abrirPassword)}
                  >
                    {abrirPassword ? "Cerrar" : "Cambiar"}
                  </button>
                </div>

                {exitoPassword && (
                  <div className="alert alert-success py-2 small mt-3 mb-0">{exitoPassword}</div>
                )}

                {abrirPassword && (
                  <form onSubmit={guardarPassword} className="mt-4 border-top pt-4">
                    {errorPassword && (
                      <div className="alert alert-danger py-2 small">{errorPassword}</div>
                    )}
                    <div className="row g-3">
                      <div className="col-md-4">
                        <label className="form-label fw-semibold small">Contrasena actual</label>
                        <input
                          type="password"
                          className="form-control"
                          value={passwords.actual}
                          onChange={(e) => setPasswords({ ...passwords, actual: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold small">Nueva contrasena</label>
                        <input
                          type="password"
                          className="form-control"
                          value={passwords.nueva}
                          onChange={(e) => setPasswords({ ...passwords, nueva: e.target.value })}
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label fw-semibold small">Repetir nueva</label>
                        <input
                          type="password"
                          className="form-control"
                          value={passwords.repetir}
                          onChange={(e) => setPasswords({ ...passwords, repetir: e.target.value })}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary fw-semibold mt-3"
                      disabled={guardandoPassword}
                    >
                      {guardandoPassword ? "Guardando..." : "Actualizar contrasena"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* ---------- Columna lateral ---------- */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-body p-4">
                <h6 className="fw-bold text-uppercase text-secondary small mb-3">Accesos rapidos</h6>
                <div className="d-grid gap-2">
                  {ACCESOS.map((acceso) => {
                    const contenido = (
                      <>
                        <span
                          className={`bg-${acceso.color}-subtle text-${acceso.color} rounded-3 d-flex align-items-center justify-content-center`}
                          style={{ width: "44px", height: "44px" }}
                        >
                          <span className="material-symbols-outlined">{acceso.icono}</span>
                        </span>
                        <span className="flex-grow-1">
                          <span className="d-block fw-semibold">{acceso.titulo}</span>
                          <span className="d-block text-secondary small">{acceso.texto}</span>
                        </span>
                        <span className="material-symbols-outlined text-secondary">
                          {acceso.ancla ? "expand_more" : "chevron_right"}
                        </span>
                      </>
                    );

                    const clases =
                      "d-flex align-items-center gap-3 p-3 rounded-4 border text-decoration-none text-body bg-body-tertiary text-start";

                    // El historial vive en esta misma pagina, asi que hacemos scroll
                    if (acceso.ancla) {
                      return (
                        <button
                          key={acceso.ancla}
                          type="button"
                          className={`btn ${clases} w-100`}
                          onClick={() =>
                            document
                              .getElementById(acceso.ancla)
                              ?.scrollIntoView({ behavior: "smooth" })
                          }
                        >
                          {contenido}
                        </button>
                      );
                    }

                    return (
                      <Link key={acceso.ruta} to={acceso.ruta} className={clases}>
                        {contenido}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {miembroDesde && (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body p-4 d-flex align-items-center gap-3">
                  <span className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
                        style={{ width: "44px", height: "44px" }}>
                    <span className="material-symbols-outlined">verified_user</span>
                  </span>
                  <div>
                    <p className="text-secondary small mb-0">Miembro desde</p>
                    <p className="fw-semibold mb-0">{miembroDesde}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Historial de citas incrustado (viene de la rama developer) */}
        <div id="historial-citas" className="mt-4">
          <HistorialCitas />
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-decoration-none text-secondary d-inline-flex align-items-center gap-1">
            <span className="material-symbols-outlined fs-5">arrow_back</span>
            Volver al inicio
          </Link>
        </div>
      </div>
    </section>
  );
};
