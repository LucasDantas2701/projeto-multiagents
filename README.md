# projeto-multagents

Projeto de estudo e experimentação em multiagentes, lógica de alocação e protótipos de sistemas com Python e notebooks Jupyter.

A ideia central é explorar como agentes, regras e dependências podem colaborar para resolver problemas pequenos e bem definidos, sem depender de um sistema completo de produção.

## O que está no repositório

O projeto reúne vários exercícios práticos, com foco em:

- delegação entre agentes
- fluxos de trabalho com papéis definidos
- comunicação entre partes do sistema
- regras de dependência e conferência
- formação de equipes por habilidade/competência
- protótipos de jogos e simulações

## Estrutura atual

```text
projeto-multagents/
├── contents/
│   ├── agent_delegation/
│   │   ├── article_maker.ipynb
│   │   ├── exemplo.ipynb
│   │   └── README.md
│   ├── coalition/
│   │   ├── example.ipynb
│   │   └── rpg.ipynb
│   ├── envelops/
│   │   ├── envelops.ipynb
│   │   └── README.md
│   └── negociacao_&_concessao/
│       └── ...
├── docs/
├── README.md
└── venv/
```

## Exemplos principais

### 1. Delegação de agentes
Na pasta [contents/agent_delegation](contents/agent_delegation), há exemplos de fluxo em que um pedido passa por diferentes papéis e etapas, como produção, conferência e revisão.

### 2. Coalition / alocação por capacidade
O notebook [contents/coalition/example.ipynb](contents/coalition/example.ipynb) mostra a ideia central do projeto: pessoas têm habilidades, tarefas exigem requisitos e o sistema escolhe a melhor equipe ou a melhor dupla para concluir a etapa.

### 3. RPG simplificado
O notebook [contents/coalition/rpg.ipynb](contents/coalition/rpg.ipynb) usa a mesma lógica do exemplo, mas adaptada para personagens, classes e missões de dungeon. O foco é o mecanismo de formação de party por habilidade e dependência entre missões.

## Como usar

1. Abra o notebook desejado em [contents](contents)
2. Execute as células em ordem
3. Ajuste os dados de entrada para testar diferentes cenários
4. Observe como regras e combinações afetam o resultado

## Tecnologias usadas

- Python
- Jupyter Notebooks
- LangChain
- LangGraph
- Ollama

## Observação

Este repositório é um laboratório de estudos. O objetivo não é entregar um produto final, mas praticar a lógica de agentes, regras e coordenação de tarefas em exemplos simples e didáticos.

