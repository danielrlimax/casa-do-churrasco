import { useState, useMemo, useEffect } from "react";
import { MenuItem, Categoria, CATEGORIAS, SecaoItem } from "./data/menu";
import { supabase } from "./lib/supabase";
import Header from "./components/Header";
import Hero from "./components/Hero";
import CategoryFilter from "./components/CategoryFilter";
import SearchBar from "./components/SearchBar";
import MenuCard from "./components/MenuCard";
import ItemModal from "./components/ItemModal";
import CartDrawer, { CartItem } from "./components/CartDrawer";
import Footer from "./components/Footer";
import Admin from "./components/Admin";

export default function App() {
  const isAdminPath = window.location.pathname === "/admin";

  if (isAdminPath) {
    return <Admin />;
  }

  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const { data: menuData } = await supabase
          .from('menu_items')
          .select('*')
          .order('nome', { ascending: true });

        if (menuData) {
          const formatted = menuData.map((item: any) => ({
            ...item,
            categoria: item.categoria_id || item.categoria,
            secoes: item.secoes || []
          }));
          
          // Ordenação natural (faz o 2 vir antes do 10)
          formatted.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));

          setMenu(formatted);
        }
      } catch (error) {
        console.error("Erro ao buscar cardápio:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleAddToCart = (item: MenuItem, selecoes: Record<string, SecaoItem[]>, observacoes: string, qty: number) => {
    const newItem: CartItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      item,
      quantity: qty,
      selecoes,
      observacoes,
      precoUnitario: item.preco
    };
    setCartItems((prev) => [...prev, newItem]);
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const getQuantityTotal = (itemId: string) => {
    return cartItems.filter((i) => i.item.id === itemId).reduce((acc, curr) => acc + curr.quantity, 0);
  };

  const filteredItems = useMemo(() => {
    return menu.filter((item) => {
      const matchesCategory = selectedCategory === "todos" || item.categoria === selectedCategory;
      const matchesSearch =
        item.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.descricao.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  // Filtra itens em destaque
  const highlightedItems = useMemo(() => {
    return menu.filter(item => item.destaque && item.disponivel);
  }, [menu]);

  const groupedItems = useMemo(() => {
    if (searchQuery.trim() || selectedCategory !== "todos") return null;

    const groups: Record<string, MenuItem[]> = {};
    CATEGORIAS.forEach((cat: Categoria) => {
      if (cat.id !== "todos") groups[cat.id] = [];
    });

    menu.forEach((item) => {
      if (groups[item.categoria]) {
        groups[item.categoria].push(item);
      }
    });

    return groups;
  }, [menu, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans selection:bg-[#e8a838] selection:text-black">
      <Header cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} onCartClick={() => setCartOpen(true)} />
      <Hero />
      <CategoryFilter selected={selectedCategory} onChange={setSelectedCategory} />
      
      <main className="max-w-4xl mx-auto pb-24 px-4 sm:px-6">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e8a838]"></div>
          </div>
        ) : (
          <>
            {/* Visualização Agrupada (Padrão do Cardápio) */}
            {groupedItems && !searchQuery.trim() && selectedCategory === "todos" && (
              <div className="mt-6 space-y-10">
                
                {/* DESTAQUES NO ESTILO CARROSSEL HORIZONTAL */}
                {highlightedItems.length > 0 && (
                  <section>
                    <h2 className="text-[#e8a838] font-black text-2xl italic uppercase tracking-tighter mb-4 flex items-center gap-2">
                      ⭐ Destaques da Casa
                    </h2>
                    {/* Container flexível com rolagem lateral e ocultando a barra de rolagem */}
                    <div 
                      className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory" 
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      {highlightedItems.map((item) => (
                        // Card menor (280px) em linha
                        <div key={`highlight-${item.id}`} className="shrink-0 w-[280px] snap-start">
                          <MenuCard item={item} quantity={getQuantityTotal(item.id)} onClick={setSelectedItem} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Categorias Normais (Lista Padrão) */}
                {CATEGORIAS.filter((c) => c.id !== "todos" && groupedItems[c.id]?.length > 0).map((cat) => (
                  <section key={cat.id}>
                    <h2 className="text-white font-black text-2xl italic uppercase tracking-tighter mb-4">{cat.nome}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {groupedItems[cat.id].map((item) => (
                        <MenuCard key={item.id} item={item} quantity={getQuantityTotal(item.id)} onClick={setSelectedItem} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* Visualização por Busca ou Categoria Específica (Sem agrupar) */}
            {(!groupedItems || searchQuery.trim() || selectedCategory !== "todos") && (
              <div className="mt-6">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="text-5xl mb-4">🔍</span>
                    <p className="text-white/40 font-semibold">Nenhum item encontrado</p>
                    <p className="text-white/20 text-sm mt-1">Tente outra categoria ou busca</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredItems.map((item) => (
                      <MenuCard key={item.id} item={item} quantity={getQuantityTotal(item.id)} onClick={setSelectedItem} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onAddToCart={handleAddToCart} />
      
      <CartDrawer 
        open={cartOpen} 
        cartItems={cartItems} 
        onClose={() => setCartOpen(false)} 
        onRemove={handleRemoveFromCart} 
        onClear={() => setCartItems([])} 
      />
    </div>
  );
}