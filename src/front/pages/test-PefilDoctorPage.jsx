import { render, screen } from '@testing-library/react';
import SingleDoctorProfile from '../../../src/front/pages/SingleDoctorProfile';
import { MemoryRouter } from 'react-router-dom';

describe('SingleDoctorProfile Component', () => {
  it('renders doctor profile when data is available', () => {
    const mockDoctor = {
      id: '1',
      name: 'Dr. Smith',
      specialty: 'Cardiology',
      phone_number: '+1234567890',
      email: 'dr.smith@example.com',
      address: '123 Main St',
      credentials: 'MD, PhD',
      picture_url: '/images/doctor1.jpg',
      average_rating: 4.5,
      id_number: 'MED123456'
    };
    
    render(
      <MemoryRouter initialEntries={['/doctores/1']}> 
        <SingleDoctorProfile />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
  });
  
  it('shows loading state when isLoading is true', () => {
    render(
      <MemoryRouter initialEntries={['/doctores/1']}> 
        <SingleDoctorProfile />
      </MemoryRouter>
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Cargando detalles del doctor/)).toBeInTheDocument();
  });
  
  it('shows error message when fetch fails', async () => {
    // Mock fetch to simulate error
    global.fetch = vi.fn(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ message: 'Doctor no encontrado' })
    }));
    
    render(
      <MemoryRouter initialEntries={['/doctores/1']}> 
        <SingleDoctorProfile />
      </MemoryRouter>
    );
    
    expect(await screen.findByText(/Error:/)).toBeInTheDocument();
    expect(screen.getByText('Doctor no encontrado')).toBeInTheDocument();
  });
  
  it('shows not found message when doctor is null', () => {
    render(
      <MemoryRouter initialEntries={['/doctores/999']}> 
        <SingleDoctorProfile />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Doctor no encontrado')).toBeInTheDocument();
  });
});

// Mock window.location.href for testing appointment button
Object.defineProperty(window, 'location', {
  configurable: true,
  get: () => ({ href: '' })
});
vi.mock('vitest', { createMockFromModule: vi.fn() });