"""Leilão com agentes, emitindo eventos para o front.

Mesmos dados, prompts e regras do auction.ipynb. A diferença é que cada passo
vira um evento (dict) devolvido por um gerador, que o servidor envia via SSE.

simulado=True troca o LLM por respostas determinísticas, para testar o front sem Ollama.
"""
import random
import re
import time

# ==========================================
# Dados (iguais ao notebook)
# ==========================================
produtos_leilao = {
    "product01": {"nome": "Relógio de Bolso Vintage", "categoria": "antiguidades",
                  "custo_aquisicao": 1500.00, "idade": 85, "relevancia": "alta", "icone": "⌚"},
    "product02": {"nome": "Câmera Analógica 1970", "categoria": "retro",
                  "custo_aquisicao": 450.00, "idade": 56, "relevancia": "média", "icone": "📷"},
    "product03": {"nome": "Moeda de Ouro Império", "categoria": "antiguidades",
                  "custo_aquisicao": 3200.00, "idade": 140, "relevancia": "alta", "icone": "🪙"},
    "product04": {"nome": "Vitrola Portátil Antiga", "categoria": "retro",
                  "custo_aquisicao": 850.00, "idade": 45, "relevancia": "baixa", "icone": "📻"},
}

avaliadores = {
    "Avaliador_Senior":   {"especialidades": ["antiguidades", "joias"], "estrategia": "conservadora", "chegada": 1},
    "Agente_Preco_Justo": {"especialidades": ["eletrônicos", "retro"],  "estrategia": "equilibrada",  "chegada": 1},
    "Avaliador_Expert":   {"especialidades": ["antiguidades", "joias"], "estrategia": "agressiva",    "chegada": 2},
    "Barone_Leiloes":     {"especialidades": ["antiguidades", "retro"], "estrategia": "equilibrada",  "chegada": 3},
}

ESTRATEGIAS = {
    "conservadora": "prefira um preço inicial baixo, próximo do custo, para atrair muitos lances",
    "equilibrada": "busque um meio-termo entre atrair lances e valorizar o item",
    "agressiva": "valorize ao máximo a idade e a relevância do item",
}

compradores = {
    "Colecionador_Rui": {"fatores": {"antiguidades": 1.9, "retro": 1.1},
                         "estilo": "paciente: cobre com o incremento mínimo e só sobe quando é superado"},
    "Revendedor_Lia":   {"fatores": {"antiguidades": 1.4, "retro": 1.4},
                         "estilo": "racional: só cobre se ainda sobrar margem para revender o item"},
    "Entusiasta_Davi":  {"fatores": {"antiguidades": 1.2, "retro": 2.0},
                         "estilo": "impulsivo: costuma dar saltos maiores que o incremento mínimo"},
}

MARGEM_RESERVA = 1.10
INCREMENTO_MINIMO = 50.00
MAX_RODADAS_LANCES = 6


def criar_anuncio(id_produto, limite_chegada=2):
    produto = produtos_leilao[id_produto]
    return {
        "produto_id": id_produto,
        "requisito_categoria": produto["categoria"],
        "limite_chegada": limite_chegada,
        "preco_reserva": round(produto["custo_aquisicao"] * MARGEM_RESERVA, 2),
    }


def orcamento_comprador(nome, id_produto, escala=1.0):
    produto = produtos_leilao[id_produto]
    fator = compradores[nome]["fatores"].get(produto["categoria"], 1.0)
    return round(produto["custo_aquisicao"] * fator * escala, 2)


# ==========================================
# Leitura das respostas
# ==========================================
def ler_preco(texto):
    m = re.search(r"[\d.,]+", texto or "")
    if not m:
        return None
    valor = m.group().strip(".,")
    if "," in valor:
        valor = valor.replace(".", "").replace(",", ".")
    elif valor.count(".") > 1:
        valor = valor.replace(".", "")
    try:
        return float(valor)
    except ValueError:
        return None


def ler_campos(texto):
    campos = {}
    for linha in texto.splitlines():
        if ":" in linha:
            chave, valor = linha.split(":", 1)
            campos[re.sub(r"[^A-Z]", "", chave.upper())] = valor.strip()
    return campos


def palavra(valor):
    return re.sub(r"[^A-Z]", "", (valor or "").upper())


# ==========================================
# Agentes (LLM real) e versão simulada
# ==========================================
class AgentesLLM:
    def __init__(self, modelo_nome="qwen3.5:9b"):
        from langchain_ollama import ChatOllama
        from langchain.agents import create_agent
        self._create_agent = create_agent
        self.modelo = ChatOllama(
            model=modelo_nome, base_url="http://localhost:11434", reasoning=False,
            keep_alive="30m", num_ctx=8192, num_predict=1024, temperature=0.1,
        )

    def _chamar(self, system_prompt, conteudo):
        agente = self._create_agent(self.modelo, tools=[], system_prompt=system_prompt)
        resposta = agente.invoke({"messages": [{"role": "user", "content": conteudo}]},
                                 config={"recursion_limit": 8})
        return resposta["messages"][-1].content

    def avaliar(self, nome, id_produto):
        perfil, produto = avaliadores[nome], produtos_leilao[id_produto]
        prompt = (
            f"Você é {nome}, um agente avaliador de leilões que define o preço inicial de um item.\n"
            f"Suas especialidades: {', '.join(perfil['especialidades'])}.\n"
            f"Sua estratégia: {ESTRATEGIAS[perfil['estrategia']]}.\n\n"
            f"DADOS DO PRODUTO:\n- Item: {produto['nome']}\n- Categoria: {produto['categoria']}\n"
            f"- Custo de aquisição: {produto['custo_aquisicao']:.2f}\n- Idade: {produto['idade']} anos\n"
            f"- Relevância no mercado: {produto['relevancia']}\n\n"
            "Se a categoria do produto não estiver entre suas especialidades, RECUSE.\n\n"
            "FORMATO DA RESPOSTA (exatamente 3 linhas, sem markdown):\n"
            "DECISAO: PROPOR ou RECUSAR\n"
            "PRECO: apenas o número, com ponto decimal e sem separador de milhar (ex.: 1850.00). Se recusar, escreva 0\n"
            "JUSTIFICATIVA: uma frase curta baseada na idade, relevância e custo"
        )
        return self._chamar(prompt, "Avalie o produto e defina o preço inicial.")

    def dar_lance(self, nome, id_produto, escala, mensagem):
        produto = produtos_leilao[id_produto]
        orcamento = orcamento_comprador(nome, id_produto, escala)
        prompt = (
            f"Você é {nome}, um comprador participando de um leilão de preço crescente.\n"
            f"Item: {produto['nome']} ({produto['categoria']}, {produto['idade']} anos, relevância {produto['relevancia']}).\n"
            f"Seu ORÇAMENTO MÁXIMO é {orcamento:.2f} (informação privada: nunca revele e nunca ultrapasse).\n"
            f"Seu estilo: {compradores[nome]['estilo']}.\n\n"
            "A cada rodada você recebe o lance atual, quem lidera, o lance mínimo para cobrir e o histórico.\n"
            "Decida se COBRE (dá um lance >= lance mínimo e <= seu orçamento) ou PASSA (sai da disputa).\n\n"
            "FORMATO DA RESPOSTA (exatamente 3 linhas, sem markdown):\n"
            "ACAO: COBRIR ou PASSAR\n"
            "LANCE: apenas o número, com ponto decimal e sem separador de milhar (se PASSAR, escreva 0)\n"
            "MOTIVO: uma frase curta"
        )
        return self._chamar(prompt, mensagem)

    def narrar(self, situacao):
        prompt = ("Você é um leiloeiro carismático. Responda com UMA frase curta e animada, em português, "
                  "sem markdown, anunciando a situação descrita.")
        return self._chamar(prompt, situacao).strip().splitlines()[0]


class AgentesSimulados:
    """Respostas determinísticas no mesmo formato do LLM, com pausas para parecer ao vivo."""

    def __init__(self, pausa=1.2):
        self.pausa = pausa
        self.rng = random.Random(42)

    def _esperar(self):
        time.sleep(self.pausa * self.rng.uniform(0.6, 1.4))

    def avaliar(self, nome, id_produto):
        self._esperar()
        perfil, produto = avaliadores[nome], produtos_leilao[id_produto]
        fator = {"conservadora": 1.0, "equilibrada": 1.6, "agressiva": 1.25}[perfil["estrategia"]]
        preco = round(produto["custo_aquisicao"] * fator / 10) * 10
        if produto["categoria"] not in perfil["especialidades"] and perfil["estrategia"] != "equilibrada":
            return "DECISAO: RECUSAR\nPRECO: 0\nJUSTIFICATIVA: Não é minha especialidade."
        return (f"DECISAO: PROPOR\nPRECO: {preco:.2f}\n"
                f"JUSTIFICATIVA: Item de {produto['idade']} anos e relevância {produto['relevancia']}.")

    def dar_lance(self, nome, id_produto, escala, mensagem):
        self._esperar()
        orcamento = orcamento_comprador(nome, id_produto, escala)
        minimo = ler_preco(re.search(r"Lance mínimo para cobrir: ([\d.]+)", mensagem).group(1))
        if nome == "Entusiasta_Davi":
            lance = min(minimo + 3 * INCREMENTO_MINIMO, orcamento)
        elif nome == "Revendedor_Lia":
            lance = minimo if minimo <= orcamento * 0.97 else None
        else:
            lance = minimo
        if lance is None or lance < minimo or minimo > orcamento:
            return "ACAO: PASSAR\nLANCE: 0\nMOTIVO: Ficou caro demais para mim."
        return f"ACAO: COBRIR\nLANCE: {lance:.2f}\nMOTIVO: Ainda vale a pena para mim."

    def narrar(self, situacao):
        time.sleep(self.pausa * 0.5)
        return situacao


# ==========================================
# Protocolo (Python), emitindo eventos
# ==========================================
def executar_leilao(id_produto, limite_chegada=2, escala=1.0, regra_pagamento="lance_vencedor", simulado=False):
    produto = produtos_leilao[id_produto]
    anuncio = criar_anuncio(id_produto, limite_chegada)

    yield {"tipo": "inicio", "produto": {"id": id_produto, **produto}, "anuncio": anuncio,
           "regra_pagamento": regra_pagamento, "incremento": INCREMENTO_MINIMO,
           "avaliadores": [{"nome": n, **p} for n, p in avaliadores.items()],
           "compradores": [{"nome": n, "estilo": c["estilo"]} for n, c in compradores.items()],
           "simulado": simulado}

    try:
        ia = AgentesSimulados() if simulado else AgentesLLM()
    except Exception as e:  # pragma: no cover - depende do ambiente
        yield {"tipo": "erro", "mensagem": f"Não foi possível iniciar os agentes: {e}"}
        return

    yield {"tipo": "fase", "fase": "anuncio"}
    yield {"tipo": "pensando", "quem": "Leiloeiro"}
    yield {"tipo": "fala", "quem": "Leiloeiro", "texto": ia.narrar(
        f"Começa o leilão do item {produto['nome']}, com {produto['idade']} anos. "
        f"Os avaliadores vão sugerir o preço inicial.")}

    # ---------- 1. Avaliadores ----------
    yield {"tipo": "fase", "fase": "avaliacao"}
    propostas = []
    for nome, perfil in avaliadores.items():
        yield {"tipo": "pensando", "quem": nome}
        lida = ler_campos(ia.avaliar(nome, id_produto))
        decisao, preco = palavra(lida.get("DECISAO")), ler_preco(lida.get("PRECO", ""))
        justificativa = lida.get("JUSTIFICATIVA", "")
        yield {"tipo": "avaliacao", "nome": nome, "decisao": decisao, "preco": preco, "justificativa": justificativa}
        if decisao == "PROPOR" and preco is not None:
            propostas.append({"nome": nome, "preco_sugerido": preco, "chegada": perfil["chegada"],
                              "justificativa": justificativa})

    # ---------- 2. Filtro e escolha do preço inicial ----------
    yield {"tipo": "fase", "fase": "filtro"}
    enviados = {p["nome"]: p for p in propostas}
    motivos, validas = {}, []
    for nome, perfil in avaliadores.items():
        p = enviados.get(nome)
        if p is None:
            motivos[nome] = {"valido": False, "texto": "Recusou ou não enviou preço legível"}
        elif anuncio["requisito_categoria"] not in perfil["especialidades"]:
            motivos[nome] = {"valido": False, "texto": f"Não é especialista em {anuncio['requisito_categoria']}"}
        elif p["chegada"] > anuncio["limite_chegada"]:
            motivos[nome] = {"valido": False, "texto": f"Chegada {p['chegada']} excede o limite {anuncio['limite_chegada']}"}
        elif p["preco_sugerido"] < anuncio["preco_reserva"]:
            motivos[nome] = {"valido": False, "texto": f"Abaixo da reserva {anuncio['preco_reserva']:.2f}"}
        else:
            motivos[nome] = {"valido": True, "texto": "Avaliação válida"}
            validas.append(p)
    time.sleep(0.8)
    yield {"tipo": "filtro", "motivos": motivos}

    if not validas:
        yield {"tipo": "preco_inicial", "valor": None, "avaliador": None}
        yield {"tipo": "fase", "fase": "encerramento"}
        yield {"tipo": "fala", "quem": "Leiloeiro", "texto": ia.narrar(
            "Nenhuma avaliação válida: o item não vai a leilão nesta rodada.")}
        yield {"tipo": "resultado", "resultado": None, "motivo": "Sem preço inicial válido."}
        yield {"tipo": "fim"}
        return

    escolhida = min(validas, key=lambda p: (p["preco_sugerido"], p["nome"]))
    preco_inicial = escolhida["preco_sugerido"]
    yield {"tipo": "preco_inicial", "valor": preco_inicial, "avaliador": escolhida["nome"]}
    yield {"tipo": "pensando", "quem": "Leiloeiro"}
    yield {"tipo": "fala", "quem": "Leiloeiro", "texto": ia.narrar(
        f"O lance inicial é {preco_inicial:.2f}. Quem dá mais pelo {produto['nome']}?")}

    # ---------- 3. Lances ----------
    yield {"tipo": "fase", "fase": "lances"}
    ativos = list(compradores)
    lances = []
    lider, lance_atual = None, None
    for rodada in range(1, MAX_RODADAS_LANCES + 1):
        yield {"tipo": "rodada", "numero": rodada}
        houve_lance = False
        for nome in list(ativos):
            if nome == lider:
                continue
            minimo = preco_inicial if lance_atual is None else lance_atual + INCREMENTO_MINIMO
            historico = "\n".join(f"- rodada {l['rodada']}: {l['nome']} deu {l['valor']:.2f}" for l in lances) \
                or "- nenhum lance ainda"
            mensagem = (
                f"Rodada {rodada}.\n"
                f"Lance atual: {f'{lance_atual:.2f}' if lance_atual else f'nenhum (preço inicial {preco_inicial:.2f})'}\n"
                f"Líder: {lider or 'ninguém'}\n"
                f"Lance mínimo para cobrir: {minimo:.2f}\n"
                f"Histórico de lances:\n{historico}"
            )
            yield {"tipo": "pensando", "quem": nome}
            r = ler_campos(ia.dar_lance(nome, id_produto, escala, mensagem))
            acao, valor, motivo = palavra(r.get("ACAO")), ler_preco(r.get("LANCE", "")), r.get("MOTIVO", "")
            orcamento = orcamento_comprador(nome, id_produto, escala)

            if acao != "COBRIR":
                saida = f"Passou: {motivo}"
            elif valor is None or valor < minimo:
                saida = f"Lance rejeitado: abaixo do mínimo {minimo:.2f}"
            elif valor > orcamento:
                saida = "Lance rejeitado: acima do próprio orçamento"
            else:
                lances.append({"rodada": rodada, "nome": nome, "valor": valor})
                lider, lance_atual, houve_lance = nome, valor, True
                yield {"tipo": "lance", "nome": nome, "valor": valor, "rodada": rodada, "motivo": motivo}
                continue

            ativos.remove(nome)
            yield {"tipo": "saida", "nome": nome, "motivo": saida, "rodada": rodada}

        if not houve_lance:
            break

    # ---------- 4. Alocação e pagamento ----------
    yield {"tipo": "fase", "fase": "encerramento"}
    if lider is None:
        yield {"tipo": "fala", "quem": "Leiloeiro", "texto": ia.narrar(
            "Ninguém cobriu o lance inicial: o item não foi vendido.")}
        yield {"tipo": "resultado", "resultado": None, "motivo": "Nenhum comprador cobriu o preço inicial."}
        yield {"tipo": "fim"}
        return

    if regra_pagamento == "segundo_maior_lance":
        outros = [l["valor"] for l in lances if l["nome"] != lider]
        pagamento = max(max(outros, default=preco_inicial), preco_inicial)
    else:
        pagamento = lance_atual

    yield {"tipo": "fala", "quem": "Leiloeiro", "texto": ia.narrar(
        f"Dou-lhe uma, dou-lhe duas... vendido para {lider} por {lance_atual:.2f}!")}
    yield {"tipo": "resultado", "motivo": None, "resultado": {
        "vencedor": lider, "lance_vencedor": lance_atual,
        "regra_pagamento": regra_pagamento, "pagamento": pagamento, "preco_inicial": preco_inicial,
        "orcamentos": {n: orcamento_comprador(n, id_produto, escala) for n in compradores},
    }}
    yield {"tipo": "fim"}
