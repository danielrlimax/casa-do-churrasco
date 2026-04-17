import { useState } from "react";
import { RESTAURANTE } from "../data/menu";

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

export default function Header({ cartCount, onCartClick }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#1a1a1a]/95 backdrop-blur-sm border-b border-white/5 shadow-xl">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Nome */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden shadow-lg"
            style={{ backgroundColor: RESTAURANTE.cor }}
          >
            <img 
              src="/images/logo.webp" 
              alt={RESTAURANTE.nome}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Se a imagem falhar, substitui o conteúdo pela letra inicial
                const target = e.currentTarget;
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `<span class="text-white font-bold text-lg">${RESTAURANTE.nome.charAt(0)}</span>`;
                }
              }}
            />
          </div>
          <div className="leading-tight">
            <p className="text-white font-bold text-base leading-none">{RESTAURANTE.nome}</p>
            <p className="text-white/40 text-xs">{RESTAURANTE.horario}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Info Button */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 flex items-center justify-center text-white/60 hover:text-white transition-colors rounded-xl hover:bg-white/5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4M12 8h.01" />
            </svg>
          </button>

          {/* Cart Button */}
          <button
            onClick={onCartClick}
            className="relative flex items-center gap-2 px-3 h-9 rounded-xl text-white text-sm font-semibold transition-all active:scale-95"
            style={{ backgroundColor: RESTAURANTE.cor }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Pedido</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Info Dropdown */}
      {menuOpen && (
        <div className="absolute top-16 right-4 w-64 bg-[#242424] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in">
          <p className="text-white/40 text-xs uppercase font-semibold tracking-wider mb-3">Informações</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">📞</span>
              <div>
                <p className="text-white/40 text-xs">Telefone</p>
                <p className="text-white text-sm font-medium">{RESTAURANTE.telefone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">📸</span>
              <div>
                <p className="text-white/40 text-xs">Instagram</p>
                <p className="text-white text-sm font-medium">{RESTAURANTE.instagram}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">🕐</span>
              <div>
                <p className="text-white/40 text-xs">Horário</p>
                <p className="text-white text-sm font-medium">{RESTAURANTE.horario}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop for dropdown */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </header>
  );
}
