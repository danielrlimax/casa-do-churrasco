import { useRef } from "react";
import { CATEGORIAS, Categoria } from "../data/menu";
import { RESTAURANTE } from "../data/menu";

interface CategoryFilterProps {
  selected: string;
  onChange: (id: string) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleClick = (cat: Categoria) => {
    onChange(cat.id);
  };

  return (
    <div className="sticky top-16 z-40 bg-[#111] border-b border-white/5">
      <div
        ref={scrollRef}
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {CATEGORIAS.map((cat) => {
          const isSelected = selected === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleClick(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 ${
                isSelected
                  ? "text-white shadow-lg"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
              style={
                isSelected
                  ? { backgroundColor: RESTAURANTE.cor }
                  : {}
              }
            >
              <span>{cat.emoji}</span>
              <span>{cat.nome}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
