import { useEffect, useState } from "react";
import { RESTAURANTE, SecaoItem, MenuItem } from "../data/menu";
import CheckoutForm, { CheckoutData } from "./CheckoutForm";

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

  const getGroupedItems = () => {
    const grouped: CartItem[] = [];
    cartItems.forEach((ci) => {
      const itemKey = `${ci.item.id}-${JSON.stringify(ci.selecoes)}-${ci.observacoes}`;
      const existingIndex = grouped.findIndex(item => `${item.item.id}-${JSON.stringify(item.selecoes)}-${item.observacoes}` === itemKey);
      if (existingIndex > -1) grouped[existingIndex].quantity += ci.quantity;
      else grouped.push({ ...ci });
    });
    return grouped;
  };

  const handleFinalizarWhatsApp = (data: CheckoutData) => {
    let msg = `*NOVO PEDIDO*\n\n`;
    
    getGroupedItems().forEach(ci => {
      msg += `*${ci.quantity}x ${ci.item.nome}*\n`;
      Object.values(ci.selecoes).flat().forEach(opt => msg += `  - ${opt.nome}\n`);
      if (ci.observacoes) msg += `  *Obs:* ${ci.observacoes}\n`;
      msg += `\n`;
    });

    const total = cartItems.reduce((acc, ci) => acc + (ci.precoUnitario * ci.quantity), 0);
    
    msg += `*RESUMO*\n`;
    msg += `Itens: R$ ${total.toFixed(2)}\n`;
    msg += `Frete (${data.distancia}km): R$ ${data.frete.toFixed(2)}\n`;
    msg += `*TOTAL: R$ ${(total + data.frete).toFixed(2)}*\n\n`;

    msg += `*ENTREGA*\n`;
    msg += `${data.endereco.rua}, ${data.endereco.numero}\n${data.endereco.bairro} - ${data.endereco.cep}\n\n`;

    msg += `*PAGAMENTO*\n`;
    if (data.pagamento.metodo === "cartao") msg += `Cartão (${data.pagamento.tipoCartao?.toUpperCase()}) - Levar Maquininha`;
    else if (data.pagamento.metodo === "pix") msg += `PIX (Enviar chave)`;
    else msg += `Dinheiro (Troco para ${data.pagamento.trocoPara})`;

    window.open(`https://wa.me/${RESTAURANTE.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
    onClear();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`relative w-full h-full bg-[#0a0a0a] flex flex-col transition-transform duration-500 ease-out ${visible ? "translate-x-0" : "translate-x-full"} sm:max-w-md`}>
        
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-white font-black italic uppercase tracking-tighter">
            {step === "cart" ? "Seu Carrinho" : "Finalização"}
          </h2>
          <button onClick={onClose} className="text-white/20 hover:text-white">✕</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <p className="text-white/20 font-bold">Carrinho vazio</p>
          </div>
        ) : (
          <>
            {step === "cart" ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {getGroupedItems().map((ci, i) => (
                    <div key={i} className="bg-[#141414] p-4 rounded-2xl border border-white/5 relative">
                      <h4 className="text-white font-bold">{ci.quantity}x {ci.item.nome}</h4>
                      <p className="text-white/40 text-[10px]">{ci.precoUnitario.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</p>
                      <button onClick={() => onRemove(ci.id)} className="absolute top-4 right-4 text-white/10">✕</button>
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-white/5">
                  <button onClick={() => setStep("address")} className="w-full h-14 rounded-2xl text-black font-black uppercase tracking-widest" style={{ backgroundColor: RESTAURANTE.cor }}>
                    Ir para Entrega
                  </button>
                </div>
              </>
            ) : (
              <CheckoutForm 
                totalItems={cartItems.reduce((acc, ci) => acc + (ci.precoUnitario * ci.quantity), 0)} 
                onConfirm={handleFinalizarWhatsApp} 
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}