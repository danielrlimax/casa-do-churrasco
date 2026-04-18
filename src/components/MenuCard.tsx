import { useState } from "react";
import { MenuItem, RESTAURANTE } from "../data/menu";

interface MenuCardProps {
  item: MenuItem;
  quantity: number;
  onClick: (item: MenuItem) => void;
}

export default function MenuCard({ item, quantity, onClick }: MenuCardProps) {
  const [imgError, setImgError] = useState(false);

  const formattedPrice = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.preco);

  return (
    <div
      className={`relative bg-[#1e1e1e] rounded-2xl overflow-hidden border transition-all duration-200 ${item.disponivel ? "border-white/5 hover:border-white/10 cursor-pointer" : "border-white/5 opacity-60 cursor-not-allowed"}`}
      onClick={() => item.disponivel && onClick(item)}
    >
      <div className="relative w-full h-44 bg-[#2a2a2a] overflow-hidden">
        {!imgError ? (
          <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20"> 📸 </div>
        )}
        {!item.disponivel && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold tracking-widest text-sm bg-black/50 px-4 py-2 rounded-lg"> ESGOTADO </span>
          </div>
        )}
        {quantity > 0 && (
          <div className="absolute top-3 right-3 bg-[#e8a838] text-black font-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
            {quantity}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-white font-bold leading-tight mb-1">{item.nome}</h3>
        <p className="text-white/40 text-xs line-clamp-2 min-h-[2rem] leading-snug"> {item.descricao} </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-white font-extrabold text-lg tracking-tight"> {formattedPrice} </span>
          {item.disponivel && (
            <button className="flex items-center gap-1.5 px-4 h-8 rounded-full text-black text-xs font-black uppercase transition-all active:scale-90" style={{ backgroundColor: RESTAURANTE.cor }}>
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}