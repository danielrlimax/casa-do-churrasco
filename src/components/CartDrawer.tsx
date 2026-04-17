import { useEffect, useState } from "react";
import { MenuItem } from "../data/menu";
import { RESTAURANTE } from "../data/menu";

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

interface CartDrawerProps {
  open: boolean;
  cartItems: CartItem[];
  onClose: () => void;
  onAdd: (item: MenuItem) => void;
  onRemove: (item: MenuItem) => void;
  onClear: () => void;
}

export default function CartDrawer({
  open,
  cartItems,
  onClose,
  onAdd,
  onRemove,
  onClear,
}: CartDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"cart" | "address">("cart");
  
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [frete, setFrete] = useState<number | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);

  const CEP_ORIGEM = "13484433";

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
      setStep("cart");
    } else {
      setVisible(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const totalItems = cartItems.reduce((acc, ci) => acc + ci.item.preco * ci.quantity, 0);
  const totalGeral = totalItems + (frete || 0);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const handleCepBlur = async () => {
    const cepNumeros = cep.replace(/\D/g, "");
    if (cepNumeros.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumeros}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setRua(data.logradouro);
        setBairro(data.bairro);
        setCidade(data.localidade);
        
        // Simulação de frete baseada na diferença do CEP
        const diff = Math.abs(Number(cepNumeros) - Number(CEP_ORIGEM));
        const freteSimulado = diff === 0 ? 0 : 5.0 + ( (diff % 10) * 1.5);
        setFrete(freteSimulado);
      } else {
        alert("CEP não encontrado.");
      }
    } catch (error) {
      alert("Erro ao buscar o CEP.");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleFinalizarPedido = () => {
    if (!rua || !numero || !bairro) {
      alert("Preencha os dados de endereço obrigatórios.");
      return;
    }

    let texto = `*NOVO PEDIDO*\n\n`;
    texto += `*Itens:*\n`;
    cartItems.forEach((ci) => {
      texto += `${ci.quantity}x ${ci.item.nome} - R$ ${(ci.item.preco * ci.quantity).toFixed(2)}\n`;
    });
    
    texto += `\n*Resumo:*\n`;
    texto += `Subtotal: R$ ${totalItems.toFixed(2)}\n`;
    texto += `Frete: R$ ${(frete || 0).toFixed(2)}\n`;
    texto += `*Total: R$ ${totalGeral.toFixed(2)}*\n\n`;
    
    texto += `*Endereco de Entrega:*\n`;
    texto += `CEP: ${cep}\n`;
    texto += `${rua}, ${numero}\n`;
    if (complemento) texto += `Complemento: ${complemento}\n`;
    texto += `Bairro: ${bairro}\n`;
    texto += `Cidade: ${cidade}`;

    const url = `https://wa.me/${RESTAURANTE.whatsapp}?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
    onClear();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Drawer Container (Mobile First) */}
      <div
        className={`relative w-full h-full bg-[#0a0a0a] shadow-2xl flex flex-col transition-transform duration-500 ease-out 
          ${visible ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"}
          sm:max-w-md sm:h-full sm:border-l sm:border-white/10`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-4">
            {step === "address" && (
              <button onClick={() => setStep("cart")} className="text-white/40 hover:text-white p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-white font-black text-2xl italic tracking-tighter uppercase">
              {step === "cart" ? "Seu Carrinho" : "Entrega"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 text-white/50">✕</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">🛒</span>
            </div>
            <p className="text-white font-bold text-lg">Nada por aqui ainda</p>
            <p className="text-white/30 text-sm mt-2">Explore nosso cardápio e adicione seus pratos favoritos.</p>
            <button onClick={onClose} className="mt-8 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">
              Voltar ao Cardápio
            </button>
          </div>
        ) : (
          <>
            {/* ETAPA 1: LISTA DO CARRINHO */}
            {step === "cart" && (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll">
                  {cartItems.map((ci) => (
                    <div key={ci.item.id} className="flex gap-4 items-center bg-[#141414] p-4 rounded-3xl border border-white/5">
                      <img src={ci.item.imagem} className="w-16 h-16 rounded-2xl object-cover bg-white/5" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm truncate">{ci.item.nome}</p>
                        <p className="text-white/40 text-[13px] font-medium mt-1">{formatCurrency(ci.item.preco)}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-black rounded-2xl p-1 border border-white/10">
                        <button onClick={() => onRemove(ci.item)} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white">−</button>
                        <span className="text-white font-bold text-sm min-w-[20px] text-center">{ci.quantity}</span>
                        <button onClick={() => onAdd(ci.item)} className="w-8 h-8 flex items-center justify-center text-white/50 hover:text-white">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-[#111] border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                    <span className="text-white font-black text-2xl">{formatCurrency(totalItems)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={onClear} className="h-14 rounded-2xl bg-white/5 text-white/40 font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                      Limpar
                    </button>
                    <button
                      onClick={() => setStep("address")}
                      className="h-14 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
                      style={{ backgroundColor: RESTAURANTE.cor }}
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ETAPA 2: FORMULÁRIO DE ENDEREÇO */}
            {step === "address" && (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">CEP</label>
                      <input 
                        type="text" placeholder="12345-000" maxLength={9}
                        value={cep} onChange={(e) => setCep(e.target.value)} onBlur={handleCepBlur}
                        className="w-full h-14 bg-[#141414] border border-white/10 rounded-2xl px-5 text-white focus:border-white/30 outline-none transition-all mt-2"
                      />
                      {loadingCep && <p className="text-[10px] text-red-500 mt-2 ml-1 animate-pulse">Buscando informações...</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Rua / Avenida</label>
                      <input 
                        type="text" value={rua} onChange={e => setRua(e.target.value)}
                        className="w-full h-14 bg-[#141414] border border-white/10 rounded-2xl px-5 text-white outline-none mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Nº</label>
                        <input 
                          type="text" value={numero} onChange={e => setNumero(e.target.value)}
                          className="w-full h-14 bg-[#141414] border border-white/10 rounded-2xl px-4 text-white outline-none mt-2"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Complemento</label>
                        <input 
                          type="text" placeholder="Opcional" value={complemento} onChange={e => setComplemento(e.target.value)}
                          className="w-full h-14 bg-[#141414] border border-white/10 rounded-2xl px-4 text-white outline-none mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Bairro</label>
                      <input 
                        type="text" value={bairro} onChange={e => setBairro(e.target.value)}
                        className="w-full h-14 bg-[#141414] border border-white/10 rounded-2xl px-5 text-white outline-none mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-[#111] border-t border-white/5 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white/30 uppercase tracking-widest">Subtotal</span>
                      <span className="text-white">{formatCurrency(totalItems)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-white/30 uppercase tracking-widest">Entrega</span>
                      <span className={frete === 0 ? "text-green-500" : "text-white"}>
                        {frete === null ? "Calcular CEP" : frete === 0 ? "Grátis" : formatCurrency(frete)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t border-white/5">
                      <span className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Total Geral</span>
                      <span className="text-white font-black text-3xl italic tracking-tighter">{formatCurrency(totalGeral)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleFinalizarPedido}
                    className="w-full h-16 rounded-2xl text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 mt-2"
                    style={{ backgroundColor: RESTAURANTE.cor }}
                  >
                    Fazer Pedido no WhatsApp
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}