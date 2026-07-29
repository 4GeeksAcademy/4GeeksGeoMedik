// Estrellas reutilizables. Sin onChange son solo lectura; con onChange se
// pueden pulsar para puntuar.
export const Estrellas = ({ valor = 0, onChange = null, tamano = "fs-5" }) => {
  const redondeado = Math.round(valor || 0);
  const editable = typeof onChange === "function";

  return (
    <span className={`d-inline-flex align-items-center ${editable ? "gap-1" : ""}`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const llena = n <= redondeado;
        const icono = (
          <span
            className={`material-symbols-outlined ${tamano} ${
              llena ? "text-warning" : "text-secondary opacity-50"
            }`}
            style={llena ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            star
          </span>
        );

        if (!editable) return <span key={n}>{icono}</span>;

        return (
          <button
            key={n}
            type="button"
            className="btn btn-link p-0 border-0 lh-1"
            onClick={() => onChange(n)}
            aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
            title={`${n} de 5`}
          >
            {icono}
          </button>
        );
      })}
    </span>
  );
};

export default Estrellas;
