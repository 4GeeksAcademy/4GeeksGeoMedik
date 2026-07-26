// src/front/components/AvatarPerfil.jsx
// Avatar reutilizable: muestra la foto si existe, y si no la inicial del nombre.

export const AvatarPerfil = ({
  nombre = "",
  fotoUrl = null,
  tamano = 96,
  className = "",
  conBorde = true,
}) => {
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";
  const borde = conBorde ? "border border-4 border-white shadow" : "";

  const estilo = {
    width: `${tamano}px`,
    height: `${tamano}px`,
    minWidth: `${tamano}px`,
    fontSize: `${Math.round(tamano / 2.4)}px`,
    lineHeight: 1,
  };

  if (fotoUrl) {
    return (
      <img
        src={fotoUrl}
        alt={`Foto de perfil de ${nombre}`}
        className={`rounded-circle object-fit-cover ${borde} ${className}`}
        style={estilo}
      />
    );
  }

  return (
    <span
      className={`bg-white text-primary rounded-circle d-inline-flex align-items-center justify-content-center fw-bold ${borde} ${className}`}
      style={estilo}
    >
      {inicial}
    </span>
  );
};

export default AvatarPerfil;
