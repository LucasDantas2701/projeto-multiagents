# Leilão ao Vivo

Front em Angular que mostra o leilão do `auction.ipynb` acontecendo: os avaliadores sugerindo o preço inicial,
o filtro do protocolo, os compradores levantando a plaquinha a cada lance e o leiloeiro batendo o martelo.

```
auction_live/
├── backend/    FastAPI: roda o leilão (mesmos agentes e regras do notebook) e envia cada passo via SSE
└── frontend/   Angular: palco animado que consome os eventos
```

## Como rodar

Use dois terminais, a partir da raiz do projeto (`projeto-multagents`).

**1. Backend** (porta 8000)

```powershell
.\venv\Scripts\python.exe -m pip install fastapi==0.115.6 uvicorn==0.34.0   # só na primeira vez
cd "contents\negociation_&_concession\auction_live\backend"
..\..\..\..\venv\Scripts\python.exe -m uvicorn server:app --port 8000
```

**2. Frontend** (porta 4200)

```powershell
cd "contents\negociation_&_concession\auction_live\frontend"
npm install   # só na primeira vez
node node_modules/@angular/cli/bin/ng.js serve
```

Abra http://localhost:4200.

> **Por que não `npm start` / `ng serve`?** A pasta `negociation_&_concession` tem um `&` no nome.
> No Windows, os atalhos do npm passam pelo `cmd`, que entende o `&` como separador de comandos e quebra o caminho.
> Chamar o CLI direto pelo `node` contorna isso. Renomear a pasta (ex.: `negociation_and_concession`) também resolve.

## Modos

- **Simulado (sem Ollama):** respostas determinísticas no mesmo formato do LLM, com pausas. Bom para apresentar ou testar o visual.
- **Ao vivo:** desmarque "Simulado". Usa o Ollama em `localhost:11434` com o modelo `qwen3.5:9b`. Cada leilão leva de 1 a 3 minutos.

## Controles

| Controle | O que muda |
|---|---|
| Produto | Qual dos 4 itens vai a leilão (a categoria define quais avaliadores são especialistas) |
| Pagamento | `Paga o próprio lance` ou `Paga o 2º maior lance`: a alocação é a mesma, o pagamento muda |
| Limite de chegada | Com 3, o Barone Leilões passa no filtro de chegada |
| Orçamento ×N | Escala os orçamentos secretos dos compradores (×0.5 costuma dar "Sem venda") |

## Eventos (backend → front)

`inicio`, `fase`, `pensando`, `fala`, `avaliacao`, `filtro`, `preco_inicial`, `rodada`, `lance`, `saida`, `resultado`, `fim`, `erro`.
Os tipos estão em `frontend/src/app/leilao.models.ts` e são gerados em `backend/leilao.py`.

> As regras e os prompts de `backend/leilao.py` são uma cópia dos do `auction.ipynb`. Se mudar um, atualize o outro.
