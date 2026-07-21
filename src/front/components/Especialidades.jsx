// Sección de especialidades médicas (tarjetas con iconos, sin imágenes)
const especialidades = [
  {
    nombre: "Pediatría",
    descripcion: "Especialistas en el cuidado infantil",
    icono: "child_care",
    color: "text-danger bg-danger-subtle",
  },
  {
    nombre: "Cardiología",
    descripcion: "Cuidado avanzado para tu corazón",
    icono: "monitor_heart",
    color: "text-danger bg-danger-subtle",
  },
  {
    nombre: "Dermatología",
    descripcion: "Salud y estética para tu piel",
    icono: "healing",
    color: "text-warning bg-warning-subtle",
  },
  {
    nombre: "Ginecología",
    descripcion: "Salud integral de la mujer",
    icono: "female",
    color: "text-primary bg-primary-subtle",
  },
  {
    nombre: "Fisiatría",
    descripcion: "Rehabilitación y terapia física",
    icono: "accessibility_new",
    color: "text-success bg-success-subtle",
  },
  {
    nombre: "Medicina General",
    descripcion: "Atención primaria para toda la familia",
    icono: "stethoscope",
    color: "text-info bg-info-subtle",
  },
];

export const Especialidades = () => {
  return (
    <section className="py-5">
      <div className="container-xl py-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
          <div>
            <h2 className="fw-bold">Especialidades Médicas</h2>
            <p className="text-secondary mb-0">
              Contamos con expertos en más de 30 áreas de la salud para toda tu familia.
            </p>
          </div>
          <a href="#" className="text-primary fw-semibold text-decoration-none">
            Ver todas las especialidades
            <span className="material-symbols-outlined fs-6 align-middle ms-1">open_in_new</span>
          </a>
        </div>

        <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-4">
          {especialidades.map((especialidad) => (
            <div className="col" key={especialidad.nombre}>
              <div className="card h-100 border-0 shadow-sm rounded-4 p-3" role="button">
                <div className="card-body">
                  <div
                    className={`rounded-4 d-flex align-items-center justify-content-center mb-3 ${especialidad.color}`}
                    style={{ width: "56px", height: "56px" }}
                  >
                    <span className="material-symbols-outlined fs-4">{especialidad.icono}</span>
                  </div>
                  <h5 className="fw-semibold">{especialidad.nombre}</h5>
                  <p className="text-secondary small mb-0">{especialidad.descripcion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};