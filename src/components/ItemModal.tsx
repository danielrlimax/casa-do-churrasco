import { useEffect, useState } from "react";
import { MenuItem } from "../data/menu";
import { RESTAURANTE } from "../data/menu";

interface ItemModalProps {
  item: MenuItem | null;
  quantity: number;
  onClose: () => void;
  onAdd: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
}

const TAG_STYLES: Record<string, string> = {
  Popular: "bg-yellow-400/20 text-yellow-400 border-yellow-400/30",
  Novo: "bg-green-400/20 text-green-400 border-green-400/30",
  Vegano: "bg-emerald-400/20 text-emerald-400 border-emerald-400/30",
  "Sem Glúten": "bg-blue-400/20 text-blue-400 border-blue-400/30",
};

export default function ItemModal({ item, quantity, onClose, onAdd, onRemove }: ItemModalProps) {
  const [imgError, setImgError] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (item) {
      setImgError(false);
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [item]);

  if (!item) return null;

  const formattedPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(item.preco);

  const totalPrice = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(item.preco * Math.max(quantity, 1));

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-250 ${
        visible ? "bg-black/70 backdrop-blur-sm" : "bg-transparent"
      }`}
      onClick={handleClose}
    >
      <div
        className={`w-full sm:max-w-md bg-[#1e1e1e] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl transition-all duration-250 ${
          visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative w-full h-56 bg-[#2a2a2a]">
          {!imgError ? (
            <img
              src={item.imagem}
              alt={item.nome}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-transparent" />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Badges */}
          <div className="absolute bottom-3 left-4 flex gap-2">
            {item.destaque && (
              <span
                className="px-2 py-0.5 rounded-full text-white text-xs font-bold"
                style={{ backgroundColor: RESTAURANTE.cor }}
              >
                ⭐ Destaque
              </span>
            )}
            {item.tag && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  TAG_STYLES[item.tag] ?? "bg-white/20 text-white border-white/20"
                }`}
              >
                {item.tag}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-5 pb-6">
          <h2 className="text-white text-2xl font-extrabold">{item.nome}</h2>
          <p className="text-white/50 text-sm mt-2 leading-relaxed">{item.descricao}</p>

          <div className="flex items-center justify-between mt-5">
            <div>
              <p className="text-white/30 text-xs uppercase tracking-wider">Preço unitário</p>
              <p className="text-2xl font-extrabold" style={{ color: "#e8a838" }}>
                {formattedPrice}
              </p>
            </div>

            {/* Quantity control */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onRemove(item)}
                disabled={quantity === 0}
                className={`w-10 h-10 rounded-full font-bold text-xl flex items-center justify-center transition-all ${
                  quantity > 0
                    ? "bg-white/10 hover:bg-white/20 text-white active:scale-90"
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                }`}
              >
                −
              </button>
              <span className="text-white font-bold text-xl w-6 text-center">{quantity}</span>
              <button
                onClick={() => onAdd(item)}
                className="w-10 h-10 rounded-full text-white font-bold text-xl flex items-center justify-center transition-all active:scale-90"
                style={{ backgroundColor: RESTAURANTE.cor }}
              >
                +
              </button>
            </div>
          </div>

          {quantity > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-white/5 flex items-center justify-between">
              <span className="text-white/50 text-sm">{quantity}x no pedido</span>
              <span className="text-white font-bold">{totalPrice}</span>
            </div>
          )}

          <button
            onClick={() => {
              if (quantity === 0) onAdd(item);
              handleClose();
            }}
            className="mt-4 w-full py-3.5 rounded-2xl text-white font-bold text-base transition-all active:scale-95"
            style={{ backgroundColor: RESTAURANTE.cor }}
          >
            {quantity === 0 ? "Adicionar ao pedido" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
