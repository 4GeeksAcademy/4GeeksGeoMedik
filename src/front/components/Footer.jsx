// Enlaces del footer organizados por columna
const columnasFooter = [
  {
    titulo: "Compañía",
    enlaces: ["Sobre Nosotros", "Blog", "Carreras"],
  },
  {
    titulo: "Soporte",
    enlaces: ["Centro de Ayuda", "Contacto", "FAQ"],
  },
  {
    titulo: "Legal",
    enlaces: ["Privacidad", "Términos", "Cookies"],
  },
];

export const Footer = () => {
  return (
    <footer className="bg-light border-top py-5">
      <div className="container-xl">
        <div className="row g-4">
          <div className="col-md-4">
            <p className="fs-5 fw-bold text-primary mb-2">GeoMedic</p>
            <p className="text-secondary small">
              Revolucionando la atención médica en la ciudad de Caracas a través
              de la tecnología y la confianza.
            </p>
          </div>

          {columnasFooter.map((columna) => (
            <div className="col-6 col-md-2 offset-md-0" key={columna.titulo}>
              <h6 className="fw-bold text-uppercase small mb-3">{columna.titulo}</h6>
              <ul className="list-unstyled">
                {columna.enlaces.map((enlace) => (
                  <li className="mb-2" key={enlace}>
                    <a href="#" className="text-secondary text-decoration-none small">
                      {enlace}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
          <p className="small text-secondary mb-0">
            © 2024 GeoMedic Caracas. Todos los derechos reservados.
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