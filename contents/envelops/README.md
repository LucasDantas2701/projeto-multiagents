# envelops

> **Projeto de estudo.** Continuação do pipeline de artigo acadêmico de `../agent-delegation/article_maker.ipynb`, agora exercitando **comunicação controlada entre agentes**: toda mensagem vira um *envelope* e só é entregue se o remetente tiver permissão para falar com o destinatário.

## O que é

Os mesmos três agentes do `article_maker` (**Escritor**, **Checador de Fontes** e **Revisor**), criados com `create_agent` sobre modelos no **Ollama**, com dois jeitos de orquestrar:

1. **Loop em Python** — a ordem das etapas é fixa no código (igual ao `article_maker`, mas com no máximo 4 rodadas e envio forçado na última).
2. **Supervisor + envelopes** — um agente **Supervisor** (editor-chefe) decide quando chamar cada agente, e toda chamada passa por um envelope com checagem de permissão.

A ideia central que estou exercitando:

- **Mensagem como dado estruturado**: `remetente`, `destinatario` e `conteudo`, em vez de um agente chamar o outro diretamente;
- **Permissões explícitas**: uma tabela diz quem pode falar com quem, e o envio é bloqueado antes de chegar ao LLM;
- **Rastreabilidade**: todo envelope (autorizado ou negado) fica registrado em `historico_envelopes`.

## Conteúdo

| Arquivo | Descrição |
| --- | --- |
| `envelops.ipynb` | Notebook com os agentes do artigo, o loop em Python e a versão com Supervisor e envelopes. |

### Células do notebook

| Célula | O que faz |
| --- | --- |
| 1 | Instala as versões fixadas das bibliotecas. |
| 2 | Configura os modelos: `modelo` (Escritor, temperatura 0.5) e `modelo_juiz` (Checador, Revisor e Supervisor, temperatura 0.1). |
| 3 | Ferramentas ABNT (`Citation_Formatter`, `Reference_Generator`) e validação estrutural em Python puro (`normalizar_titulos`, `validar_estrutura`). |
| 4 | Cria os agentes `writer`, `sources_checker` e `revisor`. |
| 5 | Define `chamar` e `veredicto` e roda o **loop em Python** (até 4 rodadas; na última, o artigo é enviado mesmo que reprovado). |
| 6 | **Supervisor + envelopes** — veja abaixo. |

### Supervisor e envelopes

```
                         ┌────────────┐
           tema ───────▶ │ Supervisor │
                         └─────┬──────┘
          envelope             │ envelope              envelope
     ┌─────────────────────────┼───────────────────────────┐
     ▼                         ▼                           ▼
┌──────────┐            ┌──────────────────┐          ┌─────────┐
│ Escritor │            │ Checador Fontes  │          │ Revisor │
└──────────┘            └──────────────────┘          └─────────┘
     ✗ Escritor → Revisor (sem permissão: envelope NEGADO)
```

- **`criar_envelope(remetente, destinatario, conteudo)`** — monta o envelope.
- **`permissoes`** — só o `supervisor` pode enviar para `escritor`, `checador` e `revisor`; os três não falam entre si.
- **`enviar(remetente, destinatario, conteudo)`** — confere a permissão, registra em `historico_envelopes` e só então invoca o agente destinatário.
- **Ferramentas do Supervisor** — `enviar_para_escritor(ajustes)`, `enviar_para_checador()` e `enviar_para_revisor()`. O rascunho fica guardado em `estado`, então o modelo não precisa copiar o artigo inteiro nos argumentos. A saída do Escritor continua passando por `normalizar_titulos` e `validar_estrutura`.
- **Teste de permissão** — antes do fluxo, o Escritor tenta mandar um envelope direto ao Revisor e recebe `Erro: ... não tem autorização`.

No final, a célula mostra o artigo, o tempo total e a lista de envelopes trocados (`ok` ou `NEGADO`).

## Como rodar

Mesmos requisitos do `agent-delegation`: Python 3.10+, [Ollama](https://ollama.com/) rodando em `http://localhost:11434` com o modelo `qwen3.5:9b` baixado e as versões fixadas abaixo.

```
langchain==1.4.7
langchain-core==1.7.1
pydantic==2.13.5
langchain-ollama==1.1.0
langgraph==1.2.18
ollama==0.6.3
```

Abra `envelops.ipynb` e execute as células em ordem. As células 5 e 6 pedem o tema do artigo. A célula 6 usa a função `chamar`, definida na 5, então rode a 5 antes, mesmo que só queira testar os envelopes.

## Observações

- As respostas dos LLMs variam a cada execução. Com um modelo pequeno, o Supervisor pode pular etapas ou repetir ferramentas — o `recursion_limit=30` impede que ele fique em loop.
- A permissão é checada em Python, antes de qualquer chamada ao LLM: um envelope negado não gasta tempo de modelo.
- Material de referência:
  - [Agentes com `create_agent` — LangChain](https://docs.langchain.com/oss/python/langchain/agents)
  - [ChatOllama — LangChain](https://docs.langchain.com/oss/python/integrations/chat/ollama)
