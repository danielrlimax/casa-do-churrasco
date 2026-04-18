import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { MenuItem, CATEGORIAS, Secao, SecaoItem } from "../data/menu";

export default function Admin() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchItems();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchItems();
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase.from("menu_items").select("*").order("created_at", { ascending: false });
    if (data) {
      const formatted = data.map((item: any) => ({
        ...item,
        categoria: item.categoria_id,
        secoes: item.secoes || []
      }));
      setItems(formatted);
    }
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("Erro no login: " + error.message);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;

    const payload = { 
      nome: editingItem.nome,
      descricao: editingItem.descricao,
      preco: editingItem.preco,
      imagem: editingItem.imagem,
      disponivel: editingItem.disponivel,
      destaque: editingItem.destaque,
      tag: editingItem.tag,
      categoria_id: (editingItem as any).categoria,
      secoes: editingItem.secoes || []
    };

    const { error } = editingItem.id 
      ? await supabase.from("menu_items").update(payload).eq("id", editingItem.id)
      : await supabase.from("menu_items").insert([payload]);

    if (error) alert("Erro ao salvar: " + error.message);
    else {
      setEditingItem(null);
      fetchItems();
    }
  }

  async function handleDelete(id: string) {
    if (confirm("Deseja realmente excluir este item?")) {
      await supabase.from("menu_items").delete().eq("id", id);
      fetchItems();
    }
  }

  // Lógica de Seções
  const handleAddSecao = () => {
    const novaSecao: Secao = { id: Date.now().toString(), nome: "", obrigatorio: false, minimo: 0, maximo: 1, itens: [] };
    setEditingItem(prev => ({ ...prev, secoes: [...(prev?.secoes || []), novaSecao] }));
  };
  const handleUpdateSecao = (index: number, field: keyof Secao, value: any) => {
    const novasSecoes = [...(editingItem?.secoes || [])];
    novasSecoes[index] = { ...novasSecoes[index], [field]: value };
    setEditingItem(prev => ({ ...prev, secoes: novasSecoes }));
  };
  const handleRemoveSecao = (index: number) => {
    const novasSecoes = [...(editingItem?.secoes || [])];
    novasSecoes.splice(index, 1);
    setEditingItem(prev => ({ ...prev, secoes: novasSecoes }));
  };

  // Lógica de Itens da Seção
  const handleAddSecaoItem = (secaoIndex: number) => {
    const novasSecoes = [...(editingItem?.secoes || [])];
    novasSecoes[secaoIndex].itens.push({ id: Date.now().toString(), nome: "", valor: 0 });
    setEditingItem(prev => ({ ...prev, secoes: novasSecoes }));
  };
  const handleUpdateSecaoItem = (secaoIndex: number, itemIndex: number, field: keyof SecaoItem, value: any) => {
    const novasSecoes = [...(editingItem?.secoes || [])];
    novasSecoes[secaoIndex].itens[itemIndex] = { ...novasSecoes[secaoIndex].itens[itemIndex], [field]: value };
    setEditingItem(prev => ({ ...prev, secoes: novasSecoes }));
  };
  const handleRemoveSecaoItem = (secaoIndex: number, itemIndex: number) => {
    const novasSecoes = [...(editingItem?.secoes || [])];
    novasSecoes[secaoIndex].itens.splice(itemIndex, 1);
    setEditingItem(prev => ({ ...prev, secoes: novasSecoes }));
  };

  const scrollbarStyles = `
    .custom-scroll::-webkit-scrollbar { width: 6px; }
    .custom-scroll::-webkit-scrollbar-track { background: transparent; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
    .custom-scroll::-webkit-scrollbar-thumb:hover { background: #444; }
  `;

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <style>{scrollbarStyles}</style>
        <form onSubmit={handleLogin} className="bg-[#141414] p-8 rounded-[2.5rem] w-full max-w-md border border-white/5 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Admin Login</h2>
          </div>
          <div className="space-y-4">
            <input type="email" placeholder="E-mail" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-[#e8a838] outline-none transition-all" onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Senha" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-[#e8a838] outline-none transition-all" onChange={e => setPassword(e.target.value)} />
            <button className="w-full bg-[#e8a838] py-4 rounded-2xl font-black text-black hover:bg-[#d69628] transition-all active:scale-95 shadow-lg"> ENTRAR NO PAINEL </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans custom-scroll">
      <style>{scrollbarStyles}</style>
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tighter italic"> Painel Admin </h1>
            <p className="text-white/40 text-sm">Controle de estoque e produtos</p>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
            <button onClick={handleLogout} className="flex-1 sm:flex-none flex items-center justify-center bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl font-bold transition-all text-white/50"> Sair </button>
            <button onClick={() => setEditingItem({ disponivel: true, destaque: false, secoes: [] })} className="flex-1 sm:flex-none flex items-center justify-center bg-[#e8a838] hover:bg-[#d69628] text-black px-6 py-3 rounded-2xl font-black transition-all shadow-lg"> + NOVO ITEM </button>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-20 text-white/50">Carregando itens...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className={`bg-[#141414] border ${item.disponivel ? "border-white/10" : "border-red-900/30"} p-4 rounded-3xl flex gap-4 items-center`}>
                <div className="w-20 h-20 bg-white/5 rounded-2xl overflow-hidden shrink-0 relative">
                  <img src={item.imagem} className={`w-full h-full object-cover ${!item.disponivel && "grayscale opacity-50"}`} alt={item.nome} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg truncate">{item.nome}</h3>
                    {item.destaque && <span className="bg-yellow-500/20 text-yellow-500 text-[10px] px-2 py-0.5 rounded-full font-bold">TOP</span>}
                  </div>
                  <p className="text-white/40 text-sm mb-2">{CATEGORIAS.find(c => c.id === item.categoria)?.nome || item.categoria}</p>
                  <p className="font-black text-[#e8a838]">R$ {item.preco?.toFixed(2)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setEditingItem(item)} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"> ✏️ </button>
                  <button onClick={() => handleDelete(item.id)} className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center transition-all"> 🗑️ </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {editingItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <form onSubmit={handleSave} className="bg-[#141414] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scroll p-6 sm:p-8 relative shadow-2xl">
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-[#141414] pb-4 z-10 border-b border-white/5">
                <h2 className="text-2xl font-black tracking-tighter italic">{editingItem.id ? 'EDITAR ITEM' : 'CRIAR ITEM'}</h2>
                <button type="button" onClick={() => setEditingItem(null)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-white hover:bg-white/10 transition-colors">✕</button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-white/30 mb-2 ml-1 tracking-[0.2em] uppercase">Nome do Prato</label>
                  <input required className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white focus:border-[#e8a838] outline-none transition-all" value={editingItem.nome || ''} onChange={e => setEditingItem({...editingItem, nome: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-white/30 mb-2 ml-1 tracking-[0.2em] uppercase">Preço (R$)</label>
                    <input required type="number" step="0.01" className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white focus:border-[#e8a838] outline-none transition-all" value={editingItem.preco || ''} onChange={e => setEditingItem({...editingItem, preco: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-white/30 mb-2 ml-1 tracking-[0.2em] uppercase">Categoria</label>
                    <select required className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white focus:border-[#e8a838] outline-none transition-all appearance-none" value={(editingItem as any).categoria || ""} onChange={e => setEditingItem({...editingItem, categoria: e.target.value} as any)}>
                      <option value="">Selecione...</option>
                      {CATEGORIAS.filter(c => c.id !== "todos").map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/30 mb-2 ml-1 tracking-[0.2em] uppercase">Descrição</label>
                  <textarea className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white focus:border-[#e8a838] outline-none transition-all min-h-[80px]" value={editingItem.descricao || ''} onChange={e => setEditingItem({...editingItem, descricao: e.target.value})} />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/30 mb-2 ml-1 tracking-[0.2em] uppercase">URL da Imagem</label>
                  <input required className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white focus:border-[#e8a838] outline-none transition-all" value={editingItem.imagem || ''} onChange={e => setEditingItem({...editingItem, imagem: e.target.value})} />
                </div>

                {/* GESTÃO DE SEÇÕES / ACOMPANHAMENTOS */}
                <div className="border-t border-white/10 pt-6 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-black text-white tracking-wider uppercase">Seções e Adicionais</label>
                    <button type="button" onClick={handleAddSecao} className="bg-white/10 hover:bg-white/20 text-xs px-3 py-1.5 rounded-lg font-bold transition-all">+ Adicionar Seção</button>
                  </div>
                  
                  {(editingItem.secoes || []).map((secao, sIdx) => (
                    <div key={sIdx} className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4">
                      <div className="flex flex-wrap gap-2 items-center mb-4">
                        <input placeholder="Ex: Escolha sua carne" className="flex-1 min-w-[200px] bg-[#1e1e1e] border border-white/10 rounded-xl p-2 text-sm text-white" value={secao.nome} onChange={e => handleUpdateSecao(sIdx, 'nome', e.target.value)} />
                        <label className="flex items-center gap-2 text-xs text-white/60">
                          <input type="checkbox" checked={secao.obrigatorio} onChange={e => handleUpdateSecao(sIdx, 'obrigatorio', e.target.checked)} className="accent-[#e8a838]" /> Obrigatório
                        </label>
                        <div className="flex items-center gap-1">
                          <input type="number" placeholder="Mín" className="w-14 bg-[#1e1e1e] border border-white/10 rounded-xl p-2 text-sm text-white text-center" value={secao.minimo} onChange={e => handleUpdateSecao(sIdx, 'minimo', Number(e.target.value))} />
                          <span className="text-white/30 text-xs">até</span>
                          <input type="number" placeholder="Máx" className="w-14 bg-[#1e1e1e] border border-white/10 rounded-xl p-2 text-sm text-white text-center" value={secao.maximo} onChange={e => handleUpdateSecao(sIdx, 'maximo', Number(e.target.value))} />
                        </div>
                        <button type="button" onClick={() => handleRemoveSecao(sIdx)} className="text-red-500/50 hover:text-red-500 p-2">🗑️</button>
                      </div>

                      <div className="pl-4 border-l-2 border-white/10 space-y-2">
                        {secao.itens.map((item, iIdx) => (
                          <div key={iIdx} className="flex gap-2">
                            <input placeholder="Ex: Picanha" className="flex-1 bg-[#1e1e1e] border border-white/10 rounded-xl p-2 text-sm text-white" value={item.nome} onChange={e => handleUpdateSecaoItem(sIdx, iIdx, 'nome', e.target.value)} />
                            <input type="number" step="0.01" placeholder="R$ Adicional" className="w-28 bg-[#1e1e1e] border border-white/10 rounded-xl p-2 text-sm text-white" value={item.valor} onChange={e => handleUpdateSecaoItem(sIdx, iIdx, 'valor', Number(e.target.value))} />
                            <button type="button" onClick={() => handleRemoveSecaoItem(sIdx, iIdx)} className="text-red-500/50 hover:text-red-500 px-2">✕</button>
                          </div>
                        ))}
                        <button type="button" onClick={() => handleAddSecaoItem(sIdx)} className="text-xs text-white/50 hover:text-white mt-2 inline-block">+ Adicionar Opção</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 py-3 cursor-pointer group rounded-xl hover:bg-white/5 transition-all">
                    <input type="checkbox" className="accent-green-500 w-4 h-4" checked={editingItem.disponivel} onChange={e => setEditingItem({...editingItem, disponivel: e.target.checked})} />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">Em Estoque</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-2 py-3 cursor-pointer group rounded-xl hover:bg-white/5 transition-all">
                    <input type="checkbox" className="accent-yellow-500 w-4 h-4" checked={editingItem.destaque} onChange={e => setEditingItem({...editingItem, destaque: e.target.checked})} />
                    <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">Destaque</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <button type="submit" className="w-full py-5 bg-[#e8a838] hover:bg-[#d69628] rounded-2xl font-black text-black shadow-xl transition-all active:scale-[0.98]"> CONFIRMAR E SALVAR </button>
                <button type="button" onClick={() => setEditingItem(null)} className="w-full py-4 text-white/20 hover:text-white/40 font-bold text-sm">Cancelar</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}