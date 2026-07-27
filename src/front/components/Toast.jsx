import { useEffect, useState } from "react";

const ESTILOS = {
  exito: {
    icono: "check_circle",
    color: "text-success",
    fondo: "bg-success-subtle",
    borde: "border-success",
  },
  recordatorio: {
    icono: "notifications_active",
    color: "text-warning",
    fondo: "bg-warning-subtle",
    borde: "border-warning",
  },
  info: {
    icono: "info",
    color: "text-primary",
    fondo: "bg-primary-subtle",
    borde: "border-primary",
  },
};

export const Toast = ({ mensaje, tipo = "info", onClose }) => {
  const [visible, setVisible] = useState(true);
  const estilo = ESTILOS[tipo] || ESTILOS.info;

  const cerrarToast = () => {
    setVisible(false);
    onClose?.();
  };

  useEffect(() => {
    const temporizador = setTimeout(cerrarToast, 6000);
    return () => clearTimeout(temporizador);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`position-fixed top-0 end-0 m-4 p-3 rounded-4 shadow border ${estilo.fondo} ${estilo.borde}`}
      style={{ width: "340px", zIndex: 2000 }}
      role="alert"
    >
      <div className="d-flex align-items-start gap-3">
        <span className={`material-symbols-outlined ${estilo.color}`}>
          {estilo.icono}
        </span>
        <p className="mb-0 flex-grow-1 fw-semibold">{mensaje}</p>
        <button
          type="button"
          className="btn-close"
          aria-label="Cerrar notificacion"
          onClick={cerrarToast}
        />
      </div>
    </div>
  );
};

export default Toast;
