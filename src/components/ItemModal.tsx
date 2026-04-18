import { useEffect, useState } from "react";
import { MenuItem, SecaoItem, Secao } from "../data/menu";

interface ItemModalProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, selecoes: Record<string, SecaoItem[]>, observacoes: string, qty: number) => void;
}

export default function ItemModal({ item, onClose, onAddToCart }: ItemModalProps) {
  const [visible, setVisible] = useState(false);
  const [selecoes, setSelecoes] = useState<Record<string, SecaoItem[]>>({});
  const [observacoes, setObservacoes] = useState("");
  const [localQty, setLocalQty] = useState(1);

  useEffect(() => {
    if (item) {
      setSelecoes({});
      setObservacoes("");
      setLocalQty(1);
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [item]);

  if (!item) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  // Lógica para adicionar (+)
  const handleAddOpcao = (secaoId: string, opcao: SecaoItem, maximo: number) => {
    const atual = selecoes[secaoId] || [];
    if (atual.length >= maximo) return;

    setSelecoes({
      ...selecoes,
      [secaoId]: [...atual, opcao],
    });
  };

  // Lógica para remover (-)
  const handleRemoveOpcao = (secaoId: string, opcao: SecaoItem) => {
    const atual = selecoes[secaoId] || [];
    const index = atual.findIndex((i) => i.id === opcao.id);
    if (index === -1) return;

    const nova = [...atual];
    nova.splice(index, 1);

    setSelecoes({
      ...selecoes,
      [secaoId]: nova,
    });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // Cálculo de Preços
  let totalAdicionais = 0;
  Object.values(selecoes).flat().forEach((opcao) => {
    totalAdicionais += opcao.valor;
  });
  const precoUnitario = item.preco + totalAdicionais;
  const precoTotal = precoUnitario * localQty;

  // Validação
  const secoesDoItem = (item.secoes || []) as Secao[];
  const tudoValido = secoesDoItem.every((secao) => {
    const sel = selecoes[secao.id] || [];
    return sel.length >= secao.minimo;
  });

  const handleSubmit = () => {
    if (!tudoValido) return;
    onAddToCart(item, selecoes, observacoes, localQty);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`} 
        onClick={handleClose} 
      />

      {/* Modal */}
      <div className={`relative w-full max-w-lg bg-[#0a0a0a] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] transition-transform duration-500 ease-out ${visible ? "translate-y-0" : "translate-y-full"}`}>
        
        <div className="relative w-full h-48 sm:h-64 shrink-0">
          <img src={item.imagem} alt={item.nome} className="w-full h-full object-cover sm:rounded-t-3xl rounded-t-3xl" />
          <button onClick={handleClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/80 transition-colors backdrop-blur-sm">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
          <div>
            <h2 className="text-white font-black text-2xl leading-tight">{item.nome}</h2>
            <p className="text-white/50 text-sm mt-2 leading-relaxed">{item.descricao}</p>
            <p className="text-[#e8a838] font-black text-xl mt-3">{formatCurrency(item.preco)}</p>
          </div>

          {/* Seções com o novo contador */}
          {secoesDoItem.map((secao) => {
            const totalSelecionadosNaSecao = (selecoes[secao.id] || []).length;

            return (
              <div key={secao.id} className="bg-[#141414] border border-white/5 rounded-2xl p-4">
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-white font-bold">{secao.nome}</h3>
                    <span className="text-white/40 text-xs">
                      {secao.minimo > 0 ? `Escolha de ${secao.minimo} até ${secao.maximo}` : `Escolha até ${secao.maximo}`}
                    </span>
                  </div>
                  {secao.minimo > 0 && totalSelecionadosNaSecao < secao.minimo && (
                    <span className="bg-red-500/20 text-red-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase">Obrigatório</span>
                  )}
                </div>

                <div className="space-y-3">
                  {secao.itens.map((opcao) => {
                    const quantidadeDestaOpcao = (selecoes[secao.id] || []).filter((i) => i.id === opcao.id).length;
                    const podeAdicionarMais = totalSelecionadosNaSecao < secao.maximo;

                    return (
                      <div key={opcao.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">{opcao.nome}</p>
                          {opcao.valor > 0 && <p className="text-[#e8a838] text-xs font-bold">+ {formatCurrency(opcao.valor)}</p>}
                        </div>

                        {/* Botões de + e - */}
                        <div className="flex items-center gap-3 bg-[#1e1e1e] p-1 rounded-lg border border-white/5">
                          <button 
                            onClick={() => handleRemoveOpcao(secao.id, opcao)}
                            disabled={quantidadeDestaOpcao === 0}
                            className={`w-8 h-8 rounded-md flex items-center justify-center font-black ${quantidadeDestaOpcao > 0 ? 'text-white hover:bg-white/10' : 'text-white/20'}`}
                          >
                            -
                          </button>
                          
                          <span className="text-white font-bold w-4 text-center text-sm">
                            {quantidadeDestaOpcao}
                          </span>
                          
                          <button 
                            onClick={() => handleAddOpcao(secao.id, opcao, secao.maximo)}
                            disabled={!podeAdicionarMais}
                            className={`w-8 h-8 rounded-md flex items-center justify-center font-black ${podeAdicionarMais ? 'text-[#e8a838] hover:bg-white/10' : 'text-white/20'}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div>
            <h3 className="text-white font-bold mb-3">Alguma observação?</h3>
            <textarea 
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Tirar cebola, maionese à parte..."
              className="w-full bg-[#141414] border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-[#e8a838] resize-none h-24"
            />
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="p-5 border-t border-white/5 bg-[#141414] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setLocalQty(Math.max(1, localQty - 1))} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl flex items-center justify-center transition-all"> − </button>
              <span className="text-white font-bold text-xl w-6 text-center">{localQty}</span>
              <button onClick={() => setLocalQty(localQty + 1)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xl flex items-center justify-center transition-all"> + </button>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-xs uppercase tracking-widest">Total</p>
              <p className="text-xl font-black text-white">{formatCurrency(precoTotal)}</p>
            </div>
          </div>
          <button 
            onClick={handleSubmit} 
            disabled={!tudoValido} 
            className={`w-full py-4 rounded-2xl text-black font-black text-sm uppercase tracking-[0.1em] shadow-xl transition-all ${tudoValido ? 'bg-[#e8a838] hover:brightness-110 active:scale-[0.98]' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
          >
            Adicionar ao Carrinho
          </button>
        </div>
      </div>
    </div>
  );
}