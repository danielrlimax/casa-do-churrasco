import { RESTAURANTE } from "../data/menu";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/5 pb-8 pt-6 text-center px-4">
      {/* Container do Logotipo */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden mx-auto mb-3 shadow-lg"
        style={{ backgroundColor: RESTAURANTE.cor }}
      >
        <img 
          src="images/logo.webp" 
          alt={RESTAURANTE.nome}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Caso a imagem não seja encontrada, mostra a letra inicial
            const target = e.currentTarget;
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-white font-bold text-lg">${RESTAURANTE.nome.charAt(0)}</span>`;
            }
          }}
        />
      </div>

      <p className="text-white/60 font-bold text-base">{RESTAURANTE.nome}</p>
      <p className="text-white/25 text-xs mt-1">{RESTAURANTE.slogan}</p>
      
      <div className="flex items-center justify-center gap-4 mt-4 text-white/20 text-xs">
        <span>📞 {RESTAURANTE.telefone}</span>
        <span>·</span>
        <span>📸 {RESTAURANTE.instagram}</span>
      </div>
      
      <p className="text-white/15 text-xs mt-4">
        Cardápio digital — Peça pelo WhatsApp
      </p>
    </footer>
  );
}