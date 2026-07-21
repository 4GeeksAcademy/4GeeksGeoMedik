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
import { PerfilCliente } from "./pages/PerfilCliente";
import { PerfilDoctor } from "./pages/PerfilDoctor";
import { SingleDoctorProfile } from "./pages/SingleDoctorProfile";

export const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >
        <Route path= "/" element={<Home />} />
        <Route path="/single/:theId" element={ <Single />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/perfil-cliente" element={<PerfilCliente />} />
        <Route path="/perfil-doctor" element={<PerfilDoctor />} />
        <Route path="/doctores" element={<SingleDoctorProfile />} />
        <Route path="/doctores/:id" element={<SingleDoctorProfile />} />
      </Route>
    )
);
