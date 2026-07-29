import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";
import { Login } from "./pages/Login";
import { Registro } from "./pages/Registro";
import { RegistroDoctor } from "./pages/RegistroDoctor";
import { PerfilCliente } from "./pages/PerfilCliente";
import { HistoriaClinica } from "./pages/HistoriaClinica";
import { PerfilDoctor } from "./pages/PerfilDoctor";
import { SingleDoctorProfile } from "./pages/SingleDoctorProfile";
import { BuscarDoctores } from "./pages/BuscarDoctores";
import { DetalleDoctor } from "./components/DetalleDoctor";
import { Consultas } from "./pages/Consultas";
import { HistorialConsultas } from "./pages/HistorialConsultas";
import { Calendario } from "./pages/Calendario";
import { CalendarioDoctor } from "./pages/CalendarioDoctor";
import { HistorialCitas } from "./pages/HistorialCitas";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
      <Route path="/" element={<Home />} />
      <Route path="/single/:theId" element={<Single />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/registro-doctor" element={<RegistroDoctor />} />
      <Route path="/perfil-cliente" element={<PerfilCliente />} />
      <Route path="/historia-clinica" element={<HistoriaClinica />} />
      <Route path="/historial-citas" element={<HistorialCitas />} />
      <Route path="/perfil-doctor" element={<PerfilDoctor />} />
      <Route path="/doctores" element={<BuscarDoctores />} />
      <Route path="/doctores/:id" element={<DetalleDoctor />} />
      <Route path="/consultas" element={<Consultas />} />
      <Route path="/historial-consultas" element={<HistorialConsultas />} />
      <Route path="/calendario" element={<Calendario />} />
      <Route path="/calendario-doctor" element={<CalendarioDoctor />} />
    </Route>
  )
);
