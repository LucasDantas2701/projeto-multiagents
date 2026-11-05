"""Servidor que transmite o leilão ao vivo para o front (Server-Sent Events).

Rodar (a partir desta pasta, com a venv do projeto):
    python -m uvicorn server:app --port 8000
"""
import json

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from leilao import executar_leilao, produtos_leilao

app = FastAPI(title="Leilão ao vivo")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:4200"], allow_methods=["GET"], allow_headers=["*"])


@app.get("/api/produtos")
def listar_produtos():
    return [{"id": pid, **p} for pid, p in produtos_leilao.items()]


@app.get("/api/leilao/{id_produto}")
def leilao(
    id_produto: str,
    limite_chegada: int = Query(2, ge=1, le=5),
    escala: float = Query(1.0, gt=0, le=3),
    regra: str = Query("lance_vencedor", pattern="^(lance_vencedor|segundo_maior_lance)$"),
    simulado: bool = False,
):
    def eventos():
        if id_produto not in produtos_leilao:
            yield f"data: {json.dumps({'tipo': 'erro', 'mensagem': 'Produto não encontrado'})}\n\n"
            return
        try:
            for evento in executar_leilao(id_produto, limite_chegada, escala, regra, simulado):
                yield f"data: {json.dumps(evento, ensure_ascii=False)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'tipo': 'erro', 'mensagem': str(e)}, ensure_ascii=False)}\n\n"

    return StreamingResponse(eventos(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
