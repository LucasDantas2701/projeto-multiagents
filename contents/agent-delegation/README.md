# projeto-multagents

> **Projeto de estudo.** Este repositório existe para **entender melhor como funcionam sistemas multiagentes (multi-agent systems) com LLMs e exercitar na prática** o que foi visto em aula. Não é um produto pronto: o foco é aprender, testar ideias e observar como agentes diferentes colaboram (e erram) entre si.

## O que é

Um conjunto de experimentos em Python/Jupyter usando **LangChain** + **LangGraph** com modelos rodando no **Ollama**. Cada agente é criado com `create_agent`, recebe seu próprio *system prompt* (seu "papel") e, quando faz sentido, ferramentas (`@tool`) que executam lógica determinística em Python. O código Python orquestra a ordem das etapas e passa a saída de um agente como entrada para o próximo.

A ideia central que estou exercitando:

- **Separar responsabilidades** entre agentes com papéis distintos;
- **Ferramentas para o que precisa ser exato** (contas, formatação, validação), deixando o LLM com o texto;
- **Encadear e revisar**: um agente produz, outro confere, outro decide;
- **Conferir o resultado em Python**, sem confiar cegamente no que o modelo diz.

## Conteúdo

| Arquivo | Descrição |
| --- | --- |
| `exemplo.ipynb` | Notebook da aula (Módulo 4, Aula 1): o pedido fictício **P001** passa por três agentes — **Ana** (estoque, usa a ferramenta `multiplicar`), **Bruno** (logística) e **Carla** (revisora). No fim, o resultado da ferramenta é conferido com `assert`. |
| `article_maker.ipynb` | Meu exercício próprio: um pipeline de **geração de artigo acadêmico em ABNT** com três agentes em loop — veja abaixo. |
| `main.py` | Célula de preparação do ambiente: confere se as versões fixadas das bibliotecas estão instaladas (e instala automaticamente quando roda no Colab). |
| `docs/` | Material de apoio da aula (PDF). |

### `article_maker.ipynb` — escritor, checador e revisor

Fluxo em loop (até 5 rodadas) até o artigo ser aprovado:

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

## Como rodar

### Requisitos

- Python 3.10+
- [Ollama](https://ollama.com/) rodando localmente (`http://localhost:11434`) com um modelo baixado (ex.: `qwen3.5:9b`), **ou** acesso ao Ollama na nuvem com chave de API (o `exemplo.ipynb` foi feito para o Google Colab e lê a chave do segredo `segredo`).

Versões fixadas usadas no projeto:

```
langchain==1.4.7
langchain-core==1.7.1
pydantic==2.13.5
langchain-ollama==1.1.0
langgraph==1.2.18
ollama==0.6.3
```

### Passo a passo (local)

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

pip install langchain==1.4.7 langchain-core==1.7.1 pydantic==2.13.5 langchain-ollama==1.1.0 langgraph==1.2.18 ollama==0.6.3 jupyter

ollama pull qwen3.5:9b
jupyter notebook
```

Depois é só abrir `article_maker.ipynb` e executar as células em ordem. A última célula pede o tema do artigo.

## Observações

- Todos os dados (pedidos, estoque, propostas) são **fictícios**; nada é executado de verdade.
- As respostas dos LLMs variam a cada execução — faz parte do exercício observar quando os agentes acertam, quando erram e como a revisão (ou a conferência em Python) pega esses erros.
- Material de referência:
  - [Agentes com `create_agent` — LangChain](https://docs.langchain.com/oss/python/langchain/agents)
  - [ChatOllama — LangChain](https://docs.langchain.com/oss/python/integrations/chat/ollama)
  - [API na nuvem — Ollama](https://docs.ollama.com/cloud)
