import { Component, computed, input } from '@angular/core';

type Cabelo = 'curto' | 'longo' | 'coque' | 'careca' | 'cacheado';
type Roupa = 'camisa' | 'terno';

interface Aparencia {
  pele: string;
  cabelo: Cabelo;
  corCabelo: string;
  roupa: Roupa;
  corRoupa: string;
  oculos?: boolean;
  bigode?: boolean;
  barba?: boolean;
  gravata?: 'gravata' | 'borboleta';
  corGravata?: string;
}

export type EstadoPessoa =
  | 'parado' | 'pensando' | 'falando' | 'lance' | 'fora' | 'vencedor' | 'perdeu' | 'martelando';

const APARENCIAS: Record<string, Aparencia> = {
  Leiloeiro: { pele: '#e8b48a', cabelo: 'careca', corCabelo: '#9a9a9a', roupa: 'terno', corRoupa: '#22223b',
    bigode: true, gravata: 'borboleta', corGravata: '#d62828' },
  Avaliador_Senior: { pele: '#c98e63', cabelo: 'curto', corCabelo: '#e6e6e6', roupa: 'camisa', corRoupa: '#3a6ea5',
    oculos: true, gravata: 'gravata', corGravata: '#1d3557' },
  Agente_Preco_Justo: { pele: '#f1c27d', cabelo: 'longo', corCabelo: '#7b4a2a', roupa: 'camisa', corRoupa: '#2a9d8f' },
  Avaliador_Expert: { pele: '#8d5524', cabelo: 'coque', corCabelo: '#1b1b1b', roupa: 'camisa', corRoupa: '#8e44ad',
    oculos: true },
  Barone_Leiloes: { pele: '#e0ac69', cabelo: 'curto', corCabelo: '#2b2b2b', roupa: 'terno', corRoupa: '#5d4037',
    bigode: true, gravata: 'borboleta', corGravata: '#f4a261' },
  Colecionador_Rui: { pele: '#d4a373', cabelo: 'curto', corCabelo: '#8d8d8d', roupa: 'camisa', corRoupa: '#bc6c25',
    barba: true },
  Revendedor_Lia: { pele: '#f5cba7', cabelo: 'longo', corCabelo: '#c0392b', roupa: 'camisa', corRoupa: '#e76f51' },
  Entusiasta_Davi: { pele: '#6b4226', cabelo: 'cacheado', corCabelo: '#111', roupa: 'camisa', corRoupa: '#2d6a4f' },
};

const PADRAO: Aparencia = { pele: '#e0ac69', cabelo: 'curto', corCabelo: '#333', roupa: 'camisa', corRoupa: '#777' };

@Component({
  selector: 'app-pessoa',
  template: `
    <svg viewBox="0 0 140 160" [class]="'pessoa estado-' + estado()" [attr.aria-label]="nome()">
      <!-- cabelo comprido fica atrás da cabeça -->
      @if (ap().cabelo === 'longo') {
        <path [attr.fill]="ap().corCabelo"
              d="M36 62 C32 24 108 24 104 62 L106 108 L90 108 L92 70 L48 70 L50 108 L34 108 Z" />
      }

      <!-- corpo -->
      <path class="corpo" [attr.fill]="ap().corRoupa"
            d="M22 160 C22 118 44 104 70 104 C96 104 118 118 118 160 Z" />
      @if (ap().roupa === 'terno') {
        <path fill="#fff" d="M58 104 L70 132 L82 104 Z" />
        <path [attr.fill]="ap().corRoupa" opacity=".85" d="M58 104 L66 126 L52 120 Z M82 104 L74 126 L88 120 Z" />
      } @else {
        <path fill="#000" opacity=".12" d="M60 104 L70 116 L80 104 Z" />
      }
      @if (ap().gravata === 'gravata') {
        <path [attr.fill]="ap().corGravata" d="M67 108 L73 108 L75 134 L70 140 L65 134 Z" />
      }
      @if (ap().gravata === 'borboleta') {
        <path [attr.fill]="ap().corGravata" d="M70 110 L58 104 L58 116 Z M70 110 L82 104 L82 116 Z" />
        <circle cx="70" cy="110" r="3" [attr.fill]="ap().corGravata" />
      }

      <!-- pescoço, orelhas e cabeça -->
      <rect x="61" y="88" width="18" height="18" rx="5" [attr.fill]="ap().pele" />
      <rect x="61" y="96" width="18" height="6" fill="#000" opacity=".1" />
      <circle cx="42" cy="62" r="6" [attr.fill]="ap().pele" />
      <circle cx="98" cy="62" r="6" [attr.fill]="ap().pele" />
      <ellipse class="cabeca" cx="70" cy="58" rx="28" ry="31" [attr.fill]="ap().pele" />

      <!-- cabelo -->
      @switch (ap().cabelo) {
        @case ('curto') {
          <path [attr.fill]="ap().corCabelo"
                d="M42 56 C38 26 58 22 70 22 C86 22 104 28 98 56 C94 42 84 38 70 38 C56 38 46 42 42 56 Z" />
        }
        @case ('longo') {
          <path [attr.fill]="ap().corCabelo"
                d="M42 60 C38 24 102 24 98 60 C92 46 82 36 64 38 C56 42 48 48 42 60 Z" />
        }
        @case ('coque') {
          <circle cx="70" cy="22" r="11" [attr.fill]="ap().corCabelo" />
          <path [attr.fill]="ap().corCabelo"
                d="M42 56 C40 28 58 26 70 26 C84 26 102 30 98 56 C92 42 82 36 70 36 C58 36 46 42 42 56 Z" />
        }
        @case ('careca') {
          <path [attr.fill]="ap().corCabelo" d="M42 66 C40 50 44 44 50 44 L48 66 Z M98 66 C100 50 96 44 90 44 L92 66 Z" />
          <ellipse cx="62" cy="34" rx="9" ry="4" fill="#fff" opacity=".35" />
        }
        @case ('cacheado') {
          <g [attr.fill]="ap().corCabelo">
            <circle cx="46" cy="44" r="10" /><circle cx="56" cy="32" r="11" /><circle cx="70" cy="28" r="12" />
            <circle cx="84" cy="32" r="11" /><circle cx="94" cy="44" r="10" /><circle cx="44" cy="56" r="7" />
            <circle cx="96" cy="56" r="7" />
          </g>
        }
      }

      <!-- rosto -->
      <g class="olhos">
        <circle cx="59" cy="60" r="3.4" fill="#222" />
        <circle cx="81" cy="60" r="3.4" fill="#222" />
      </g>
      <path class="sobrancelha" stroke="#000" stroke-opacity=".55" stroke-width="2.4" stroke-linecap="round" fill="none"
            [attr.d]="triste() ? 'M53 52 L63 54 M77 54 L87 52' : 'M53 53 Q59 49 64 52 M76 52 Q81 49 87 53'" />
      <circle cx="51" cy="72" r="4.5" fill="#ff6b6b" opacity=".18" />
      <circle cx="89" cy="72" r="4.5" fill="#ff6b6b" opacity=".18" />
      @if (ap().oculos) {
        <g stroke="#222" stroke-width="2" fill="#fff" fill-opacity=".15">
          <circle cx="59" cy="60" r="8" /><circle cx="81" cy="60" r="8" />
          <path d="M67 60 L73 60" />
        </g>
      }
      @if (ap().barba) {
        <path [attr.fill]="ap().corCabelo" opacity=".9"
              d="M44 66 C46 92 60 90 70 90 C80 90 94 92 96 66 C92 80 84 84 70 84 C56 84 48 80 44 66 Z" />
      }
      @if (falando()) {
        <ellipse class="boca-falando" cx="70" cy="77" rx="6" ry="4" fill="#7a2e2e" />
      } @else {
        <path stroke="#7a2e2e" stroke-width="2.6" stroke-linecap="round" fill="none"
              [attr.d]="triste() ? 'M62 81 Q70 75 78 81' : feliz() ? 'M60 74 Q70 88 80 74' : 'M62 76 Q70 82 78 76'" />
      }
      @if (ap().bigode) {
        <path [attr.fill]="ap().corCabelo === '#9a9a9a' ? '#6d6d6d' : ap().corCabelo"
              d="M58 72 C62 68 68 69 70 71 C72 69 78 68 82 72 C78 74 74 74 70 72 C66 74 62 74 58 72 Z" />
      }

      <!-- plaquinha de lance -->
      @if (placa() !== null) {
        <g class="braco-placa">
          <path [attr.fill]="ap().corRoupa" d="M104 132 L124 92 L132 96 L114 138 Z" />
          <circle cx="128" cy="92" r="6" [attr.fill]="ap().pele" />
          <rect x="125" y="40" width="5" height="54" rx="2" fill="#8d6e63" />
          <circle cx="127.5" cy="36" r="17" fill="#fff" stroke="#d62828" stroke-width="3" />
          <text x="127.5" y="42" text-anchor="middle" font-size="16" font-weight="800" fill="#d62828">{{ placa() }}</text>
        </g>
      }

      <!-- martelo do leiloeiro -->
      @if (martelo()) {
        <g class="martelo">
          <path [attr.fill]="ap().corRoupa" d="M104 134 L120 104 L128 108 L114 140 Z" />
          <circle cx="124" cy="104" r="6" [attr.fill]="ap().pele" />
          <rect x="121" y="66" width="5" height="40" rx="2" fill="#6d4c41" />
          <rect x="110" y="58" width="28" height="13" rx="4" fill="#8d6e63" stroke="#5d4037" stroke-width="2" />
        </g>
      }
    </svg>
  `,
  styles: `
    :host { display: block; }
    .pessoa { width: 100%; height: 100%; overflow: visible; transform-origin: 50% 100%; }
    .olhos { animation: piscar 4.5s infinite; transform-origin: 70px 60px; }
    @keyframes piscar { 0%, 93%, 100% { transform: scaleY(1); } 95% { transform: scaleY(.1); } }
    .boca-falando { animation: falar .28s infinite alternate; transform-origin: 70px 77px; }
    @keyframes falar { from { transform: scaleY(.35); } to { transform: scaleY(1.15); } }

    .estado-pensando { animation: balancar 1.6s ease-in-out infinite; }
    @keyframes balancar { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }

    .braco-placa { transform-origin: 112px 136px; transform: rotate(48deg); transition: transform .35s cubic-bezier(.3, 1.6, .5, 1); }
    .estado-lance .braco-placa, .estado-vencedor .braco-placa { transform: rotate(0deg); }
    .estado-lance { animation: pular .5s ease-out; }
    @keyframes pular { 0% { transform: translateY(0); } 40% { transform: translateY(-10px); } 100% { transform: translateY(0); } }

    .estado-vencedor { animation: comemorar .7s ease-in-out infinite alternate; }
    @keyframes comemorar { from { transform: translateY(0) rotate(-3deg); } to { transform: translateY(-8px) rotate(3deg); } }

    .estado-fora, .estado-perdeu { filter: grayscale(.9) opacity(.55); }
    .estado-fora { transform: translateY(6px); }

    .martelo { transform-origin: 112px 138px; }
    .estado-martelando .martelo { animation: martelar .45s ease-in 3; }
    @keyframes martelar { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-38deg); } }
  `,
})
export class Pessoa {
  readonly nome = input.required<string>();
  readonly estado = input<EstadoPessoa>('parado');
  readonly placa = input<string | number | null>(null);
  readonly martelo = input(false);

  protected readonly ap = computed(() => APARENCIAS[this.nome()] ?? PADRAO);
  protected readonly falando = computed(() => this.estado() === 'falando');
  protected readonly triste = computed(() => this.estado() === 'fora' || this.estado() === 'perdeu');
  protected readonly feliz = computed(() => this.estado() === 'vencedor' || this.estado() === 'lance');
}
