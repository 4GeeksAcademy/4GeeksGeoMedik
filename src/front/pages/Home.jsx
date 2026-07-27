import { Hero } from "../components/Hero";
import { CardsGrid } from "../components/CardsGrid";
import { Beneficios } from "../components/Beneficios";
import { Especialidades } from "../components/Especialidades";

export const Home = () => {
  return (
    <div style={{ paddingTop: "70px" }}>
      <Hero />
      <CardsGrid />
      <Beneficios />
      <Especialidades />
    </div>
  );
};
