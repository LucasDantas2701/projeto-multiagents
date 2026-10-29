import os, sys, subprocess
from importlib.metadata import version, PackageNotFoundError
IN_COLAB = 'google.colab' in sys.modules or bool(os.environ.get('COLAB_RELEASE_TAG'))
REQUISITOS = {'langchain': '1.4.7', 'langchain-core': '1.7.1', 'pydantic': '2.13.5', 'langchain-ollama': '1.1.0', 'langgraph': '1.2.18', 'ollama': '0.6.3'}

def versao_instalada(nome):
    try: return version(nome)
    except PackageNotFoundError: return None
faltantes = [f'{p}=={v}' for p, v in REQUISITOS.items() if versao_instalada(p) != v]
if IN_COLAB and faltantes:
    subprocess.run([sys.executable, '-m', 'pip', 'install', '--only-binary=:all:', '--disable-pip-version-check', '--index-url', 'https://pypi.org/simple', *faltantes], check=True)
elif faltantes: raise RuntimeError('Fora do Colab não instalamos automaticamente. Use o ambiente preparado nas versões indicadas no README.')
print('Python do kernel:', sys.executable, '| Colab:', IN_COLAB)
print('Versões conferidas:', {p: versao_instalada(p) for p in REQUISITOS})