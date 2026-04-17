import { useState, useMemo, useEffect } from "react";
import { MenuItem, Categoria } from "./data/menu"; // Mantemos as interfaces
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
  const isAdminPath = window.location.pathname === "/login";

  if (isAdminPath) {
    return <Admin />;
  }
  // ── State ──────────────────────────────────────────────────
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // ── Fetch Data ─────────────────────────────────────────────
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Busca Categorias
        const { data: catData } = await supabase
          .from('categorias')
          .select('*')
          .order('nome');
        
        // Busca Itens do Menu (renomeando categoria_id para categoria para manter compatibilidade)
        const { data: menuData } = await supabase
          .from('menu_items')
          .select('*');

        if (catData) {
          setCategorias([{ id: "todos", nome: "Todos", emoji: "🍽️" }, ...catData]);
        }
        
        if (menuData) {
          // Mapeamos o campo do banco 'categoria_id' para o 'categoria' que o front espera
          const formattedMenu = menuData.map((item: any) => ({
            ...item,
            categoria: item.categoria_id
          }));
          setMenu(formattedMenu);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // ── Cart helpers ───────────────────────────────────────────
  const addToCart = (item: MenuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (item: MenuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((ci) => ci.item.id !== item.id);
      return prev.map((ci) =>
        ci.item.id === item.id ? { ...ci, quantity: ci.quantity - 1 } : ci
      );
    });
  };

  const clearCart = () => setCartItems([]);

  const getQuantity = (itemId: string) =>
    cartItems.find((ci) => ci.item.id === itemId)?.quantity ?? 0;

  const cartCount = cartItems.reduce((acc, ci) => acc + ci.quantity, 0);

  // ── Filtered menu ──────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let items = menu;

    if (selectedCategory !== "todos") {
      items = items.filter((i) => i.categoria === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (i) =>
          i.nome.toLowerCase().includes(q) ||
          i.descricao.toLowerCase().includes(q) ||
          i.categoria.toLowerCase().includes(q) ||
          (i.tag?.toLowerCase().includes(q) ?? false)
      );
    }

    return items;
  }, [selectedCategory, searchQuery, menu]);

  // ── Grouped by category ─────────────────
  const groupedItems = useMemo(() => {
    if (selectedCategory !== "todos" || searchQuery.trim()) {
      return null;
    }
    const groups: { cat: Categoria; items: MenuItem[] }[] = [];
    categorias.filter((c) => c.id !== "todos").forEach((cat) => {
      const items = menu.filter((i) => i.categoria === cat.id);
      if (items.length > 0) groups.push({ cat, items });
    });
    return groups;
  }, [selectedCategory, searchQuery, menu, categorias]);

  // ── Highlights ─────────────────────────────────
  const highlights = useMemo(
    () => menu.filter((i) => i.destaque && i.disponivel),
    [menu]
  );

  return (
    <div className="min-h-screen bg-[#111] text-white">
      <Header cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <Hero />
      
      <CategoryFilter 
        selected={selectedCategory} 
        onChange={setSelectedCategory} 
      />
      
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      <main className="max-w-4xl mx-auto px-4 pb-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-yellow-400"></div>
          </div>
        ) : (
          <>
            {/* ── Destaques ── */}
            {selectedCategory === "todos" && !searchQuery && highlights.length > 0 && (
              <section className="mt-6 mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-yellow-400 text-lg">⭐</span>
                  <h2 className="text-white font-extrabold text-lg">Destaques da Casa</h2>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
                  {highlights.map((item) => (
                    <div key={item.id} className="flex-shrink-0 w-56">
                      <MenuCard
                        item={item}
                        quantity={getQuantity(item.id)}
                        onAdd={addToCart}
                        onRemove={removeFromCart}
                        onClick={setSelectedItem}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Search result view ── */}
            {searchQuery.trim() && (
              <div className="mt-5 mb-3">
                <p className="text-white/40 text-sm">
                  {filteredItems.length === 0
                    ? `Nenhum resultado para "${searchQuery}"`
                    : `${filteredItems.length} resultado${filteredItems.length !== 1 ? "s" : ""} para "${searchQuery}"`}
                </p>
              </div>
            )}

            {/* ── GROUPED VIEW ── */}
            {groupedItems && !searchQuery && (
              <div className="space-y-10 mt-2">
                {groupedItems.map(({ cat, items }) => (
                  <section key={cat.id}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-2xl">{cat.emoji}</span>
                      <h2 className="text-white font-extrabold text-lg">{cat.nome}</h2>
                      <span className="text-white/20 text-sm ml-auto">{items.length} itens</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {items.map((item) => (
                        <MenuCard
                          key={item.id}
                          item={item}
                          quantity={getQuantity(item.id)}
                          onAdd={addToCart}
                          onRemove={removeFromCart}
                          onClick={setSelectedItem}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* ── FLAT VIEW ── */}
            {(!groupedItems || searchQuery.trim()) && (
              <div className="mt-4">
                {!searchQuery && selectedCategory !== "todos" && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">
                      {categorias.find((c) => c.id === selectedCategory)?.emoji}
                    </span>
                    <h2 className="text-white font-extrabold text-lg">
                      {categorias.find((c) => c.id === selectedCategory)?.nome}
                    </h2>
                    <span className="text-white/20 text-sm ml-auto">{filteredItems.length} itens</span>
                  </div>
                )}
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="text-5xl mb-4">🔍</span>
                    <p className="text-white/40 font-semibold">Nenhum item encontrado</p>
                    <p className="text-white/20 text-sm mt-1">Tente outra categoria ou busca</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredItems.map((item) => (
                      <MenuCard
                        key={item.id}
                        item={item}
                        quantity={getQuantity(item.id)}
                        onAdd={addToCart}
                        onRemove={removeFromCart}
                        onClick={setSelectedItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      <ItemModal
        item={selectedItem}
        quantity={getQuantity(selectedItem?.id ?? "")}
        onClose={() => setSelectedItem(null)}
        onAdd={addToCart}
        onRemove={removeFromCart}
      />

      <CartDrawer
        open={cartOpen}
        cartItems={cartItems}
        onClose={() => setCartOpen(false)}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onClear={clearCart}
      />
    </div>
  );
}