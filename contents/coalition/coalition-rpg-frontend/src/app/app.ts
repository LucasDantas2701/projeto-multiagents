import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type Personagem = {
  classe: string;
  habilidades: string[];
};

type Missao = {
  id: string;
  requisitos: string[];
};

type PlanoItem = {
  missao: string;
  equipe: string[];
  estado: string;
  depende?: string[];
};

const personagens: Record<string, Personagem> = {
  Aria: { classe: 'Guerreira', habilidades: ['força', 'resistência'] },
  Bruno: { classe: 'Curandeiro', habilidades: ['cura', 'suporte'] },
  Cleo: { classe: 'Ladina', habilidades: ['agilidade', 'furtividade'] },
  Dara: { classe: 'Maga', habilidades: ['magia', 'inteligencia'] },
  Eros: { classe: 'Tank', habilidades: ['resistência', 'força'] },
};

const missoes: Missao[] = [
  { id: 'M1', requisitos: ['força'] },
  { id: 'M2', requisitos: ['cura'] },
  { id: 'M3', requisitos: ['agilidade'] },
];

const entrada = {
  compromisso_m1: { missao: 'M1', responsavel: 'Aria', estado: 'alocada' },
  ativos: ['Aria', 'Bruno', 'Cleo', 'Dara', 'Eros'],
  disponiveis_para_final: ['Aria', 'Bruno', 'Cleo', 'Dara'],
};

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly personagens = personagens;
  protected readonly missoes = missoes;
  protected readonly entrada = entrada;
  protected readonly resultado = this.alocar(entrada);
  protected readonly resultadoFinal = this.concluirMissaoFinal(this.resultado);

  protected readonly personagensOrdenados = Object.entries(personagens).sort(([a], [b]) => a.localeCompare(b));

  protected formarCoalizao(participantes: string[], requisitos: Set<string>): string[] {
    const nomes = [...participantes].sort();

    for (let i = 0; i < nomes.length; i++) {
      for (let j = i + 1; j < nomes.length; j++) {
        const [p1, p2] = [nomes[i], nomes[j]];
        const cobertura = new Set([
          ...personagens[p1].habilidades,
          ...personagens[p2].habilidades,
        ]);

        if ([...requisitos].every((habilidade) => cobertura.has(habilidade))) {
          return [p1, p2];
        }
      }
    }

    return [];
  }

  protected alocar(entradaAtual: typeof entrada) {
    const carga: Record<string, number> = {};
    for (const nome of entradaAtual.ativos) {
      carga[nome] = 0;
    }

    const plano: PlanoItem[] = [];
    const compromisso = entradaAtual.compromisso_m1;
    const preferida = compromisso?.estado === 'alocada' ? compromisso.responsavel : null;

    for (const missao of missoes) {
      const aptos = Object.keys(carga).filter((nome) =>
        missao.requisitos.every((habilidade) => personagens[nome].habilidades.includes(habilidade)),
      );

      let escolhida: string | null = null;

      if (missao.id === 'M1') {
        if (preferida && aptos.includes(preferida)) {
          escolhida = preferida;
        }
      } else {
        escolhida = aptos.reduce<string | null>((melhor, nome) => {
          if (!melhor || carga[nome] < carga[melhor]) {
            return nome;
          }
          return melhor;
        }, null);
      }

      let estado = 'sem_capacidade';
      if (missao.id === 'M1') {
        estado = 'sem_acordo';
      }

      const equipe: string[] = [];
      if (escolhida) {
        equipe.push(escolhida);
        carga[escolhida] += 1;
        estado = 'alocada';
      }

      plano.push({ missao: missao.id, equipe, estado });
    }

    return { ...entradaAtual, plano };
  }

  protected concluirMissaoFinal(dados: ReturnType<App['alocar']>) {
    const plano = dados.plano.map((item) => ({ ...item }));
    const m1Ok = plano[0]?.equipe.length > 0;
    const livres = dados.disponiveis_para_final.filter((nome) => dados.ativos.includes(nome));

    let dupla: string[] = [];
    let estado = 'dependencia_pendente';

    if (m1Ok) {
      dupla = this.formarCoalizao(livres, new Set(['força', 'cura']));
      estado = dupla.length ? 'alocada' : 'sem_capacidade';
    }

    plano.push({ missao: 'M4', equipe: dupla, estado, depende: ['M1'] });

    return { ...dados, plano };
  }

  protected estadoTexto(estado: string): string {
    const mapa: Record<string, string> = {
      alocada: 'Alocada',
      sem_acordo: 'Sem acordo',
      sem_capacidade: 'Sem capacidade',
      dependencia_pendente: 'Dependência pendente',
    };

    return mapa[estado] ?? estado;
  }
}
