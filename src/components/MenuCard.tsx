import { useState } from "react";
import { MenuItem } from "../data/menu";
import { RESTAURANTE } from "../data/menu";

interface MenuCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
  onClick: (item: MenuItem) => void;
}

const TAG_STYLES: Record<string, string> = {
  Popular: "bg-yellow-400/20 text-yellow-400",
  Novo: "bg-green-400/20 text-green-400",
  Vegano: "bg-emerald-400/20 text-emerald-400",
  "Sem Glúten": "bg-blue-400/20 text-blue-400",
};

export default function MenuCard({ item, quantity, onAdd, onRemove, onClick }: MenuCardProps) {
  const [imgError, setImgError] = useState(false);

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(item.preco);

  return (
    <div
      className={`relative bg-[#1e1e1e] rounded-2xl overflow-hidden border transition-all duration-200 ${
        item.disponivel
          ? "border-white/5 hover:border-white/10 cursor-pointer"
          : "border-white/5 opacity-60 cursor-not-allowed"
      }`}
      onClick={() => item.disponivel && onClick(item)}
    >
      {/* Image */}
      <div className="relative w-full h-44 bg-[#2a2a2a] overflow-hidden">
        {!imgError ? (
          <img
            src={item.imagem}
            alt={item.nome}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-[#2a2a2a]">
            🍽️
          </div>
        )}

        {/* Unavailable overlay */}
        {!item.disponivel && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-black/80 text-white/70 text-xs font-semibold px-3 py-1 rounded-full">
              Indisponível
            </span>
          </div>
        )}

        {/* Destaque badge */}
        {item.destaque && item.disponivel && (
          <div
            className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-white text-xs font-bold flex items-center gap-1"
            style={{ backgroundColor: RESTAURANTE.cor }}
          >
            ⭐ Destaque
          </div>
        )}

        {/* Tag badge */}
        {item.tag && item.disponivel && (
          <div
            className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
              TAG_STYLES[item.tag] ?? "bg-white/20 text-white"
            }`}
          >
            {item.tag}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-white font-bold text-base leading-tight">{item.nome}</h3>
        <p className="text-white/40 text-xs mt-1 leading-relaxed line-clamp-2">{item.descricao}</p>

        {/* Price + Add */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-white font-extrabold text-lg" style={{ color: "#e8a838" }}>
            {formattedPrice}
          </span>

          {/* Quantity control */}
          {item.disponivel && (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {quantity > 0 ? (
                <>
                  <button
                    onClick={() => onRemove(item)}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center transition-colors"
                  >
                    −
                  </button>
                  <span className="text-white font-bold text-sm w-4 text-center">{quantity}</span>
                  <button
                    onClick={() => onAdd(item)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all active:scale-90"
                    style={{ backgroundColor: RESTAURANTE.cor }}
                  >
                    +
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onAdd(item)}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-full text-white text-sm font-semibold transition-all active:scale-90"
                  style={{ backgroundColor: RESTAURANTE.cor }}
                >
                  <span className="text-base leading-none">+</span>
                  Adicionar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
