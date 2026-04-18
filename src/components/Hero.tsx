import { RESTAURANTE } from "../data/menu";

export default function Hero() {
  return (
    <section className="relative w-full h-52 overflow-hidden">
      <img src="/images/background/hero-bg.jpg" alt="Ambiente do restaurante" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/60 to-transparent" />
      <div className="absolute inset-0 opacity-30" style={{ background: `linear-gradient(135deg, ${RESTAURANTE.cor}55, transparent)` }} />

      <div className="absolute bottom-0 left-0 right-0 p-5 max-w-4xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: RESTAURANTE.cor }}> Bem-vindo ao </p>
        <h1 className="text-white text-3xl font-extrabold leading-tight drop-shadow-lg"> {RESTAURANTE.nome} </h1>
        <p className="text-white/60 text-sm mt-0.5">{RESTAURANTE.slogan}</p>
      </div>
    </section>
  );
}