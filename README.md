# Interface Multimodal com LLaMA Local - Desktop App para Windows 11 Pro

Uma aplicação desktop moderna desenvolvida em Electron + React + TypeScript que permite interação multimodal com modelos LLaMA locais através do Ollama.

## 📋 Funcionalidades

- ✅ **Interface Desktop Nativa**: Aplicação Electron para Windows 11 Pro
- ✅ **Integração com LLaMA Local**: Conecta com modelos LLaMA via Ollama
- ✅ **Upload de Arquivos Multimodal**: Suporte para imagens, documentos, áudio e vídeo
- ✅ **Interface Responsiva**: Design moderno com suporte a tema escuro/claro
- ✅ **Processamento em Background**: Web Workers para processamento de arquivos
- ✅ **Conexão Configurável**: URL do servidor LLaMA configurável
- ✅ **Seleção de Modelos**: Interface para escolher diferentes modelos LLaMA

## 🚀 Pré-requisitos

### Para Windows 11 Pro:

1. **Node.js** (versão 18 ou superior)
   - Baixe em: https://nodejs.org/
   
2. **Ollama** (para executar modelos LLaMA localmente)
   - Baixe em: https://ollama.ai/
   - Instale um modelo: `ollama pull llama2` ou `ollama pull llama3`

3. **Git** (opcional, para desenvolvimento)
   - Baixe em: https://git-scm.com/

## 📦 Instalação e Uso

### Opção 1: Executável Pré-construído (Recomendado)

1. Baixe o arquivo `.exe` da seção Releases
2. Execute o instalador seguindo as instruções
3. Inicie o Ollama: `ollama serve`
4. Execute a aplicação através do ícone no desktop

### Opção 2: Desenvolvimento Local

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/gersonvida12-hash/Engenharia-de-prompt-aplicada.git
   cd Engenharia-de-prompt-aplicada
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute em modo de desenvolvimento:**
   ```bash
   # Terminal 1: Inicie o Ollama
   ollama serve
   
   # Terminal 2: Execute a aplicação
   npm run electron:dev
   ```

4. **Construir executável para Windows:**
   ```bash
   npm run dist:win
   ```
   O executável será criado na pasta `release/`

## 🔧 Configuração do LLaMA

### Instalando e Configurando o Ollama:

1. **Baixe e instale o Ollama:**
   - Windows: https://ollama.ai/download/windows
   
2. **Inicie o serviço:**
   ```bash
   ollama serve
   ```

3. **Baixe modelos LLaMA:**
   ```bash
   # Modelos recomendados
   ollama pull llama2          # Modelo base (~3.8GB)
   ollama pull llama3          # Modelo mais recente (~4.7GB)
   ollama pull codellama       # Especializado em código (~3.8GB)
   ollama pull mistral         # Alternativo rápido (~4.1GB)
   ```

4. **Verificar modelos instalados:**
   ```bash
   ollama list
   ```

### Configuração na Aplicação:

- **URL padrão**: `http://localhost:11434`
- **Porta padrão do Ollama**: 11434
- Teste a conexão usando o botão "Testar Conexão" na interface

## 🎯 Como Usar a Aplicação

### 1. Verificar Conexão
- Certifique-se que o status mostra "Conectado ao LLaMA"
- Se não conectar, verifique se o Ollama está rodando

### 2. Selecionar Modelo
- Use o dropdown "Modelo" para escolher o modelo LLaMA desejado
- Modelos disponíveis aparecerão automaticamente

### 3. Interação com Texto
- Digite sua pergunta no campo de texto
- Clique em "Enviar" para obter resposta

### 4. Upload de Arquivos
- Arraste arquivos para a área de upload OU
- Clique em "Procurar Arquivos"
- Tipos suportados:
  - **Imagens**: PNG, JPEG, WebP, HEIC, HEIF
  - **Documentos**: PDF, DOCX, PPTX, XLSX, RTF, TXT, CSV
  - **Áudio**: WAV, MP3, AIFF, AAC, OGG, FLAC
  - **Vídeo**: MP4, MPEG, MOV, AVI, WebM, WMV, 3GPP

### 5. Análise Multimodal
- Faça upload de arquivos + digite prompt
- O LLaMA analisará o conteúdo dos arquivos junto com seu texto

## 🛠 Scripts de Desenvolvimento

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento (web)
npm run electron:dev     # Desenvolvimento Electron

# Build
npm run build           # Build do frontend
npm run build:electron  # Build do processo principal Electron
npm run dist           # Criar executável multiplataforma
npm run dist:win       # Criar executável apenas para Windows

# Teste
npm run electron       # Executar aplicação Electron diretamente
```

## 📁 Estrutura do Projeto

```
├── electron/           # Código Electron (processo principal)
│   ├── main.ts        # Processo principal
│   ├── preload.ts     # Script de preload
│   └── tsconfig.json  # Config TypeScript para Electron
├── src/               # Código React
│   ├── components/    # Componentes React
│   ├── services/      # Serviços (LLaMA API)
│   ├── styles/        # Estilos CSS
│   └── types/         # Definições TypeScript
├── public/            # Arquivos estáticos
├── dist/              # Build do frontend
├── dist-electron/     # Build do Electron
└── release/           # Executáveis finais
```

## 🔧 Personalização

### Configurar Modelos Customizados:
1. Adicione modelos no Ollama: `ollama pull [modelo]`
2. Selecione na interface ou configure via código

### Configurar URL Customizada:
- Altere a URL na interface para usar servidor remoto
- Exemplo: `http://192.168.1.100:11434`

### Temas e Estilos:
- Edite `src/styles/global.css`
- Suporte automático a tema escuro/claro do sistema

## 🚨 Solução de Problemas

### LLaMA não conecta:
1. Verifique se Ollama está rodando: `ollama serve`
2. Teste no navegador: http://localhost:11434/api/tags
3. Verifique firewall/antivírus

### Arquivo não é processado:
1. Verifique se o tipo de arquivo é suportado
2. Verifique se o arquivo não excede 20MB
3. Tente com arquivo menor primeiro

### Performance lenta:
1. Use modelos menores (llama2 vs llama3)
2. Verifique recursos do sistema (RAM, CPU)
3. Configure GPU se disponível

### Executável não inicia:
1. Execute como administrador
2. Verifique se todas as dependências estão instaladas
3. Verifique logs em `%APPDATA%/interface-llama-desktop`

## 📋 Requisitos do Sistema

### Mínimos:
- **OS**: Windows 11 Pro (64-bit)
- **RAM**: 8GB (recomendado 16GB+)
- **Armazenamento**: 10GB livres
- **Processador**: Intel i5/AMD Ryzen 5 ou superior

### Para modelos LLaMA maiores:
- **RAM**: 16GB+ (32GB recomendado)
- **GPU**: NVIDIA RTX (opcional, para aceleração)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Add nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

- **Issues**: https://github.com/gersonvida12-hash/Engenharia-de-prompt-aplicada/issues
- **Documentação Ollama**: https://ollama.ai/docs
- **Documentação Electron**: https://electronjs.org/docs

---

⚡ **Transformado com sucesso de uma interface web Gemini para um aplicativo desktop Windows 11 Pro com LLaMA local!**
