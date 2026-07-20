// Enlaces del footer organizados por columna
const enlaces = [
  { texto: "Inicio", href: "/" },
  { texto: "Nosotros", href: "#" },
  { texto: "Contacto", href: "#" },
];

const redesSociales = [
  { icono: "facebook", href: "#" },
  { icono: "twitter", href: "#" },
  { icono: "instagram", href: "#" },
  { icono: "youtube", href: "#" },
];

export const Footer = () => {
  return (
    <footer className="bg-light border-top py-5">
      <div className="container-xl">
        <div className="row g-4 align-items-start">
          <div className="col-md-4">
            <p className="fs-5 fw-bold text-primary mb-2">GeoMedic</p>
            <p className="text-secondary small">
              Revolucionando la atención médica en la ciudad de Caracas a través
              de la tecnología y la confianza.
            </p>
          </div>

          <div className="col-md-4">
            <h6 className="fw-bold text-uppercase small mb-3">Enlaces</h6>
            <ul className="list-unstyled">
              {enlaces.map((enlace) => (
                <li className="mb-2" key={enlace.texto}>
                  <a href={enlace.href} className="text-secondary text-decoration-none small">
                    {enlace.texto}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-md-4">
            <h6 className="fw-bold text-uppercase small mb-3">Redes Sociales</h6>
            <div className="d-flex gap-3">
              {redesSociales.map((red) => (
                <a
                  key={red.icono}
                  href={red.href}
                  className="text-secondary text-decoration-none"
                >
                  <span className="material-symbols-outlined fs-4">{red.icono}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <hr />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <p className="small text-secondary mb-0">
            &copy; 2024 GeoMedic Caracas. Todos los derechos reservados.
          </p>
          <span className="small text-secondary">
            <span className="material-symbols-outlined fs-6 align-middle me-1">location_on</span>
            Caracas, Venezuela
          </span>
        </div>
      </div>
    </footer>
  );
};