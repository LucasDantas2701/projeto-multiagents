export type Fase = 'espera' | 'anuncio' | 'avaliacao' | 'filtro' | 'lances' | 'encerramento';

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  custo_aquisicao: number;
  idade: number;
  relevancia: string;
  icone: string;
}

export interface Anuncio {
  produto_id: string;
  requisito_categoria: string;
  limite_chegada: number;
  preco_reserva: number;
}

export type EstadoAvaliador = 'aguardando' | 'pensando' | 'falou';

export interface Avaliador {
  nome: string;
  especialidades: string[];
  estrategia: string;
  chegada: number;
  estado: EstadoAvaliador;
  decisao?: string;
  preco?: number | null;
  justificativa?: string;
  valido?: boolean;
  motivo?: string;
  escolhido?: boolean;
}

export type EstadoComprador = 'aguardando' | 'pensando' | 'lance' | 'fora' | 'vencedor' | 'perdeu';

export interface Comprador {
  nome: string;
  estilo: string;
  estado: EstadoComprador;
  ultimoLance?: number;
  fala?: string;
  motivo?: string;
  orcamento?: number;
}

export interface Resultado {
  vencedor: string;
  lance_vencedor: number;
  regra_pagamento: string;
  pagamento: number;
  preco_inicial: number;
  orcamentos: Record<string, number>;
}

export interface EntradaLog {
  icone: string;
  texto: string;
  destaque?: 'ok' | 'erro' | 'lance' | 'fala';
}

export interface Lance {
  nome: string;
  valor: number;
  rodada: number;
}

export interface Opcoes {
  produtoId: string;
  limiteChegada: number;
  escala: number;
  regra: 'lance_vencedor' | 'segundo_maior_lance';
  simulado: boolean;
}

// Eventos enviados pelo backend (backend/leilao.py)
export type Evento =
  | { tipo: 'inicio'; produto: Produto; anuncio: Anuncio; regra_pagamento: string; incremento: number;
      avaliadores: Omit<Avaliador, 'estado'>[]; compradores: { nome: string; estilo: string }[]; simulado: boolean }
  | { tipo: 'fase'; fase: Fase }
  | { tipo: 'pensando'; quem: string }
  | { tipo: 'fala'; quem: string; texto: string }
  | { tipo: 'avaliacao'; nome: string; decisao: string; preco: number | null; justificativa: string }
  | { tipo: 'filtro'; motivos: Record<string, { valido: boolean; texto: string }> }
  | { tipo: 'preco_inicial'; valor: number | null; avaliador: string | null }
  | { tipo: 'rodada'; numero: number }
  | { tipo: 'lance'; nome: string; valor: number; rodada: number; motivo: string }
  | { tipo: 'saida'; nome: string; motivo: string; rodada: number }
  | { tipo: 'resultado'; resultado: Resultado | null; motivo: string | null }
  | { tipo: 'fim' }
  | { tipo: 'erro'; mensagem: string };
