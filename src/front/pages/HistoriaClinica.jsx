import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_BACKEND_URL;

const ESTILO_BANNER = {
  background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 55%, #084298 100%)",
  height: "110px",
};

const TIPOS_SANGRE = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// Casillas de lo mas frecuente. Lo que no esté aquí va en el texto libre.
const ALERGIAS_COMUNES = [
  "Penicilina",
  "Aspirina o antiinflamatorios",
  "Sulfas",
  "Yodo o medio de contraste",
  "Latex",
  "Frutos secos",
  "Mariscos",
  "Huevo",
  "Polen",
];

const ENFERMEDADES_COMUNES = [
  "Hipertension",
  "Diabetes",
  "Asma",
  "Enfermedad cardiaca",
  "Enfermedad renal",
  "Problemas de tiroides",
  "Epilepsia",
  "Anemia",
  "Cancer",
];

const FORM_VACIO = {
  fecha_nacimiento: "",
  altura_cm: "",
  peso_kg: "",
  tipo_sangre: "",
  alergias_comunes: [],
  alergias: "",
  enfermedades_comunes: [],
  enfermedades: "",
  medicamentos: "",
  discapacidades: "",
  contacto_emergencia_nombre: "",
  contacto_emergencia_telefono: "",
};

// Bloque de casillas reutilizable
const Casillas = ({ nombre, opciones, seleccionadas, onToggle }) => (
  <div className="row g-2">
    {opciones.map((opcion) => {
      const id = `${nombre}-${opcion}`;
      return (
        <div className="col-sm-6 col-lg-4" key={opcion}>
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              id={id}
              checked={seleccionadas.includes(opcion)}
              onChange={() => onToggle(nombre, opcion)}
            />
            <label className="form-check-label small" htmlFor={id}>
              {opcion}
            </label>
          </div>
        </div>
      );
    })}
  </div>
);

const Seccion = ({ icono, titulo, descripcion, children }) => (
  <div className="card border-0 shadow-sm rounded-4 mb-4">
    <div className="card-body p-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <span
          className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center"
          style={{ width: "40px", height: "40px" }}
        >
          <span className="material-symbols-outlined">{icono}</span>
        </span>
        <div>
          <h5 className="fw-bold mb-0">{titulo}</h5>
          {descripcion && (
            <p className="text-secondary small mb-0">{descripcion}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  </div>
);

export const HistoriaClinica = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState(FORM_VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [actualizadoEn, setActualizadoEn] = useState(null);

  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol");

  useEffect(() => {
    if (!token || rol !== "cliente") {
      navigate("/login");
      return;
    }

    const controlador = new AbortController();

    const traerHistoria = async () => {
      try {
        const res = await fetch(`${API}/api/clients/me/historia`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controlador.signal,
        });

        if (res.status === 401 || res.status === 422) {
          localStorage.removeItem("token");
          localStorage.removeItem("rol");
          localStorage.removeItem("usuario");
          navigate("/login");
          return;
        }

        const data = await res.json();

        if (res.ok && data.historia) {
          const h = data.historia;
          setForm({
            fecha_nacimiento: h.fecha_nacimiento || "",
            altura_cm: h.altura_cm ?? "",
            peso_kg: h.peso_kg ?? "",
            tipo_sangre: h.tipo_sangre || "",
            alergias_comunes: h.alergias_comunes || [],
            alergias: h.alergias || "",
            enfermedades_comunes: h.enfermedades_comunes || [],
            enfermedades: h.enfermedades || "",
            medicamentos: h.medicamentos || "",
            discapacidades: h.discapacidades || "",
            contacto_emergencia_nombre: h.contacto_emergencia_nombre || "",
            contacto_emergencia_telefono: h.contacto_emergencia_telefono || "",
          });
          setActualizadoEn(h.actualizado_en);
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        setError("No se pudo cargar tu historia clinica");
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    };

    traerHistoria();
    return () => controlador.abort();
  }, []);

  const cambiar = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setExito("");
  };

  const alternarCasilla = (campo, valor) => {
    setForm((anterior) => {
      const actuales = anterior[campo];
      return {
        ...anterior,
        [campo]: actuales.includes(valor)
          ? actuales.filter((x) => x !== valor)
          : [...actuales, valor],
      };
    });
    setExito("");
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setExito("");
    setGuardando(true);

    try {
      const res = await fetch(`${API}/api/clients/me/historia`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "No se pudo guardar la historia clinica");
        return;
      }

      setActualizadoEn(data.historia?.actualizado_en || null);
      setExito("Tu historia clinica se guardo correctamente");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <section className="bg-light min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status" />
      </section>
    );
  }

  return (
    <section className="bg-light min-vh-100 pb-5" style={{ paddingTop: "90px" }}>
      <div className="container-xl">
        {/* Cabecera */}
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
          <div style={ESTILO_BANNER} />
          <div className="card-body p-4">
            <h2 className="fw-bold mb-1">Mi historia clinica</h2>
            <p className="text-secondary mb-0" style={{ maxWidth: "60ch" }}>
              Estos datos los vera unicamente el medico con el que tengas una
              cita agendada. Cuanto mas completos esten, mejor podra atenderte.
            </p>
            {actualizadoEn && (
              <p className="text-secondary small mb-0 mt-2 d-flex align-items-center gap-1">
                <span className="material-symbols-outlined fs-6">schedule</span>
                Ultima actualizacion:{" "}
                {new Date(actualizadoEn).toLocaleString("es-ES", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>
        </div>

        {exito && (
          <div className="alert alert-success d-flex align-items-center gap-2 rounded-4 border-0 shadow-sm">
            <span className="material-symbols-outlined">check_circle</span>
            {exito}
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 rounded-4 border-0 shadow-sm">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        <form onSubmit={guardar}>
          <Seccion
            icono="monitor_heart"
            titulo="Datos basicos"
            descripcion="Lo minimo que necesita un medico antes de una consulta"
          >
            <div className="row g-3">
              <div className="col-sm-6 col-lg-3">
                <label htmlFor="fecha_nacimiento" className="form-label fw-semibold small">
                  Fecha de nacimiento
                </label>
                <input
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  type="date"
                  className="form-control"
                  value={form.fecha_nacimiento}
                  onChange={cambiar}
                />
              </div>

              <div className="col-sm-6 col-lg-3">
                <label htmlFor="altura_cm" className="form-label fw-semibold small">
                  Altura (cm)
                </label>
                <input
                  id="altura_cm"
                  name="altura_cm"
                  type="number"
                  min="50"
                  max="250"
                  className="form-control"
                  placeholder="170"
                  value={form.altura_cm}
                  onChange={cambiar}
                />
              </div>

              <div className="col-sm-6 col-lg-3">
                <label htmlFor="peso_kg" className="form-label fw-semibold small">
                  Peso (kg)
                </label>
                <input
                  id="peso_kg"
                  name="peso_kg"
                  type="number"
                  min="2"
                  max="500"
                  step="0.1"
                  className="form-control"
                  placeholder="70"
                  value={form.peso_kg}
                  onChange={cambiar}
                />
              </div>

              <div className="col-sm-6 col-lg-3">
                <label htmlFor="tipo_sangre" className="form-label fw-semibold small">
                  Tipo de sangre
                </label>
                <select
                  id="tipo_sangre"
                  name="tipo_sangre"
                  className="form-select"
                  value={form.tipo_sangre}
                  onChange={cambiar}
                >
                  <option value="">No lo se</option>
                  {TIPOS_SANGRE.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Seccion>

          <Seccion
            icono="warning"
            titulo="Alergias"
            descripcion="El dato mas importante de la ficha: evita que te receten algo que te haga dano"
          >
            <Casillas
              nombre="alergias_comunes"
              opciones={ALERGIAS_COMUNES}
              seleccionadas={form.alergias_comunes}
              onToggle={alternarCasilla}
            />
            <label htmlFor="alergias" className="form-label fw-semibold small mt-3">
              Otras alergias
            </label>
            <textarea
              id="alergias"
              name="alergias"
              rows="2"
              className="form-control"
              placeholder="Indica cualquier otra alergia y como te afecta"
              value={form.alergias}
              onChange={cambiar}
            />
          </Seccion>

          <Seccion
            icono="clinical_notes"
            titulo="Enfermedades y condiciones"
            descripcion="Diagnosticos actuales o cronicos"
          >
            <Casillas
              nombre="enfermedades_comunes"
              opciones={ENFERMEDADES_COMUNES}
              seleccionadas={form.enfermedades_comunes}
              onToggle={alternarCasilla}
            />
            <label htmlFor="enfermedades" className="form-label fw-semibold small mt-3">
              Otras enfermedades o cirugias previas
            </label>
            <textarea
              id="enfermedades"
              name="enfermedades"
              rows="3"
              className="form-control"
              value={form.enfermedades}
              onChange={cambiar}
            />
          </Seccion>

          <Seccion
            icono="pill"
            titulo="Medicacion actual"
            descripcion="Incluye dosis y frecuencia si las sabes"
          >
            <textarea
              id="medicamentos"
              name="medicamentos"
              rows="3"
              className="form-control"
              placeholder="Ejemplo: Losartan 50 mg, una vez al dia por la manana"
              value={form.medicamentos}
              onChange={cambiar}
            />
          </Seccion>

          <Seccion
            icono="accessible"
            titulo="Discapacidad o necesidades especiales"
            descripcion="Para que la consulta se adapte a ti"
          >
            <textarea
              id="discapacidades"
              name="discapacidades"
              rows="2"
              className="form-control"
              placeholder="Movilidad reducida, discapacidad auditiva o visual, necesito interprete..."
              value={form.discapacidades}
              onChange={cambiar}
            />
          </Seccion>

          <Seccion
            icono="emergency"
            titulo="Contacto de emergencia"
            descripcion="A quien avisar si hace falta"
          >
            <div className="row g-3">
              <div className="col-md-6">
                <label
                  htmlFor="contacto_emergencia_nombre"
                  className="form-label fw-semibold small"
                >
                  Nombre
                </label>
                <input
                  id="contacto_emergencia_nombre"
                  name="contacto_emergencia_nombre"
                  type="text"
                  className="form-control"
                  value={form.contacto_emergencia_nombre}
                  onChange={cambiar}
                />
              </div>
              <div className="col-md-6">
                <label
                  htmlFor="contacto_emergencia_telefono"
                  className="form-label fw-semibold small"
                >
                  Telefono
                </label>
                <input
                  id="contacto_emergencia_telefono"
                  name="contacto_emergencia_telefono"
                  type="tel"
                  className="form-control"
                  value={form.contacto_emergencia_telefono}
                  onChange={cambiar}
                />
              </div>
            </div>
          </Seccion>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-lg fw-semibold d-flex align-items-center gap-2"
              disabled={guardando}
            >
              {guardando ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" />
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Guardar historia clinica
                </>
              )}
            </button>
            <Link to="/perfil-cliente" className="btn btn-outline-secondary btn-lg fw-semibold">
              Volver al perfil
            </Link>
          </div>
        </form>
      </div>
    </section>
  );
};
