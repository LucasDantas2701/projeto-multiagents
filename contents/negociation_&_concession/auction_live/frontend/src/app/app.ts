import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LeilaoService, brl } from './leilao.service';
import { Avaliador, Comprador, Fase, Opcoes } from './leilao.models';
import { EstadoPessoa, Pessoa } from './pessoa';

// Elenco mostrado antes do primeiro leilão (mesmos nomes do backend)
const ELENCO_AVALIADORES: Avaliador[] = [
  { nome: 'Avaliador_Senior', especialidades: ['antiguidades', 'joias'], estrategia: 'conservadora', chegada: 1, estado: 'aguardando' },
  { nome: 'Agente_Preco_Justo', especialidades: ['eletrônicos', 'retro'], estrategia: 'equilibrada', chegada: 1, estado: 'aguardando' },
  { nome: 'Avaliador_Expert', especialidades: ['antiguidades', 'joias'], estrategia: 'agressiva', chegada: 2, estado: 'aguardando' },
  { nome: 'Barone_Leiloes', especialidades: ['antiguidades', 'retro'], estrategia: 'equilibrada', chegada: 3, estado: 'aguardando' },
];
const ELENCO_COMPRADORES: Comprador[] = [
  { nome: 'Colecionador_Rui', estilo: 'paciente', estado: 'aguardando' },
  { nome: 'Revendedor_Lia', estilo: 'racional', estado: 'aguardando' },
  { nome: 'Entusiasta_Davi', estilo: 'impulsivo', estado: 'aguardando' },
];

@Component({
  selector: 'app-root',
  imports: [FormsModule, Pessoa],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly s = inject(LeilaoService);
  protected readonly brl = brl;

  // Opções do formulário
  protected produtoId = 'product01';
  protected regra: Opcoes['regra'] = 'lance_vencedor';
  protected escala = 1;
  protected limiteChegada = 2;
  protected simulado = true;

  protected readonly overlayFechado = signal(false);

  protected readonly etapas: { fase: Fase; titulo: string; icone: string }[] = [
    { fase: 'anuncio', titulo: 'Anúncio', icone: '📣' },
    { fase: 'avaliacao', titulo: 'Avaliação', icone: '🧐' },
    { fase: 'filtro', titulo: 'Filtro', icone: '🔎' },
    { fase: 'lances', titulo: 'Lances', icone: '🪧' },
    { fase: 'encerramento', titulo: 'Encerramento', icone: '🔨' },
  ];

  protected readonly avaliadores = computed(() => (this.s.avaliadores().length ? this.s.avaliadores() : ELENCO_AVALIADORES));
  protected readonly compradores = computed(() => (this.s.compradores().length ? this.s.compradores() : ELENCO_COMPRADORES));
  /** Produto do leilão em andamento ou, antes de começar, o escolhido no formulário. */
  protected produtoSelecionado() {
    return this.s.produto() ?? this.s.produtos().find((p) => p.id === this.produtoId) ?? null;
  }

  protected readonly maiorLance = computed(() => Math.max(1, ...this.s.lances().map((l) => l.valor)));
  protected readonly lancesRecentes = computed(() => [...this.s.lances()].reverse().slice(0, 8));

  protected readonly mostrarOverlay = computed(
    () => this.s.encerrado() && !this.overlayFechado() && (this.s.resultado() !== null || this.s.motivoFinal() !== null),
  );

  protected readonly confete = Array.from({ length: 60 }, (_, i) => ({
    esquerda: Math.random() * 100,
    atraso: Math.random() * 1.2,
    duracao: 2.2 + Math.random() * 1.8,
    cor: ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#f78c6b'][i % 5],
    giro: Math.random() * 360,
  }));

  constructor() {
    this.s.carregarProdutos();
  }

  protected iniciar() {
    this.overlayFechado.set(false);
    this.s.iniciar({
      produtoId: this.produtoId,
      regra: this.regra,
      escala: this.escala,
      limiteChegada: this.limiteChegada,
      simulado: this.simulado,
    });
  }

  protected indiceEtapa(fase: Fase) {
    return this.etapas.findIndex((e) => e.fase === fase);
  }

  protected statusEtapa(fase: Fase): 'feita' | 'ativa' | 'futura' {
    const atual = this.indiceEtapa(this.s.fase());
    const esta = this.indiceEtapa(fase);
    if (this.s.encerrado() || esta < atual) return 'feita';
    return esta === atual ? 'ativa' : 'futura';
  }

  protected nomeCurto(nome: string) {
    return nome.replace(/_/g, ' ');
  }

  protected estadoLeiloeiro(): EstadoPessoa {
    if (this.s.encerrado() && this.s.resultado()) return 'martelando';
    if (this.s.leiloeiroPensando()) return 'pensando';
    if (this.s.falante() === 'Leiloeiro') return 'falando';
    return 'parado';
  }

  protected estadoAvaliador(a: Avaliador): EstadoPessoa {
    if (a.estado === 'pensando') return 'pensando';
    if (this.s.falante() === a.nome) return 'falando';
    if (a.valido === false) return 'perdeu';
    if (a.escolhido) return 'vencedor';
    return 'parado';
  }

  protected estadoComprador(c: Comprador): EstadoPessoa {
    switch (c.estado) {
      case 'pensando': return 'pensando';
      case 'lance': return 'lance';
      case 'fora': return 'fora';
      case 'vencedor': return 'vencedor';
      case 'perdeu': return 'perdeu';
      default: return this.s.falante() === c.nome ? 'falando' : 'parado';
    }
  }

  protected regraTexto(regra: string) {
    return regra === 'segundo_maior_lance' ? 'paga o 2º maior lance' : 'paga o próprio lance';
  }
}
