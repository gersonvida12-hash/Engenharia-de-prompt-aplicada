@echo off
echo ======================================
echo  Interface LLaMA Desktop - Build Win11
echo ======================================
echo.

echo [1/5] Verificando dependências...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js não encontrado. Instale: https://nodejs.org/
    pause
    exit /b 1
)

echo [2/5] Instalando dependências...
call npm install
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependências
    pause
    exit /b 1
)

echo [3/5] Construindo frontend React...
call npm run build
if errorlevel 1 (
    echo ERRO: Falha ao construir frontend
    pause
    exit /b 1
)

echo [4/5] Construindo processo Electron...
call npm run build:electron
if errorlevel 1 (
    echo ERRO: Falha ao construir Electron
    pause
    exit /b 1
)

echo [5/5] Criando executável Windows...
call npm run dist:win
if errorlevel 1 (
    echo ERRO: Falha ao criar executável
    pause
    exit /b 1
)

echo.
echo ✅ BUILD CONCLUÍDO COM SUCESSO!
echo.
echo 📁 Executáveis criados em: release/
echo 📋 Arquivos disponíveis:
dir /B release\*.exe 2>nul
echo.
echo 🚀 Para usar:
echo    1. Instale Ollama: https://ollama.ai/
echo    2. Execute: ollama serve
echo    3. Execute o .exe criado
echo.
pause