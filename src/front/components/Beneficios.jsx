// Sección "¿Por qué elegir GeoMedic?"
const beneficios = [
  {
    icono: "verified_user",
    titulo: "Médicos Verificados",
    descripcion:
      "Cada profesional en nuestra red pasa por un riguroso proceso de validación de credenciales.",
    color: "text-primary bg-primary-subtle",
  },
  {
    icono: "video_chat",
    titulo: "Telemedicina",
    descripcion:
      "Atención médica remota con alta calidad de video para consultas desde cualquier lugar.",
    color: "text-success bg-success-subtle",
  },
  {
    icono: "payments",
    titulo: "Pagos Seguros",
    descripcion:
      "Múltiples métodos de pago integrados con la mayor seguridad para tu tranquilidad.",
    color: "text-secondary bg-secondary-subtle",
  },
];

export const Beneficios = () => {
  return (
    <section className="bg-light py-5">
      <div className="container-xl py-4">
        <div className="text-center mb-5">
          <h2 className="fw-bold">¿Por qué elegir GeoMedic?</h2>
          <p className="text-secondary mx-auto" style={{ maxWidth: "600px" }}>
            Simplificamos el acceso a la salud con tecnología de vanguardia y los
            mejores profesionales de Caracas.
          </p>
        </div>

        <div className="row g-4">
          {beneficios.map((beneficio) => (
            <div className="col-md-4" key={beneficio.titulo}>
              <div className="card h-100 border-0 shadow-sm rounded-4 text-center p-4">
                <div
                  className={`rounded-4 d-flex align-items-center justify-content-center mx-auto mb-3 ${beneficio.color}`}
                  style={{ width: "64px", height: "64px" }}
                >
                  <span className="material-symbols-outlined fs-3">{beneficio.icono}</span>
                </div>
                <h5 className="fw-semibold">{beneficio.titulo}</h5>
                <p className="text-secondary small mb-0">{beneficio.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};