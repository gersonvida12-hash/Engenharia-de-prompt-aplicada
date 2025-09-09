# Guia de Instalação - Interface LLaMA Desktop para Windows 11 Pro

Este guia o ajudará a instalar e configurar a Interface LLaMA Desktop em seu sistema Windows 11 Pro.

## 🎯 Instalação Rápida (Usuário Final)

### 1. Pré-requisitos Essenciais

#### Ollama (Obrigatório)
1. **Baixe o Ollama para Windows:**
   - Acesse: https://ollama.ai/download/windows
   - Execute o instalador `ollama-windows-amd64.exe`
   - Siga as instruções de instalação

2. **Configure o Ollama:**
   ```cmd
   # Abra o Command Prompt ou PowerShell como Administrador
   ollama serve
   ```
   > ⚠️ **Importante**: Mantenha esta janela aberta enquanto usar a aplicação!

3. **Instale um modelo LLaMA:**
   ```cmd
   # Escolha UM dos modelos abaixo (recomendação: llama3 para melhor desempenho)
   ollama pull llama3       # Mais recente e eficiente (~4.7GB)
   ollama pull llama2       # Mais estável (~3.8GB)
   ollama pull mistral      # Mais rápido (~4.1GB)
   ```

### 2. Instalação da Aplicação

#### Opção A: Executável Pronto (Recomendado)
1. Baixe `Interface-LLaMA-Desktop-Setup.exe` da seção Releases
2. Execute como administrador
3. Siga o assistente de instalação
4. Encontre o ícone no Desktop ou Menu Iniciar

#### Opção B: Build Manual
1. **Instale Node.js:**
   - Baixe: https://nodejs.org/ (versão LTS)
   - Execute o instalador

2. **Baixe o código:**
   ```cmd
   git clone https://github.com/gersonvida12-hash/Engenharia-de-prompt-aplicada.git
   cd Engenharia-de-prompt-aplicada
   ```

3. **Instale e construa:**
   ```cmd
   npm install
   npm run dist:win
   ```

4. **Execute:**
   - Encontre o `.exe` na pasta `release/`

## 🚀 Primeiro Uso

### 1. Inicie o Sistema
```cmd
# Terminal 1: Inicie o Ollama
ollama serve

# Aguarde a mensagem: "Ollama is running on http://localhost:11434"
```

### 2. Execute a Aplicação
- Clique duplo no ícone "Interface LLaMA Desktop"
- Ou execute o `.exe` da pasta de instalação

### 3. Verifique a Conexão
- Status deve mostrar: ✅ "Conectado ao LLaMA"
- Se não conectar, clique em "Testar Conexão"

### 4. Teste Básico
1. Selecione um modelo no dropdown
2. Digite: "Olá! Como você funciona?"
3. Clique "Enviar"
4. Aguarde a resposta

## 📊 Monitoramento do Sistema

### Verificar se Ollama está Rodando:
```cmd
# Abra Command Prompt e digite:
curl http://localhost:11434/api/tags
# Ou no navegador: http://localhost:11434/api/tags
```

### Verificar Modelos Instalados:
```cmd
ollama list
```

### Verificar Uso de Recursos:
- **Task Manager** → Aba "Performance"
- Ollama usa significativa CPU/RAM durante processamento

## 🔧 Configurações Avançadas

### Configurar Ollama para Iniciar Automaticamente:

1. **Windows Services:**
   ```cmd
   # Execute como Administrador
   sc create OllamaService binPath="C:\Users\%USERNAME%\AppData\Local\Programs\Ollama\ollama.exe serve" start=auto
   sc start OllamaService
   ```

2. **Task Scheduler:**
   - Abra "Task Scheduler"
   - Criar Tarefa Básica
   - Trigger: "When computer starts"
   - Action: `ollama.exe serve`

### Configurar Modelos Customizados:

1. **Criar Modelfile:**
   ```dockerfile
   # Arquivo: Modelfile
   FROM llama3
   SYSTEM "Você é um assistente especializado em [sua área]"
   ```

2. **Criar modelo customizado:**
   ```cmd
   ollama create meu-modelo -f Modelfile
   ```

### Configurar GPU (NVIDIA):
```cmd
# Verificar se GPU está disponível
nvidia-smi

# Ollama detectará automaticamente GPU compatível
# Verifique logs durante inicialização
```

## 🛠 Solução de Problemas Detalhada

### Problema: "Não foi possível conectar ao LLaMA local"

**Soluções:**
1. **Verificar Ollama:**
   ```cmd
   # Verificar se está rodando
   tasklist | findstr ollama
   
   # Se não estiver, iniciar
   ollama serve
   ```

2. **Verificar Firewall:**
   - Windows Defender Firewall
   - Adicionar exceção para porta 11434
   - Adicionar exceção para ollama.exe

3. **Verificar Antivírus:**
   - Adicionar ollama.exe à lista de exceções
   - Adicionar pasta de instalação às exceções

### Problema: "Nenhum modelo disponível"

**Soluções:**
1. **Instalar modelos:**
   ```cmd
   ollama pull llama3
   ollama list  # Verificar instalação
   ```

2. **Verificar espaço em disco:**
   - Modelos ocupam 3-8GB cada
   - Verificar espaço livre suficiente

### Problema: Performance lenta

**Soluções:**
1. **Verificar recursos:**
   - RAM: Mínimo 8GB, recomendado 16GB+
   - CPU: Usar modelos menores se necessário

2. **Otimizar modelo:**
   ```cmd
   # Use modelos menores
   ollama pull tinyllama    # Modelo pequeno (~637MB)
   ```

3. **Configurar prioridade:**
   - Task Manager → Ollama process → Set Priority → High

### Problema: Executável não inicia

**Soluções:**
1. **Verificar dependências:**
   - Visual C++ Redistributables instalados
   - Windows 11 atualizado

2. **Executar como administrador:**
   - Clique direito → "Run as administrator"

3. **Verificar logs:**
   - Localização: `%APPDATA%/interface-llama-desktop/logs/`

## 📋 Checklist de Instalação Completa

- [ ] Windows 11 Pro instalado e atualizado
- [ ] Ollama baixado e instalado
- [ ] Pelo menos um modelo LLaMA baixado
- [ ] Ollama service rodando (`ollama serve`)
- [ ] Interface LLaMA Desktop instalada
- [ ] Teste de conexão bem-sucedido
- [ ] Teste de chat básico funcionando
- [ ] Teste de upload de arquivo funcionando

## 🆘 Suporte Adicional

### Logs e Diagnósticos:
```cmd
# Verificar logs do Ollama
ollama logs

# Verificar status detalhado
ollama ps

# Informações do sistema
systeminfo | findstr /B /C:"OS Name" /C:"Total Physical Memory"
```

### Contatos de Suporte:
- **GitHub Issues**: https://github.com/gersonvida12-hash/Engenharia-de-prompt-aplicada/issues
- **Documentação Ollama**: https://ollama.ai/docs
- **Comunidade**: Discord/Forums específicos

### Backup e Restauração:
```cmd
# Backup de modelos (opcional)
xcopy "%USERPROFILE%\.ollama" "C:\Backup\ollama" /E /I

# Restaurar modelos
xcopy "C:\Backup\ollama" "%USERPROFILE%\.ollama" /E /I
```

---

## 🎉 Conclusão

Após seguir este guia, você terá:
- ✅ Sistema LLaMA local funcionando
- ✅ Interface desktop moderna e intuitiva  
- ✅ Capacidade de processamento multimodal
- ✅ Configuração otimizada para Windows 11 Pro

**Próximos Passos:**
1. Experimente diferentes modelos
2. Teste uploads de diferentes tipos de arquivo
3. Explore configurações avançadas conforme necessidade

Aproveite sua nova interface LLaMA Desktop! 🚀