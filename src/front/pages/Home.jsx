import { Hero } from "../components/Hero";
import { Beneficios } from "../components/Beneficios";
import { Especialidades } from "../components/Especialidades";
import { PopupConsulta } from "../components/PopupConsulta";


export const Home = () => {
  return (
    <div style={{ paddingTop: "70px" }}>
      <Hero />
      <Beneficios />
      <Especialidades />
      <PopupConsulta />
    </div>
  );
};