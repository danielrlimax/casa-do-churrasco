import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { MenuItem } from "../data/menu";

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
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      const formatted = data.map((item: any) => ({
        ...item,
        categoria: item.categoria_id
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
      categoria_id: (editingItem as any).categoria 
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

  // Estilos de Scrollbar Customizada via Injeção de CSS
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
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">A</div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Admin Login</h2>
          </div>
          <div className="space-y-4">
            <input 
              type="email" placeholder="E-mail" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-red-500 outline-none transition-all"
              onChange={e => setEmail(e.target.value)}
            />
            <input 
              type="password" placeholder="Senha" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-red-500 outline-none transition-all"
              onChange={e => setPassword(e.target.value)}
            />
            <button className="w-full bg-red-600 py-4 rounded-2xl font-black text-white hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-600/20">
              ENTRAR NO PAINEL
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 sm:p-8 font-sans custom-scroll">
      <style>{scrollbarStyles}</style>
      <div className="max-w-4xl mx-auto">

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tighter italic">
            Painel Admin - Casa do Churrasco
          </h1>
          <p className="text-white/40 text-sm">Controle de estoque e produtos</p>
        </div>
        
        {/* Container flex para agrupar os botões */}
        <div className="flex gap-3 w-full sm:w-auto">
          <a 
            href="/" 
            className="flex-1 sm:flex-none flex items-center justify-center bg-white/5 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all"
          >
            Voltar
          </a>
          <button 
            onClick={() => setEditingItem({ nome: "", preco: 0, categoria: "burgers", disponivel: true, destaque: false, imagem: "", descricao: "" })}
            className="flex-1 sm:flex-none bg-white text-black px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-gray-200 transition-all"
          >
            + Novo Item
          </button>
        </div>
      </header>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-red-600"></div></div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {items.map(item => (
              <div key={item.id} className="bg-[#141414] p-4 rounded-[2rem] border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-2xl overflow-hidden bg-[#222]">
                    <img src={item.imagem} className="w-full h-full object-cover" alt="" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150')} />
                    {!item.disponivel && <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] font-bold text-red-500 uppercase">Indisp.</div>}
                  </div>
                  <div className="truncate">
                    <h3 className="font-bold text-white truncate pr-2">{item.nome}</h3>
                    <p className="text-white/40 text-[13px] font-medium uppercase tracking-tight">R$ {item.preco.toFixed(2)} • {item.categoria}</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-2">
                  <button onClick={() => setEditingItem(item)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-lg">✏️</button>
                  <button onClick={() => handleDelete(item.id)} className="w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors text-lg">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição 100% Responsivo */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form 
            onSubmit={handleSave} 
            className="bg-[#141414] p-6 sm:p-8 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-lg border-t sm:border border-white/10 max-h-[95vh] overflow-y-auto custom-scroll shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white italic tracking-tighter">{editingItem.id ? 'EDITAR ITEM' : 'CRIAR ITEM'}</h2>
              <button type="button" onClick={() => setEditingItem(null)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-white hover:bg-white/10 transition-colors">✕</button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-white/30 mb-2 ml-1 tracking-[0.2em] uppercase">Nome do Prato</label>
                <input 
                  required className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white focus:border-red-600 outline-none transition-all"
                  value={editingItem.nome} onChange={e => setEditingItem({...editingItem, nome: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/30 mb-2 ml-1 tracking-[0.2em] uppercase">Categoria</label>
                <div className="relative">
                  <select 
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white appearance-none cursor-pointer focus:border-red-600 outline-none"
                    value={(editingItem as any).categoria} 
                    onChange={e => setEditingItem({...editingItem, categoria: e.target.value})}
                  >
                    <option value="burgers" className="bg-[#141414]">🍔 Burgers</option>
                    <option value="entradas" className="bg-[#141414]">🥗 Entradas</option>
                    <option value="pratos" className="bg-[#141414]">🍝 Pratos</option>
                    <option value="sobremesas" className="bg-[#141414]">🍰 Sobremesas</option>
                    <option value="bebidas" className="bg-[#141414]">🥤 Bebidas</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 text-xs">▼</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-white/30 mb-2 ml-1 tracking-[0.2em] uppercase">Preço (R$)</label>
                  <input 
                    type="number" step="0.01" required className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-red-600"
                    value={editingItem.preco} onChange={e => setEditingItem({...editingItem, preco: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-white/30 mb-2 ml-1 tracking-[0.2em] uppercase">Selo/Tag</label>
                  <input 
                    placeholder="Ex: Novo" className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-red-600"
                    value={editingItem.tag || ''} onChange={e => setEditingItem({...editingItem, tag: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/30 mb-2 ml-1 tracking-[0.2em] uppercase">Ingredientes / Descrição</label>
                <textarea 
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white h-24 resize-none outline-none focus:border-red-600"
                  value={editingItem.descricao} onChange={e => setEditingItem({...editingItem, descricao: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-white/30 mb-2 ml-1 tracking-[0.2em] uppercase">Link da Imagem</label>
                <input 
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-2xl p-4 text-white text-xs outline-none focus:border-red-600"
                  value={editingItem.imagem} onChange={e => setEditingItem({...editingItem, imagem: e.target.value})}
                />
              </div>

              <div className="flex gap-3 p-1.5 bg-white/5 rounded-[1.2rem]">
                <label className="flex-1 flex items-center justify-center gap-2 py-3 cursor-pointer group rounded-xl hover:bg-white/5 transition-all">
                  <input type="checkbox" className="accent-red-600 w-4 h-4" checked={editingItem.disponivel} onChange={e => setEditingItem({...editingItem, disponivel: e.target.checked})} />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">Em Estoque</span>
                </label>
                <label className="flex-1 flex items-center justify-center gap-2 py-3 cursor-pointer group rounded-xl hover:bg-white/5 transition-all">
                  <input type="checkbox" className="accent-yellow-500 w-4 h-4" checked={editingItem.destaque} onChange={e => setEditingItem({...editingItem, destaque: e.target.checked})} />
                  <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white">Destaque</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-8">
              <button type="submit" className="w-full py-5 bg-red-600 hover:bg-red-700 rounded-2xl font-black text-white shadow-xl shadow-red-900/30 transition-all active:scale-[0.98]">
                CONFIRMAR E SALVAR
              </button>
              <button type="button" onClick={() => setEditingItem(null)} className="w-full py-4 text-white/20 hover:text-white/40 font-bold text-xs uppercase tracking-widest transition-colors">
                Cancelar e Fechar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}