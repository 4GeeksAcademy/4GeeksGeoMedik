import { Link } from "react-router-dom";

const estadisticas = [
  { numero: "+500", texto: "Médicos verificados" },
  { numero: "+30", texto: "Especialidades" },
  { numero: "24/7", texto: "Atención disponible" },
];

// Tarjetas informativas del panel derecho
const tarjetasInfo = [
  { icono: "schedule", titulo: "Próxima cita disponible", detalle: "En 15 minutos", color: "text-primary bg-primary-subtle" },
  { icono: "video_chat", titulo: "Telemedicina", detalle: "Disponible ahora", color: "text-success bg-success-subtle" },
  { icono: "star", titulo: "Calificación promedio", detalle: "4.9 / 5.0", color: "text-warning bg-warning-subtle" },
];

export const Hero = () => {
  return (
    <section className="bg-primary-subtle py-5">
      <div className="container-xl py-4">
        <div className="row align-items-center g-5">
          {/* Columna izquierda: texto */}
          <div className="col-md-6">
            <span className="badge rounded-pill text-bg-primary mb-3 px-3 py-2">
              <span className="material-symbols-outlined fs-6 align-middle me-1">verified</span>
              Líderes en Salud Caracas
            </span>

            <h1 className="display-4 fw-bold">
              Tu salud a un <span className="text-primary">click</span> de distancia en Caracas
            </h1>

            <p className="lead text-secondary my-4">
              Encuentra los mejores especialistas, agenda tus citas de forma inmediata
              y recibe atención médica de calidad sin salir de casa.
            </p>

            <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
              {/* Agendar cita lleva a la lista de doctores */}
              <Link
                to="/doctores"
                className="btn btn-primary btn-lg d-flex align-items-center justify-content-center gap-2"
              >
                Agendar Cita
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              {/* El registro de médicos lleva a la página de registro */}
              <Link to="/registro" className="btn btn-outline-secondary btn-lg">
                ¿Eres médico? Regístrate
              </Link>
            </div>

            {/* Estadísticas rápidas */}
            <div className="row border-top pt-4">
              {estadisticas.map((stat) => (
                <div className="col-4" key={stat.texto}>
                  <p className="fs-3 fw-bold text-primary mb-0">{stat.numero}</p>
                  <p className="small text-secondary">{stat.texto}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha: panel con tarjetas (solo escritorio) */}
          <div className="col-md-6 d-none d-md-block">
            <div className="card border-0 shadow-lg rounded-4 p-4">
              {/* Icono grande central */}
              <div
                className="bg-primary text-white rounded-4 d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: "90px", height: "90px" }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>
                  medical_services
                </span>
              </div>
              <div className="text-center mb-4">
                <p className="fs-5 fw-bold mb-0">Atención médica confiable</p>
                <p className="small text-secondary">Agenda en menos de un minuto</p>
              </div>

              {/* Tarjetas informativas */}
              {tarjetasInfo.map((tarjeta) => (
                <div
                  className="card border-0 shadow-sm rounded-4 mb-3"
                  key={tarjeta.titulo}
                >
                  <div className="card-body d-flex align-items-center gap-3">
                    <div
                      className={`rounded-3 d-flex align-items-center justify-content-center ${tarjeta.color}`}
                      style={{ width: "48px", height: "48px" }}
                    >
                      <span className="material-symbols-outlined">{tarjeta.icono}</span>
                    </div>
                    <div>
                      <p className="small text-secondary mb-0">{tarjeta.titulo}</p>
                      <p className="fw-bold mb-0">{tarjeta.detalle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};