export interface Categoria {
  id: string;
  nome: string;
}

export interface SecaoItem {
  id: string;
  nome: string;
  valor: number;
}

export interface Secao {
  id: string;
  nome: string;
  obrigatorio: boolean;
  minimo: number;
  maximo: number;
  itens: SecaoItem[];
}

export interface MenuItem {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  disponivel: boolean;
  destaque: boolean;
  tag?: string;
  categoria: string;
  secoes?: Secao[];
}

export const CATEGORIAS: Categoria[] = [
  { id: "todos", nome: "Todos" },
  { id: "espetinho", nome: "Espetinho" },
  { id: "rodizio", nome: "Rodízio" },
  { id: "combos", nome: "Combos" },
  { id: "marmitex", nome: "Marmitex" },
  { id: "pizzas", nome: "Pizzas" },
  { id: "fit", nome: "Fit" },
  { id: "churrasco", nome: "Churrasco" },
  { id: "massas", nome: "Massas" },
  { id: "saladas", nome: "Saladas" },
  { id: "acompanhamentos", nome: "Acompanhamentos" },
  { id: "sobremesas", nome: "Sobremesas" },
  { id: "bebidas", nome: "Bebidas" },
  { id: "sucos", nome: "Sucos" },
  { id: "doces", nome: "Doces" }
];

export const RESTAURANTE = {
  nome: "Casa do Churrasco",
  slogan: "O melhor sabor da cidade",
  cor: "#660e0e",
  telefone: "(19) 98228-9132",
  whatsapp: "5519982259132", // Apenas números
  instagram: "@casadochurrascoo",
  horario: "Seg-Sex: 11h às 15h, Sáb-Dom: 11h às 16h"
};