import { Injectable, computed, signal } from '@angular/core';
import {
  Anuncio, Avaliador, Comprador, EntradaLog, Evento, Fase, Lance, Opcoes, Produto, Resultado,
} from './leilao.models';

export const API = 'http://localhost:8000/api';

export const brl = (v: number | null | undefined) =>
  v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const nomeCurto = (nome: string) => nome.replace(/_/g, ' ');

@Injectable({ providedIn: 'root' })
export class LeilaoService {
  private fonte?: EventSource;

  // Estado da cena
  readonly produtos = signal<Produto[]>([]);
  readonly executando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly fase = signal<Fase>('espera');
  readonly produto = signal<Produto | null>(null);
  readonly anuncio = signal<Anuncio | null>(null);
  readonly regra = signal('lance_vencedor');
  readonly incremento = signal(50);
  readonly simulado = signal(false);

  readonly avaliadores = signal<Avaliador[]>([]);
  readonly compradores = signal<Comprador[]>([]);
  readonly leiloeiroFala = signal<string | null>(null);
  readonly leiloeiroPensando = signal(false);

  readonly precoInicial = signal<number | null>(null);
  readonly lances = signal<Lance[]>([]);
  readonly rodada = signal(0);
  readonly resultado = signal<Resultado | null>(null);
  readonly motivoFinal = signal<string | null>(null);
  readonly encerrado = signal(false);
  readonly log = signal<EntradaLog[]>([]);

  /** Quem acabou de falar: anima a boca por alguns segundos. */
  readonly falante = signal<string | null>(null);
  private timerFala?: ReturnType<typeof setTimeout>;

  readonly lanceAtual = computed(() => this.lances().at(-1) ?? null);

  private falar(quem: string) {
    this.falante.set(quem);
    clearTimeout(this.timerFala);
    this.timerFala = setTimeout(() => this.falante.set(null), 2600);
  }

  async carregarProdutos() {
    try {
      const resp = await fetch(`${API}/produtos`);
      this.produtos.set(await resp.json());
      this.erro.set(null);
    } catch {
      this.erro.set('Backend offline. Rode: python -m uvicorn server:app --port 8000 (na pasta backend).');
    }
  }

  iniciar(op: Opcoes) {
    this.parar();
    this.resetar();
    this.executando.set(true);
    const qs = new URLSearchParams({
      limite_chegada: String(op.limiteChegada),
      escala: String(op.escala),
      regra: op.regra,
      simulado: String(op.simulado),
    });
    this.fonte = new EventSource(`${API}/leilao/${op.produtoId}?${qs}`);
    this.fonte.onmessage = (msg) => this.aplicar(JSON.parse(msg.data) as Evento);
    this.fonte.onerror = () => {
      if (!this.encerrado()) {
        this.erro.set('Conexão com o backend perdida. Ele está rodando na porta 8000?');
      }
      this.parar();
    };
  }

  parar() {
    this.fonte?.close();
    this.fonte = undefined;
    this.executando.set(false);
  }

  private resetar() {
    this.erro.set(null);
    this.fase.set('espera');
    this.avaliadores.set([]);
    this.compradores.set([]);
    this.leiloeiroFala.set(null);
    this.leiloeiroPensando.set(false);
    this.precoInicial.set(null);
    this.lances.set([]);
    this.rodada.set(0);
    this.resultado.set(null);
    this.motivoFinal.set(null);
    this.encerrado.set(false);
    this.log.set([]);
  }

  private registrar(icone: string, texto: string, destaque?: EntradaLog['destaque']) {
    this.log.update((l) => [{ icone, texto, destaque }, ...l].slice(0, 80));
  }

  private atualizarAvaliador(nome: string, mudanca: Partial<Avaliador>) {
    this.avaliadores.update((lista) => lista.map((a) => (a.nome === nome ? { ...a, ...mudanca } : a)));
  }

  private atualizarComprador(nome: string, mudanca: Partial<Comprador>) {
    this.compradores.update((lista) => lista.map((c) => (c.nome === nome ? { ...c, ...mudanca } : c)));
  }

  /** Ninguém fica "pensando" depois que chega um novo evento. */
  private limparPensando() {
    this.leiloeiroPensando.set(false);
    this.avaliadores.update((l) => l.map((a) => (a.estado === 'pensando' ? { ...a, estado: 'aguardando' } : a)));
    this.compradores.update((l) => l.map((c) => (c.estado === 'pensando' ? { ...c, estado: c.ultimoLance ? 'lance' : 'aguardando' } : c)));
  }

  private aplicar(ev: Evento) {
    if (ev.tipo !== 'fase' && ev.tipo !== 'rodada') this.limparPensando();

    switch (ev.tipo) {
      case 'inicio':
        this.produto.set(ev.produto);
        this.anuncio.set(ev.anuncio);
        this.regra.set(ev.regra_pagamento);
        this.incremento.set(ev.incremento);
        this.simulado.set(ev.simulado);
        this.avaliadores.set(ev.avaliadores.map((a) => ({ ...a, estado: 'aguardando' })));
        this.compradores.set(ev.compradores.map((c) => ({ ...c, estado: 'aguardando' })));
        this.registrar(ev.produto.icone, `Leilão aberto: ${ev.produto.nome}`);
        break;

      case 'fase':
        this.fase.set(ev.fase);
        break;

      case 'pensando':
        if (ev.quem === 'Leiloeiro') this.leiloeiroPensando.set(true);
        else if (this.avaliadores().some((a) => a.nome === ev.quem)) this.atualizarAvaliador(ev.quem, { estado: 'pensando' });
        else this.atualizarComprador(ev.quem, { estado: 'pensando' });
        break;

      case 'fala':
        this.leiloeiroFala.set(ev.texto);
        this.falar(ev.quem);
        this.registrar('🎙️', ev.texto, 'fala');
        break;

      case 'avaliacao':
        this.atualizarAvaliador(ev.nome, {
          estado: 'falou', decisao: ev.decisao, preco: ev.preco, justificativa: ev.justificativa,
        });
        this.falar(ev.nome);
        this.registrar(
          ev.decisao === 'PROPOR' ? '💬' : '🙅',
          ev.decisao === 'PROPOR' ? `${nomeCurto(ev.nome)} sugere ${brl(ev.preco)}` : `${nomeCurto(ev.nome)} recusou avaliar`,
        );
        break;

      case 'filtro':
        for (const [nome, m] of Object.entries(ev.motivos)) {
          this.atualizarAvaliador(nome, { valido: m.valido, motivo: m.texto });
          this.registrar(m.valido ? '✅' : '❌', `${nomeCurto(nome)}: ${m.texto}`, m.valido ? 'ok' : 'erro');
        }
        break;

      case 'preco_inicial':
        this.precoInicial.set(ev.valor);
        if (ev.avaliador) {
          this.atualizarAvaliador(ev.avaliador, { escolhido: true });
          this.registrar('⭐', `Preço inicial: ${brl(ev.valor)} (de ${nomeCurto(ev.avaliador)})`, 'ok');
        }
        break;

      case 'rodada':
        this.rodada.set(ev.numero);
        this.registrar('🔔', `Rodada ${ev.numero} de lances`);
        break;

      case 'lance':
        this.lances.update((l) => [...l, { nome: ev.nome, valor: ev.valor, rodada: ev.rodada }]);
        this.compradores.update((lista) => lista.map((c) =>
          c.nome === ev.nome
            ? { ...c, estado: 'lance', ultimoLance: ev.valor, fala: ev.motivo }
            : c.estado === 'lance' ? { ...c, estado: 'aguardando' } : c));
        this.falar(ev.nome);
        this.registrar('🪧', `${nomeCurto(ev.nome)} dá ${brl(ev.valor)}`, 'lance');
        break;

      case 'saida':
        this.atualizarComprador(ev.nome, { estado: 'fora', motivo: ev.motivo });
        this.registrar('🚪', `${nomeCurto(ev.nome)} saiu: ${ev.motivo}`, 'erro');
        break;

      case 'resultado':
        this.resultado.set(ev.resultado);
        this.motivoFinal.set(ev.motivo);
        if (ev.resultado) {
          const r = ev.resultado;
          this.compradores.update((lista) => lista.map((c) => ({
            ...c,
            orcamento: r.orcamentos[c.nome],
            estado: c.nome === r.vencedor ? 'vencedor' : c.estado === 'fora' ? 'fora' : 'perdeu',
          })));
          this.registrar('🔨', `Vendido para ${nomeCurto(r.vencedor)}! Paga ${brl(r.pagamento)}`, 'ok');
        } else {
          this.registrar('🚫', `Sem venda: ${ev.motivo}`, 'erro');
        }
        break;

      case 'fim':
        this.encerrado.set(true);
        this.parar();
        break;

      case 'erro':
        this.erro.set(ev.mensagem);
        this.parar();
        break;
    }
  }
}
