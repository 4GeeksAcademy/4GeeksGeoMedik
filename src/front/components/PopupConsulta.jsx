import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Popup que aparece 3 segundos después de cargar la página
export const PopupConsulta = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer); // limpieza al desmontar
  }, []);

  // Si no es visible no renderizamos nada
  if (!visible) return null;

  // Si hay sesión va a buscar doctores, si no, primero al login
  const handleUnirse = () => {
    const token = localStorage.getItem("token");
    navigate(token ? "/doctores" : "/login");
  };

  return (
    <div
      className="position-fixed bottom-0 end-0 m-4"
      style={{ zIndex: 1050, maxWidth: "320px" }}
    >
      <div className="card border-0 shadow-lg rounded-4 p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="text-primary bg-primary-subtle rounded-3 p-2">
            <span className="material-symbols-outlined align-middle">video_call</span>
          </div>
          <button className="btn btn-sm btn-light" onClick={() => setVisible(false)}>
            <span className="material-symbols-outlined fs-6 align-middle">close</span>
          </button>
        </div>
        <p className="fw-bold text-primary small mb-1">Consulta Disponible</p>
        <p className="mb-3">Dr. Alejandro Méndez está disponible ahora para telemedicina.</p>
        <button className="btn btn-primary w-100 fw-semibold" onClick={handleUnirse}>
          Unirse Ahora
        </button>
      </div>
    </div>
  );
};