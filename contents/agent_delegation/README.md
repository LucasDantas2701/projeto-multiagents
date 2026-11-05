# agent-delegation

> **Projeto de estudo.** Primeiros experimentos de delegação entre agentes: cada agente tem um papel, a saída de um vira a entrada do próximo e o código Python orquestra a ordem das etapas.

## Conteúdo

| Arquivo | Descrição |
| --- | --- |
| `exemplo.ipynb` | Notebook da aula (Módulo 4, Aula 1): o pedido fictício **P001** passa por três agentes — **Ana** (estoque, usa a ferramenta `multiplicar`), **Bruno** (logística) e **Carla** (revisora). No fim, o resultado da ferramenta é conferido com `assert`. |
| `article_maker.ipynb` | Meu exercício próprio: um pipeline de **geração de artigo acadêmico em ABNT** com três agentes em loop — veja abaixo. |

### `article_maker.ipynb` — escritor, checador e revisor

Fluxo em loop (até 6 rodadas) até o artigo ser aprovado:

```
tema do usuário
      │
      ▼
┌───────────┐   rascunho   ┌──────────────────┐   rascunho + parecer   ┌──────────┐
│ Escritor  │ ───────────▶ │ Checador Fontes  │ ─────────────────────▶ │ Revisor  │
└───────────┘              └──────────────────┘                        └──────────┘
      ▲                                                                      │
      └──────────────────── feedback (se REPROVADO) ─────────────────────────┘
```

- **Escritor** — monta o texto (Introdução, Desenvolvimento, Conclusão e Referências) usando as ferramentas `Citation_Formatter` e `Reference_Generator` (padrão ABNT / NBR 6023).
- **Validação estrutural (Python puro)** — `validar_estrutura` confere as seções e as citações ABNT antes de chamar os outros agentes. Se falhar, o feedback volta direto para o Escritor, sem gastar chamadas ao LLM.
- **Checador de Fontes** — avalia se as citações fazem sentido no contexto (uma única chamada, sem ferramentas).
- **Revisor** — emite o veredicto na primeira linha (`APROVADO`/`REPROVADO`) e, se reprovar, lista os ajustes. O Escritor recebe o rascunho anterior junto com o feedback, para ajustar em vez de reescrever do zero.

O loop mostra o tempo de cada etapa e o tempo total, o que ajuda a ver onde está a demora.

A continuação deste pipeline, com um Supervisor delegando por envelopes e permissões, está em [`../envelops/`](../envelops/README.md).

## Como rodar

Requisitos e instalação estão no [README da raiz](../../README.md). Com o ambiente pronto, abra o notebook desejado e execute as células em ordem:

- `exemplo.ipynb` foi feito para o **Google Colab** e usa o Ollama na nuvem, lendo a chave de API do segredo `segredo`.
- `article_maker.ipynb` usa o Ollama local (`qwen3.5:9b`). A última célula pede o tema do artigo.

## Observações

- Todos os dados (pedidos, estoque, propostas) são **fictícios**; nada é executado de verdade.
- O material de apoio da aula está em [`docs/`](../../docs/), na raiz do projeto.
