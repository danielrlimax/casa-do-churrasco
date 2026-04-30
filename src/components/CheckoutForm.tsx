import { useState } from "react";
import { RESTAURANTE } from "../data/menu";

export interface CheckoutData {
  endereco: {
    cep: string;
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
  };
  frete: number;
  distancia: number;
  pagamento: {
    metodo: "cartao" | "pix" | "dinheiro" | "";
    tipoCartao: "credito" | "debito" | "";
    trocoPara: string;
  };
}

interface CheckoutFormProps {
  onConfirm: (data: CheckoutData) => void;
  totalItems: number;
}

export default function CheckoutForm({ onConfirm, totalItems }: CheckoutFormProps) {
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  
  const [buscando, setBuscando] = useState(false);
  const [frete, setFrete] = useState<number>(0);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);

  const [metodoPagamento, setMetodoPagamento] = useState<"cartao" | "pix" | "dinheiro" | "">("");
  const [tipoCartao, setTipoCartao] = useState<"credito" | "debito" | "">("");
  const [trocoPara, setTrocoPara] = useState("");

  // Coordenadas fixas do CEP de Saída: 13520-000 (São Pedro - SP)
  const ORIGEM = { lat: -22.5485, lon: -47.9144 };

  const calcularDistanciaHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da Terra em KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const obterPrecoFrete = (km: number) => {
    if (km <= 1.2) return 5.0; // Margem de erro para 1km
    if (km <= 2.2) return 6.50;
    if (km <= 3.2) return 8.0;
    if (km <= 4.2) return 9.50;
    if (km <= 5.2) return 11.0;
    if (km <= 6.2) return 12.50;
    if (km <= 7.2) return 14.0;
    if (km <= 8.5) return 15.50;
    return -1;
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 8) valor = valor.slice(0, 8);
    const formatado = valor.replace(/^(\d{5})(\d)/, "$1-$2");
    setCep(formatado);

    if (valor.length === 8) {
      setBuscando(true);
      try {
        // 1. Busca Endereço (ViaCEP)
        const resEnd = await fetch(`https://viacep.com.br/ws/${valor}/json/`);
        const dataEnd = await resEnd.json();
        
        if (dataEnd.erro) throw new Error("CEP não existe");

        setRua(dataEnd.logradouro);
        setBairro(dataEnd.bairro);

        // 2. Busca Coordenadas (Nominatim OpenStreetMap)
        const resGeo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${valor}&country=Brazil`);
        const dataGeo = await resGeo.json();

        if (dataGeo.length > 0) {
          const { lat, lon } = dataGeo[0];
          const km = calcularDistanciaHaversine(ORIGEM.lat, ORIGEM.lon, parseFloat(lat), parseFloat(lon));
          const valorFrete = obterPrecoFrete(km);

          if (valorFrete === -1) {
            alert(`A distância (${km.toFixed(1)}km) está fora do nosso raio de entrega.`);
            setFrete(0);
            setDistanciaKm(null);
          } else {
            setDistanciaKm(parseFloat(km.toFixed(1)));
            setFrete(valorFrete);
            document.getElementById("numero-input")?.focus();
          }
        }
      } catch (err) {
        alert("Erro ao localizar CEP. Verifique a conexão.");
      } finally {
        setBuscando(false);
      }
    }
  };

  const handleFinalizar = () => {
    if (!metodoPagamento) return alert("Selecione a forma de pagamento.");
    onConfirm({
      endereco: { cep, rua, numero, complemento, bairro },
      frete,
      distancia: distanciaKm || 0,
      pagamento: { metodo: metodoPagamento, tipoCartao, trocoPara }
    });
  };

  const inputClass = "w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-[#e8a838]";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
        <div>
          <h3 className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-4">📍 Endereço</h3>
          <div className="space-y-3">
            <div className="relative">
              <input type="text" placeholder="Seu CEP" value={cep} onChange={handleCepChange} maxLength={9} className={inputClass} />
              {buscando && <span className="absolute right-4 top-4 text-[10px] text-[#e8a838] animate-pulse">LOCALIZANDO...</span>}
            </div>
            {distanciaKm && (
              <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex justify-between text-xs font-bold">
                <span className="text-white/60">Distância aprox: {distanciaKm}km</span>
                <span className="text-[#e8a838]">Frete: R$ {frete.toFixed(2)}</span>
              </div>
            )}
            <input type="text" placeholder="Rua" value={rua} onChange={e => setRua(e.target.value)} className={inputClass} />
            <div className="flex gap-3">
              <input id="numero-input" type="text" placeholder="Nº" value={numero} onChange={e => setNumero(e.target.value)} className={`w-1/3 ${inputClass}`} />
              <input type="text" placeholder="Compl." value={complemento} onChange={e => setComplemento(e.target.value)} className={`w-2/3 ${inputClass}`} />
            </div>
            <input type="text" placeholder="Bairro" value={bairro} onChange={e => setBairro(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <h3 className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-4">💳 Pagamento</h3>
          <div className="grid grid-cols-3 gap-2">
            {["cartao", "pix", "dinheiro"].map(m => (
              <button key={m} onClick={() => setMetodoPagamento(m as any)} className={`p-3 rounded-xl border text-[10px] font-black uppercase ${metodoPagamento === m ? 'border-[#e8a838] bg-[#e8a838]/10 text-[#e8a838]' : 'border-white/5 bg-[#141414] text-white/40'}`}>
                {m}
              </button>
            ))}
          </div>

          {metodoPagamento === "cartao" && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => setTipoCartao("credito")} className={`flex-1 p-2 rounded-lg border text-[10px] ${tipoCartao === 'credito' ? 'border-white text-white' : 'border-white/5 text-white/30'}`}>CRÉDITO</button>
              <button onClick={() => setTipoCartao("debito")} className={`flex-1 p-2 rounded-lg border text-[10px] ${tipoCartao === 'debito' ? 'border-white text-white' : 'border-white/5 text-white/30'}`}>DÉBITO</button>
            </div>
          )}

          {metodoPagamento === "dinheiro" && (
            <input type="text" placeholder="Troco para quanto?" value={trocoPara} onChange={e => setTrocoPara(e.target.value)} className={`${inputClass} mt-3`} />
          )}
        </div>
      </div>

      <div className="p-6 bg-[#141414] border-t border-white/5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-white/40 text-xs font-bold uppercase">Total Geral</span>
          <span className="text-white font-black text-xl">R$ {(totalItems + frete).toFixed(2)}</span>
        </div>
        <button onClick={handleFinalizar} className="w-full h-14 rounded-2xl text-black font-black text-sm uppercase tracking-widest" style={{ backgroundColor: RESTAURANTE.cor }}>
          Finalizar Pedido
        </button>
      </div>
    </div>
  );
}