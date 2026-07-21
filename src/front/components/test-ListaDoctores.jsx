import { render, screen, waitForElement } from '@testing-library/react';
import ListaDoctores from '../../../src/front/components/ListaDoctores';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

vi.mock('../../../src/front/components/CardsGrid', () => ({ doctors }) => (
  <div data-testid="cards-grid-mock">{`Mocked: ${doctors.length}`}</div>
));

describe('ListaDoctores Component', () => {
  it('renders doctor list component', () => {
    const mockDoctors = [
      { id: '1', name: 'Dr. Smith', specialty: 'Cardiology', rating: 4.5, image_url: 'img.jpg' }
    ];
    
    render(
      <MemoryRouter initialEntries={['/doctores']}>
        <ListaDoctores doctors={mockDoctors} />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('cards-grid-mock')).toBeInTheDocument();
  });
  
  it('shows "Cargando..." when isLoading true', () => {
    render(
      <MemoryRouter initialEntries={['/doctores']}>
        <ListaDoctores doctors={[]} isLoading={true} error={null} />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Cargando\.\.\./)).toBeInTheDocument();
  });
  
  it('shows "No se encontraron médicos" when no doctors and not loading', () => {
    render(
      <MemoryRouter initialEntries={['/doctores']}>
        <ListaDoctores doctors={[]} isLoading={false} error={null} />
      </MemoryRouter>
    );
    
    expect(screen.getByText(/No se encontraron m\.ésicos/)).toBeInTheDocument();
  });
});