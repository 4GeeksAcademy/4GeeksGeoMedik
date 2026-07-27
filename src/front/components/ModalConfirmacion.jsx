import { useNavigate } from "react-router-dom";
import { Toast } from "./Toast";

export const ModalConfirmacion = ({ abierto, onClose, exito, doctor, dia, hora, fecha, error }) => {
  const navigate = useNavigate();
  if (!abierto) return null;

  const cerrarYVolver = () => {
    onClose();
    navigate("/doctores");
  };

  const verMisCitas = () => {
    onClose();
    navigate("/perfil-cliente");
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
      {exito && (
        <Toast
          tipo="exito"
          mensaje="Cita agendada correctamente"
        />
      )}
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-body text-center p-4">
            {exito ? (
              <>
                <span
                  className="material-symbols-outlined text-success"
                  style={{ fontSize: "5rem", lineHeight: 1 }}
                >
                  check_circle
                </span>
                <h3 className="fw-bold mt-2 text-success">Cita agendada correctamente</h3>
                <div className="mt-3 text-start border rounded p-3 bg-light">
                  <p className="mb-1"><strong>Doctor:</strong> {doctor?.name}</p>
                  <p className="mb-1"><strong>Especialidad:</strong> {doctor?.specialty}</p>
                  <p className="mb-1"><strong>Fecha:</strong> {fecha}</p>
                  <p className="mb-0"><strong>Hora:</strong> {hora}</p>
                </div>
              </>
            ) : (
              <>
                <span
                  className="material-symbols-outlined text-danger"
                  style={{ fontSize: "5rem", lineHeight: 1 }}
                >
                  error
                </span>
                <h3 className="fw-bold mt-2 text-danger">No se pudo agendar</h3>
                <p className="text-muted mt-2">
                  {error || "La hora ya no está disponible. Intenta con otra."}
                </p>
              </>
            )}
          </div>
          <div className="modal-footer justify-content-center">
            {exito ? (
              <>
                <button className="btn btn-primary" onClick={verMisCitas}>
                  Ver mis citas
                </button>
                <button className="btn btn-outline-secondary" onClick={cerrarYVolver}>
                  Cerrar
                </button>
              </>
            ) : (
              <button className="btn btn-outline-secondary" onClick={onClose}>
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacion;
