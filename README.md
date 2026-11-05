# projeto-multiagents

> **Projeto de estudo.** Este repositório existe para **entender melhor como funcionam sistemas multiagentes (multi-agent systems) com LLMs e exercitar na prática** o que foi visto em aula. Não é um produto pronto: o foco é aprender, testar ideias e observar como agentes diferentes colaboram (e erram) entre si.

## O que é

Um conjunto de experimentos em Python/Jupyter usando **LangChain** + **LangGraph** com modelos rodando no **Ollama**. Cada agente é criado com `create_agent`, recebe seu próprio *system prompt* (seu "papel") e, quando faz sentido, ferramentas (`@tool`) que executam lógica determinística em Python.

A ideia central que estou exercitando:

- **Separar responsabilidades** entre agentes com papéis distintos;
- **Ferramentas para o que precisa ser exato** (contas, formatação, validação), deixando o LLM com o texto;
- **Encadear e revisar**: um agente produz, outro confere, outro decide;
- **Controlar a comunicação** entre agentes (quem pode falar com quem);
- **Conferir o resultado em Python**, sem confiar cegamente no que o modelo diz.

## Estrutura

```
projeto-multiagents/
├── contents/
│   ├── agent-delegation/   # delegação e encadeamento entre agentes
│   └── envelops/           # comunicação via envelopes com permissões
└── docs/                   # material de apoio das aulas (PDFs do Módulo 4)
```

| Pasta | Conteúdo |
| --- | --- |
| [`contents/agent-delegation/`](contents/agent-delegation/README.md) | `exemplo.ipynb` (aula: pedido fictício passando por Ana, Bruno e Carla) e `article_maker.ipynb` (pipeline de artigo acadêmico em ABNT com Escritor, Checador de Fontes e Revisor em loop). |
| [`contents/envelops/`](contents/envelops/README.md) | `envelops.ipynb`: o mesmo pipeline de artigo, agora com um **Supervisor** que delega por **envelopes** (`remetente`, `destinatario`, `conteudo`) checados contra uma tabela de permissões. |
| `docs/` | PDFs das aulas 1, 2 e 3 do Módulo 4. |

Cada pasta em `contents/` tem seu próprio README com os detalhes do fluxo.

## Como rodar

### Requisitos

- Python 3.10+
- [Ollama](https://ollama.com/) rodando localmente (`http://localhost:11434`) com o modelo `qwen3.5:9b` baixado, **ou** acesso ao Ollama na nuvem com chave de API (o `exemplo.ipynb` foi feito para o Google Colab).

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

Depois é só abrir o notebook desejado em `contents/` e executar as células em ordem.

## Observações

- Todos os dados (pedidos, estoque, temas de artigo) são **fictícios**; nada é executado de verdade.
- As respostas dos LLMs variam a cada execução. Faz parte do exercício observar quando os agentes acertam, quando erram e como a revisão (ou a conferência em Python) pega esses erros.
- Material de referência:
  - [Agentes com `create_agent` — LangChain](https://docs.langchain.com/oss/python/langchain/agents)
  - [ChatOllama — LangChain](https://docs.langchain.com/oss/python/integrations/chat/ollama)
  - [API na nuvem — Ollama](https://docs.ollama.com/cloud)
