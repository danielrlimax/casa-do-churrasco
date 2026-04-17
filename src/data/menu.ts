export interface MenuItem {
  id: string;
  categoria: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  disponivel: boolean;
  destaque: boolean;
  tag?: string;
}

export interface Categoria {
  id: string;
  nome: string;
  emoji: string;
}

export const RESTAURANTE = {
  nome: "Casa do Churrasco", // Nome base da loja
  slogan: "O melhor churrasco da região",
  telefone: "(19) 99999-9999",
  whatsapp: "5519999999999",
  instagram: "@casadochurrasco",
  horario: "Seg–Sáb: 18h às 23h",
  cor: "#650016", // Cor principal (Vermelho)
};

export const CATEGORIAS: Categoria[] = [
  { id: "todos", nome: "Todos", emoji: "🍽️" },
  { id: "principal", nome: "Principal", emoji: "🥗" },
  { id: "burgers", nome: "Burgers", emoji: "🍔" },
  { id: "pratos", nome: "Pratos", emoji: "🍝" },
  { id: "sobremesas", nome: "Doces", emoji: "🍰" },
  { id: "bebidas", nome: "Bebidas", emoji: "🥤" },
];