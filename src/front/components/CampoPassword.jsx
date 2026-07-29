import { useState } from "react";

// Campo de contraseña con boton de ojo para mostrar u ocultar lo escrito.
// Cada campo lleva su propio estado, asi que en el registro puedes destapar
// la contraseña sin destapar tambien la confirmacion.
export const CampoPassword = ({ icono, className = "form-control", ...props }) => {
  const [visible, setVisible] = useState(false);
  const etiqueta = visible ? "Ocultar contraseña" : "Mostrar contraseña";

  return (
    <div className="input-group">
      {icono && (
        <span className="input-group-text bg-light">
          <span className="material-symbols-outlined">{icono}</span>
        </span>
      )}

      <input {...props} type={visible ? "text" : "password"} className={className} />

      {/* type="button" es imprescindible: dentro de un <form>, un boton sin
          tipo cuenta como submit y al pulsar el ojo enviarias el formulario. */}
      <button
        type="button"
        className="btn btn-outline-secondary d-flex align-items-center"
        onClick={() => setVisible(!visible)}
        aria-label={etiqueta}
        title={etiqueta}
      >
        <span className="material-symbols-outlined fs-5">
          {visible ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
};

export default CampoPassword;
