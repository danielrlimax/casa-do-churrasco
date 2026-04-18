import { useEffect, useState } from "react";
import { RESTAURANTE, SecaoItem, MenuItem } from "../data/menu";

export interface CartItem {
  id: string;
  item: MenuItem;
  quantity: number;
  selecoes: Record<string, SecaoItem[]>;
  observacoes: string;
  precoUnitario: number;
}

interface CartDrawerProps {
  open: boolean;
  cartItems: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function CartDrawer({ open, cartItems, onClose, onRemove, onClear }: CartDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"cart" | "address">("cart");
  
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [frete, setFrete] = useState<number>(5); 
  const [buscandoCep, setBuscandoCep] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
      setStep("cart");
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
  }, [open]);

  // --- LÓGICA DE AGRUPAMENTO DOS ITENS PRINCIPAIS ---
  const getGroupedItems = () => {
    const grouped: CartItem[] = [];

    cartItems.forEach((ci) => {
      const selecoesStr = JSON.stringify(ci.selecoes);
      const itemKey = `${ci.item.id}-${selecoesStr}-${ci.observacoes}`;

      const existingIndex = grouped.findIndex((item) => {
        const existingKey = `${item.item.id}-${JSON.stringify(item.selecoes)}-${item.observacoes}`;
        return existingKey === itemKey;
      });

      if (existingIndex > -1) {
        grouped[existingIndex].quantity += ci.quantity;
      } else {
        grouped.push({ ...ci });
      }
    });

    return grouped;
  };

  // --- LÓGICA DE AGRUPAMENTO DOS ADICIONAIS (Evitar Item, Item, Item) ---
  const formatSelecoesParaExibicao = (selecoes: Record<string, SecaoItem[]>) => {
    const allOpcoes = Object.values(selecoes).flat();
    const contagem: Record<string, { nome: string, qtd: number }> = {};
    
    allOpcoes.forEach(opcao => {
      if (contagem[opcao.id]) {
        contagem[opcao.id].qtd += 1;
      } else {
        contagem[opcao.id] = { nome: opcao.nome, qtd: 1 };
      }
    });

    return Object.values(contagem)
      .map(c => c.qtd > 1 ? `${c.qtd}x ${c.nome}` : c.nome)
      .join(', ');
  };

  const groupedItems = getGroupedItems();
  const totalItems = cartItems.reduce((acc, ci) => acc + ci.precoUnitario * ci.quantity, 0);
  const totalGeral = totalItems + frete;
  const formatCurrency = (val: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 8) valor = valor.slice(0, 8);
    const formatado = valor.replace(/^(\d{5})(\d)/, "$1-$2");
    setCep(formatado);

    if (valor.length === 8) {
      setBuscandoCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${valor}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setRua(data.logradouro);
          setBairro(data.bairro);
          document.getElementById("numero-input")?.focus();
        } else {
          alert("CEP não encontrado.");
        }
      } catch (error) {
        console.error("Erro ao buscar CEP", error);
      } finally {
        setBuscandoCep(false);
      }
    }
  };

  const handleFinalizarPedido = () => {
    let texto = `*NOVO PEDIDO*\n\n*Itens:*\n`;
    
    groupedItems.forEach((ci) => {
      texto += `*${ci.quantity}x ${ci.item.nome}* - R$ ${(ci.precoUnitario * ci.quantity).toFixed(2)}\n`;
      
      // Agrupar adicionais para o WhatsApp
      const allOpcoes = Object.values(ci.selecoes).flat();
      const contagemWhatsApp: Record<string, { opcao: SecaoItem, qtd: number }> = {};
      
      allOpcoes.forEach(opcao => {
        if (contagemWhatsApp[opcao.id]) {
          contagemWhatsApp[opcao.id].qtd += 1;
        } else {
          contagemWhatsApp[opcao.id] = { opcao, qtd: 1 };
        }
      });

      Object.values(contagemWhatsApp).forEach(c => {
        const valorTotalAdicional = c.opcao.valor * c.qtd;
        texto += `  - ${c.qtd > 1 ? `${c.qtd}x ` : ''}${c.opcao.nome} ${valorTotalAdicional > 0 ? `(+R$ ${valorTotalAdicional.toFixed(2)})` : ''}\n`;
      });

      if (ci.observacoes) texto += `  *Obs:* ${ci.observacoes}\n`;
      texto += `\n`;
    });
    
    texto += `*Resumo:*\nSubtotal: R$ ${totalItems.toFixed(2)}\nFrete: R$ ${frete.toFixed(2)}\n*Total: R$ ${totalGeral.toFixed(2)}*\n\n`;
    texto += `*Endereço de Entrega:*\n${rua}, ${numero}\n${complemento ? `Complemento: ${complemento}\n` : ''}Bairro: ${bairro}\nCEP: ${cep}`;

    window.open(`https://wa.me/${RESTAURANTE.whatsapp}?text=${encodeURIComponent(texto)}`, "_blank");
    onClear();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`} onClick={onClose} />

      <div className={`relative w-full h-full bg-[#0a0a0a] shadow-2xl flex flex-col transition-transform duration-500 ease-out ${visible ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"} sm:max-w-md sm:h-full`}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-white font-black text-xl italic uppercase tracking-tighter">{step === "cart" ? "Seu Pedido" : "Entrega"}</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors">✕</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <span className="text-6xl mb-6">🛒</span>
            <p className="text-white font-bold text-lg">O seu carrinho está vazio</p>
            <button onClick={onClose} className="mt-8 px-6 py-3 rounded-2xl bg-white/5 text-white/50 font-bold hover:bg-white/10 transition-colors">Voltar ao Menu</button>
          </div>
        ) : (
          <>
            {step === "cart" && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
                  {groupedItems.map((ci, index) => (
                    <div key={ci.id + index} className="flex gap-4 bg-[#141414] p-4 rounded-2xl border border-white/5 relative">
                      <div className="w-16 h-16 bg-[#222] rounded-xl overflow-hidden shrink-0">
                        <img src={ci.item.imagem} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 pr-6">
                        <h4 className="text-white font-bold leading-tight">
                           {ci.quantity > 1 ? `${ci.quantity}x ` : ''}{ci.item.nome}
                        </h4>
                        
                        {/* AQUI APLICAMOS A NOVA FORMATAÇÃO DOS ADICIONAIS */}
                        <p className="text-white/40 text-[11px] mt-1 line-clamp-2">
                          {formatSelecoesParaExibicao(ci.selecoes)}
                        </p>
                        
                        {ci.observacoes && <p className="text-yellow-500/70 text-[10px] mt-1">Obs: {ci.observacoes}</p>}
                        
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-white/40 text-xs">Unid: {formatCurrency(ci.precoUnitario)}</span>
                          <span className="text-[#e8a838] font-black">{formatCurrency(ci.precoUnitario * ci.quantity)}</span>
                        </div>
                      </div>
                      <button onClick={() => onRemove(ci.id)} className="absolute top-4 right-4 text-white/20 hover:text-red-500">✕</button>
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-white/5 bg-[#141414] shrink-0">
                  <div className="flex justify-between items-end mb-6">
                    <span className="text-white/50 text-xs font-black uppercase tracking-widest">Total</span>
                    <span className="text-white font-black text-2xl">{formatCurrency(totalItems)}</span>
                  </div>
                  <button onClick={() => setStep("address")} className="w-full h-14 rounded-2xl text-black font-black text-sm uppercase tracking-[0.1em] shadow-xl" style={{ backgroundColor: RESTAURANTE.cor }}> Continuar </button>
                </div>
              </>
            )}

            {step === "address" && (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll">
                  <div className="relative">
                    <input type="text" placeholder="Código Postal" value={cep} onChange={handleCepChange} maxLength={9} className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-[#e8a838]" />
                    {buscandoCep && <span className="absolute right-4 top-4 text-xs font-bold text-[#e8a838] animate-pulse">A procurar...</span>}
                  </div>
                  <input type="text" placeholder="Rua" value={rua} onChange={(e) => setRua(e.target.value)} className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-[#e8a838]" />
                  <div className="flex gap-4">
                    <input id="numero-input" type="text" placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} className="w-1/3 bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-[#e8a838]" />
                    <input type="text" placeholder="Complemento" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="w-2/3 bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-[#e8a838]" />
                  </div>
                  <input type="text" placeholder="Bairro / Localidade" value={bairro} onChange={(e) => setBairro(e.target.value)} className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-[#e8a838]" />
                </div>
                <div className="p-6 border-t border-white/5 bg-[#141414] shrink-0">
                  <button onClick={handleFinalizarPedido} className="w-full h-14 rounded-2xl text-black font-black text-sm uppercase tracking-[0.1em] shadow-xl" style={{ backgroundColor: RESTAURANTE.cor }}> Fazer Pedido no WhatsApp </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}