const tarjetas = [
  {
    icono: "search",
    titulo: "Busca tu Doctor",
    descripcion:
      "Encuentra al especialista que necesitas entre cientos de médicos verificados en Caracas.",
    color: "text-primary bg-primary-subtle",
  },
  {
    icono: "calendar_add_on",
    titulo: "Agenda Fácil",
    descripcion:
      "Agenda tu cita en segundos, sin llamadas ni esperas. Elige el día y la hora que prefieras.",
    color: "text-success bg-success-subtle",
  },
  {
    icono: "videocam",
    titulo: "Videollamadas",
    descripcion:
      "Conecta con tu médico desde casa a través de videollamadas seguras y de alta calidad.",
    color: "text-warning bg-warning-subtle",
  },
  {
    icono: "support",
    titulo: "Atención 24/7",
    descripcion:
      "Soporte disponible todos los días para resolver cualquier duda o inconveniente.",
    color: "text-info bg-info-subtle",
  },
];

export const CardsGrid = () => {
  return (
    <section className="py-5">
      <div className="container-xl py-4">
        <div className="text-center mb-5">
          <h2 className="fw-bold">Todo lo que necesitas</h2>
          <p className="text-secondary mx-auto" style={{ maxWidth: "600px" }}>
            Una plataforma completa para cuidar tu salud de manera fácil, rápida y
            segura.
          </p>
        </div>

        <div className="row g-4">
          {tarjetas.map((tarjeta) => (
            <div className="col-md-6 col-lg-3" key={tarjeta.titulo}>
              <div className="card h-100 border-0 shadow-sm rounded-4 text-center p-4">
                <div
                  className={`rounded-4 d-flex align-items-center justify-content-center mx-auto mb-3 ${tarjeta.color}`}
                  style={{ width: "64px", height: "64px" }}
                >
                  <span className="material-symbols-outlined fs-3">
                    {tarjeta.icono}
                  </span>
                </div>
                <h5 className="fw-semibold">{tarjeta.titulo}</h5>
                <p className="text-secondary small mb-0">{tarjeta.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
