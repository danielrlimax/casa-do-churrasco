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

// Variável global fora do componente para armazenar em cache a coordenada da loja (Centro: 13520-000)
let storeCoords: { lat: number; lon: number } | null = null;

export default function CheckoutForm({ onConfirm, totalItems }: CheckoutFormProps) {
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  
  const [buscando, setBuscando] = useState(false);
  const [frete, setFrete] = useState<number>(0);
  const [distanciaKm, setDistanciaKm] = useState<number | null>(null);
  const [foraDaZona, setForaDaZona] = useState<boolean>(false);

  const [metodoPagamento, setMetodoPagamento] = useState<"cartao" | "pix" | "dinheiro" | "">("");
  const [tipoCartao, setTipoCartao] = useState<"credito" | "debito" | "">("");
  const [trocoPara, setTrocoPara] = useState("");

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  // ==========================================
  // LÓGICA DE GEOLOCALIZAÇÃO
  // ==========================================
  const getCoordinates = async (cepBusca: string) => {
    const resViaCep = await fetch(`https://viacep.com.br/ws/${cepBusca}/json/`);
    const dataCep = await resViaCep.json();
    
    if (dataCep.erro) throw new Error("CEP_NAO_ENCONTRADO");

    let dataGeo = [];

    // TENTATIVA 1: Busca direta pelo CEP no Nominatim
    let resGeo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${cepBusca}&country=Brazil`);
    dataGeo = await resGeo.json();

    // TENTATIVA 2: Busca por Rua, Cidade, Estado
    if (dataGeo.length === 0 && dataCep.logradouro) {
        let query = `${dataCep.logradouro}, ${dataCep.localidade}, ${dataCep.uf}`;
        resGeo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        dataGeo = await resGeo.json();
    }
    
    // TENTATIVA 3: Busca por Bairro, Cidade, Estado
    if (dataGeo.length === 0 && dataCep.bairro) {
        let query = `${dataCep.bairro}, ${dataCep.localidade}, ${dataCep.uf}`;
        resGeo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        dataGeo = await resGeo.json();
    }

    // TENTATIVA 4 (Fallback Final): Apenas Cidade e Estado (Garante que CEPs distantes sejam localizados)
    if (dataGeo.length === 0) {
        let query = `${dataCep.localidade}, ${dataCep.uf}`;
        resGeo = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        dataGeo = await resGeo.json();
    }
    
    if (dataGeo.length === 0) throw new Error("COORDENADAS_NAO_ENCONTRADAS");
    
    return {
        lat: parseFloat(dataGeo[0].lat),
        lon: parseFloat(dataGeo[0].lon),
        logradouro: dataCep.logradouro || "",
        bairro: dataCep.bairro || ""
    };
  };

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Raio da terra em KM
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // ==========================================
  // TABELA DE VALORES DE FRETE
  // ==========================================
  const obterPrecoFrete = (km: number) => {
    const kmArredondado = Math.ceil(km);
    
    if (kmArredondado <= 1) return 5.0;
    if (kmArredondado === 2) return 5.0;
    if (kmArredondado === 3) return 6.5;
    if (kmArredondado === 4) return 8.0;
    if (kmArredondado === 5) return 9.5;
    if (kmArredondado === 6) return 11.0;
    if (kmArredondado === 7) return 12.50;
    if (kmArredondado === 8) return 14;
    
    return -1; // -1 indica fora da área de cobertura (> 8km)
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 8) valor = valor.slice(0, 8);
    
    const formatado = valor.replace(/^(\d{5})(\d)/, "$1-$2");
    setCep(formatado);

    if (valor.length === 8) {
      setBuscando(true);
      setForaDaZona(false); // Reseta o estado antes de buscar
      setDistanciaKm(null);
      
      try {
        if (!storeCoords) {
            const originData = await getCoordinates("13521090");
            storeCoords = { lat: originData.lat, lon: originData.lon };
        }

        const userCoords = await getCoordinates(valor);
        setRua(userCoords.logradouro);
        setBairro(userCoords.bairro);

        const distance = getDistanceFromLatLonInKm(storeCoords.lat, storeCoords.lon, userCoords.lat, userCoords.lon);
        const valorFrete = obterPrecoFrete(distance);

        setDistanciaKm(parseFloat(distance.toFixed(1)));

        // Condição ativada para bloquear fora da zona de entrega (> 8km)
        if (valorFrete === -1) {
          setFrete(0);
          setForaDaZona(true);
        } else {
          setFrete(valorFrete);
          setForaDaZona(false);
          document.getElementById("numero-input")?.focus();
        }

      } catch (err: any) {
        if (err.message === "CEP_NAO_ENCONTRADO") {
            alert("O CEP digitado não existe. Verifique e tente novamente.");
        } else {
            alert("Tivemos um problema para localizar esse endereço no mapa.");
        }
        setFrete(0);
        setDistanciaKm(null);
        setForaDaZona(true); // Se der erro catastrófico, impede a venda para evitar entrega sem frete
      } finally {
        setBuscando(false);
      }
    }
  };

  const handleFinalizar = () => {
    if (foraDaZona) return alert("Endereço fora da zona de entrega. Não é possível enviar o pedido.");
    
    if (!cep || !rua || !numero || !bairro) return alert("Preencha todos os campos de endereço.");
    if (frete === 0 && distanciaKm === null) return alert("Por favor, insira um CEP válido e dentro da área de cobertura.");
    if (!metodoPagamento) return alert("Selecione uma forma de pagamento.");
    if (metodoPagamento === "cartao" && !tipoCartao) return alert("Selecione se o cartão é Crédito ou Débito.");
    
    onConfirm({
      endereco: { cep, rua, numero, complemento, bairro },
      frete,
      distancia: distanciaKm || 0,
      pagamento: { metodo: metodoPagamento, tipoCartao, trocoPara }
    });
  };

  const inputClass = "w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-[#e8a838] transition-colors";
  const btnClass = "flex-1 p-3 rounded-xl border text-sm font-bold transition-colors";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scroll">
        
        {/* SESSÃO DE ENDEREÇO */}
        <div className="space-y-4">
          <h3 className="text-white/50 text-xs font-black uppercase tracking-widest">Endereço de Entrega</h3>
          <div className="relative">
            <input type="text" placeholder="CEP de Destino" value={cep} onChange={handleCepChange} maxLength={9} className={inputClass} />
            {buscando && <span className="absolute right-4 top-4 text-xs font-bold text-[#e8a838] animate-pulse">Calculando...</span>}
          </div>
          
          {distanciaKm !== null && foraDaZona && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex justify-between items-center text-xs font-bold text-red-500 animate-fade-in">
              <span>Distância: ~{distanciaKm}km</span>
              <span>Fora da área de cobertura</span>
            </div>
          )}

          {distanciaKm !== null && !foraDaZona && frete > 0 && (
            <div className="bg-[#e8a838]/10 border border-[#e8a838]/20 rounded-xl p-3 flex justify-between items-center text-xs font-bold text-[#e8a838] animate-fade-in">
              <span>Distância detectada: ~{distanciaKm}km</span>
              <span>✓ Frete calculado</span>
            </div>
          )}

          <input type="text" placeholder="Rua" value={rua} onChange={(e) => setRua(e.target.value)} className={inputClass} />
          <div className="flex gap-4">
            <input id="numero-input" type="text" placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} className={`w-1/3 ${inputClass}`} />
            <input type="text" placeholder="Complemento" value={complemento} onChange={(e) => setComplemento(e.target.value)} className={`w-2/3 ${inputClass}`} />
          </div>
          <input type="text" placeholder="Bairro / Localidade" value={bairro} onChange={(e) => setBairro(e.target.value)} className={inputClass} />
        </div>

        <hr className="border-white/5" />

        {/* SESSÃO DE PAGAMENTO */}
        <div className={`space-y-4 ${foraDaZona ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="text-white/50 text-xs font-black uppercase tracking-widest">Forma de Pagamento</h3>
          <div className="flex gap-2">
            <button onClick={() => setMetodoPagamento("cartao")} className={`${btnClass} ${metodoPagamento === 'cartao' ? 'border-[#e8a838] bg-[#e8a838]/10 text-[#e8a838]' : 'border-white/5 bg-[#1e1e1e] text-white/50'}`}>Cartão</button>
            <button onClick={() => setMetodoPagamento("pix")} className={`${btnClass} ${metodoPagamento === 'pix' ? 'border-[#e8a838] bg-[#e8a838]/10 text-[#e8a838]' : 'border-white/5 bg-[#1e1e1e] text-white/50'}`}>PIX</button>
            <button onClick={() => setMetodoPagamento("dinheiro")} className={`${btnClass} ${metodoPagamento === 'dinheiro' ? 'border-[#e8a838] bg-[#e8a838]/10 text-[#e8a838]' : 'border-white/5 bg-[#1e1e1e] text-white/50'}`}>Dinheiro</button>
          </div>

          {metodoPagamento === "cartao" && (
            <div className="flex gap-2 mt-2 animate-fade-in">
              <button onClick={() => setTipoCartao("credito")} className={`flex-1 p-2 rounded-lg border text-xs font-bold ${tipoCartao === 'credito' ? 'border-white/40 bg-white/10 text-white' : 'border-white/5 bg-transparent text-white/30'}`}>Crédito</button>
              <button onClick={() => setTipoCartao("debito")} className={`flex-1 p-2 rounded-lg border text-xs font-bold ${tipoCartao === 'debito' ? 'border-white/40 bg-white/10 text-white' : 'border-white/5 bg-transparent text-white/30'}`}>Débito</button>
            </div>
          )}

          {metodoPagamento === "dinheiro" && (
            <div className="mt-2 animate-fade-in">
              <input type="text" placeholder="Precisa de troco para quanto? (Ex: R$ 50)" value={trocoPara} onChange={(e) => setTrocoPara(e.target.value)} className={inputClass} />
            </div>
          )}
        </div>

      </div>

      {/* FOOTER TOTAL */}
      <div className="p-6 border-t border-white/5 bg-[#141414] shrink-0">
        <div className="flex justify-between items-end mb-2">
          <span className="text-white/50 text-xs font-bold">Subtotal dos itens</span>
          <span className="text-white/80">{formatCurrency(totalItems)}</span>
        </div>
        <div className="flex justify-between items-end mb-4">
          <span className="text-white/50 text-xs font-bold">Frete {distanciaKm ? `(${distanciaKm}km)` : ''}</span>
          
          <span className={foraDaZona ? "text-red-500 font-bold text-xs" : (frete > 0 ? "text-white/80" : "text-white/30")}>
            {foraDaZona ? "(Fora da zona de entrega)" : (frete > 0 ? formatCurrency(frete) : "A calcular...")}
          </span>
        </div>
        
        {/* TOTAL GERAL EM DESTAQUE */}
        <div className="flex justify-between items-end mb-6 border-t border-white/5 pt-4">
          <span className="text-[#e8a838] text-sm font-black uppercase tracking-widest">Total Geral</span>
          <span className="text-[#e8a838] font-black text-2xl">
            {foraDaZona ? "--" : formatCurrency(totalItems + frete)}
          </span>
        </div>
        
        {/* BOTÃO FINALIZAR / BLOQUEADO */}
        <button 
          onClick={handleFinalizar} 
          disabled={foraDaZona}
          className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-xl transition-all 
            ${foraDaZona ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-70' : 'text-black active:scale-95'}`}
          style={{ backgroundColor: foraDaZona ? undefined : RESTAURANTE.cor }}
        >
          {foraDaZona ? "Entrega Indisponível" : "Finalizar Pedido"}
        </button>
      </div>
    </div>
  );
}