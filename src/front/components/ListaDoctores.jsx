import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CardsGrid from './CardsGrid';

export const ListaDoctores = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  
  const navigate = useNavigate();

  // Fetch all doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/doctors');
        if (!response.ok) {
          throw new Error('Failed to fetch doctors');
        }
        const data = await response.json();
        setDoctors(data);
        setFilteredDoctors(data);
        setError(null);
      } catch (err) {
        setError('Error loading doctors. Please try again later.');
        console.error('Error fetching doctors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Filter doctors when search term or selected specialty changes
  useEffect(() => {
    let filtered = doctors;
    
    if (searchTerm) {
      filtered = filtered.filter(doctor => 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.id.toString().includes(searchTerm)
      );
    }
    
    if (selectedSpecialty) {
      filtered = filtered.filter(doctor => 
        doctor.specialty.toLowerCase() === selectedSpecialty.toLowerCase()
      );
    }
    
    setFilteredDoctors(filtered);
  }, [searchTerm, selectedSpecialty, doctors]);

  const handleDoctorClick = (doctorId) => {
    navigate(`/doctores/${doctorId}`);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSpecialtyChange = (event) => {
    setSelectedSpecialty(event.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecialty('');
  };

  const specialties = [...new Set(doctors.map(doctor => doctor.specialty))];

  if (isLoading) {
    return (
      <div className="text-center py-5" role="status">
        <div className="spinner-border text-primary" role="status" aria-label="Cargando doctores"/>
        <p className="mt-2 text-secondary">Cargando doctores...</p>
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

  return (
    <div className="doctor-list-container py-4">
      <div className="container-xl">
        <div className="row mb-4">
          <div className="col-lg-8">
            <h1 className="display-5 fw-bold text-primary mb-2">Nuestros Médicos</h1>
            <p className="text-secondary">
              Encuentra a los mejores especialistas aquí. Haz clic en cualquier tarjeta para ver sus detalles.
            </p>
          </div>
        </div>

        <div className="row g-3 mb-4">
          <div className="col-md-6 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-light">
                <span className="material-symbols-outlined">search</span>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre o especialidad..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Buscar doctores"
              />
            </div>
          </div>
          <div className="col-md-6 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-light">
                <span className="material-symbols-outlined">medical_services</span>
              </span>
              <select
                className="form-select"
                value={selectedSpecialty}
                onChange={handleSpecialtyChange}
                aria-label="Filtrar por especialidad"
              >
                <option value="">Todas las especialidades</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>
          </div>
          {(searchTerm || selectedSpecialty) && (
            <div className="col-12">
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={clearFilters}
              >
                <span className="material-symbols-outlined">clear</span>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>

        {filteredDoctors.length > 0 ? (
          <CardsGrid
            doctors={filteredDoctors.map(doctor => ({
              id: doctor.id,
              icono: "person",
              titulo: doctor.name,
              descripcion: doctor.specialty,
              color: "text-primary bg-primary-subtle",
              rating: doctor.average_rating
            }))}
            onDoctorClick={handleDoctorClick}
            role="grid"
            aria-label="Lista de doctores"
          />
        ) : (
          <div className="text-center py-5">
            <span className="fs-1 mb-2" aria-hidden="true">👥</span>
            <p className="mt-2 text-secondary">
              {searchTerm || selectedSpecialty
                ? "No se encontraron doctores con los criterios de búsqueda especificados."
                : "No hay doctores disponibles actualmente."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaDoctores;