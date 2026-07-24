import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export const SingleDoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setIsLoading(true);
        // TODO: Reemplazar con tu URL real de la API o baseUrl + /api/doctors/${id}
        const response = await fetch(`/api/doctors/${id}`);
        
        if (!response.ok) {
          throw new Error('Doctor no encontrado');
        }
        
        const data = await response.json();
        setDoctor(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Error al cargar doctor');
        console.error('Error fetching doctor:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDoctor();
    }
  }, [id]);

  const handleBackToList = () => {
    navigate('/doctores');
  };

  if (isLoading) {
    return (
      <div className="text-center py-5" role="status">
        <div className="spinner-border text-primary" role="status" aria-label="Cargando doctor"/>
        <p className="mt-2 text-secondary">Cargando detalles del doctor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        <span aria-hidden="true">⚠️</span> Error: {error}
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-5">
        <span className="fs-1 mb-2" aria-hidden="true">👤</span>
        <p className="mt-2 text-secondary">Doctor no encontrado</p>
      </div>
    );
  }

  return (
    <div className="doctor-profile-container py-4">
      <div className="container-xl">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <button 
                className="btn btn-link p-0 text-decoration-none"
                onClick={handleBackToList}
              >
                Doctores
              </button>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Perfil de {doctor.name}
            </li>
          </ol>
        </nav>

        <div className="card shadow-sm border-0 rounded-4 p-4 mb-4">
          <div className="row g-4">
            <div className="col-md-4">
              <img 
                src={doctor.picture_url || '/images/doctor-default.jpg'}
                alt={`${doctor.name}, ${doctor.specialty}`}
                className="img-fluid rounded-circle"
                style={{ width: '100%', maxWidth: '200px', height: 'auto' }}
              />
            </div>
            <div className="col-md-8">
              <h1 className="h2 mb-2">{doctor.name}</h1>
              <h2 className="h4 text-primary mb-3">{doctor.specialty}</h2>
              <div className="d-flex flex-wrap gap-3 mb-4">
                <span className="badge bg-success">
                  ⭐ {doctor.average_rating ? doctor.average_rating.toFixed(1) : 'N/A'}
                </span>
                <span className="badge bg-info text-dark">
                  🆔 {doctor.id_number}
                </span>
              </div>
              <div className="row g-3">
                <div className="col-sm-6">
                  <h3 className="h6 text-secondary mb-2">Información de contacto</h3>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-1">
                      <strong>Teléfono:</strong> {doctor.phone_number}
                    </li>
                    <li className="mb-1">
                      <strong>Email:</strong> {doctor.email}
                    </li>
                    <li>
                      <strong>Dirección:</strong> {doctor.address}
                    </li>
                  </ul>
                </div>
                <div className="col-sm-6">
                  <h3 className="h6 text-secondary mb-2">Credenciales</h3>
                  <p className="mb-0 small text-wrap">{doctor.credentials}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm border-0 rounded-4 p-4">
          <h3 className="h4 mb-3">Disponibilidad</h3>
          <div className="row g-3">
            <div className="col-md-6">
              <h4 className="h6 text-secondary mb-2">Horarios de Consulta</h4>
              // TODO: Reemplazar con horas reales de disponibilidad desde la base de datos usando la tabla de Availability
              <p className="mb-1">
                <strong>Lunes - Viernes:</strong> 9:00 AM - 6:00 PM
              </p>
              <p className="mb-1">
                <strong>Sábado:</strong> 9:00 AM - 2:00 PM
              </p>
              <p className="mb-0">
                <strong>Domingo:</strong> Cerrado
              </p>
            </div>
            <div className="col-md-6">
              <h4 className="h6 text-secondary mb-2">Contacto para Citas</h4>
              <p className="mb-1">
                <strong>Teléfono:</strong> {doctor.phone_number}
              </p>
              <p className="mb-1">
                <strong>Email:</strong> {doctor.email}
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = `/appointments?doctor_id=${doctor.id}`}
              >
                Agendar Cita
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleDoctorProfile;