import { Link } from "react-router-dom";

// Solo enlaces a rutas que existen de verdad en routes.jsx.
// Los antiguos "Nosotros", "Contacto" y las redes sociales apuntaban a "#".
const navegacion = [
  { texto: "Inicio", ruta: "/" },
  { texto: "Buscar médicos", ruta: "/doctores" },
];

const cuenta = [
  { texto: "Iniciar sesión", ruta: "/login" },
  { texto: "Crear cuenta", ruta: "/registro" },
  { texto: "Registrarse como médico", ruta: "/registro-doctor" },
];

const ColumnaEnlaces = ({ titulo, enlaces }) => (
  <div className="col-6 col-lg-3">
    <h6 className="fw-bold text-uppercase small text-body-secondary mb-3">
      {titulo}
    </h6>
    <ul className="list-unstyled mb-0 d-grid gap-2">
      {enlaces.map((enlace) => (
        <li key={enlace.ruta}>
          <Link
            to={enlace.ruta}
            className="link-secondary link-underline-opacity-0 link-underline-opacity-75-hover small"
          >
            {enlace.texto}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export const Footer = () => {
  return (
    <footer className="bg-white border-top">
      <div className="container-xl py-5">
        <div className="row g-4">
          {/* Marca */}
          <div className="col-lg-6">
            <p className="fs-4 fw-bold text-primary mb-2">GeoMedic</p>
            <p className="text-body-secondary small mb-0" style={{ maxWidth: "42ch" }}>
              Consultas médicas en línea con especialistas verificados. Agenda tu
              cita, recibe la confirmación del médico y atiéndete por
              videollamada desde donde estés.
            </p>
          </div>

          <ColumnaEnlaces titulo="Navegación" enlaces={navegacion} />
          <ColumnaEnlaces titulo="Tu cuenta" enlaces={cuenta} />
        </div>
      </div>

      <div className="border-top">
        <div className="container-xl py-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
          <p className="small text-body-secondary mb-0">
            &copy; {new Date().getFullYear()} GeoMedic
          </p>
          <p className="small text-body-secondary mb-0 d-flex align-items-center gap-1">
            <span className="material-symbols-outlined fs-6">location_on</span>
            Caracas, Venezuela
          </p>
        </div>
      </div>
    </footer>
  );
};
