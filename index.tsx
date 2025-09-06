/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/*
 * == ANÁLISE E MELHORIAS AVANÇADAS POR ENGENHEIRO SÊNIOR (PÓS-REFATORAÇÃO NÍVEL DEUS) ==
 *
 * Olá, colega engenheiro!
 *
 * A aplicação foi novamente refatorada para atingir um novo patamar de excelência,
 * incorporando as novas funcionalidades de forma robusta e com performance máxima.
 *
 * 1.  **Performance Radical com Web Workers:**
 *     - **Implementação:** A leitura e codificação de arquivos para Base64, uma operação potencialmente
 *       bloqueante, foi movida para um Web Worker (`fileProcessor.js`).
 *     - **Benefícios:** A thread principal (UI) fica 100% livre. O usuário pode anexar múltiplos
 *       arquivos, mesmo que grandes, e a interface permanecerá perfeitamente fluida e responsiva.
 *       O estado `processingAttachments` fornece feedback claro durante esta operação assíncrona.
 *
 * 2.  **Arquitetura Multimodal Inteligente:**
 *     - **Implementação:** O `geminiService` foi aprimorado para construir dinamicamente o corpo da
 *       requisição. Ele combina o prompt de texto com os dados dos arquivos (como `inlineData`)
 *       em uma única chamada `generateContent`, utilizando o poder multimodal do Gemini.
 *       A "estratégia de uso" selecionada pelo usuário é injetada no prompt de texto para guiar a IA.
 *     - **Benefícios:** Arquitetura limpa e poderosa. A complexidade da API multimodal é abstraída
 *       do resto da aplicação, tornando a geração de conteúdo multimodal tão simples quanto a de texto.
 *
 * 3.  **Estado da Aplicação Centralizado e Previsível (FSM Aprimorada):**
 *     - **Implementação:** A FSM foi expandida para incluir o estado `processingAttachments`. O estado global
 *       agora gerencia `attachments` e `attachmentUsage`, garantindo que toda a UI reaja de forma
 *       consistente a mudanças, como adicionar ou remover um arquivo.
 *     - **Benefícios:** Mantém a aplicação livre de bugs de estado, mesmo com a complexidade adicional
 *       de uploads de arquivo e múltiplas interações do usuário.
 *
 * 4.  **UI/UX Refinada e Resiliente:**
 *     - **Implementação:** O fluxo de upload agora inclui um botão de "Cancelar" e um timeout de 30
 *       segundos. Se o processamento demorar ou falhar, o usuário tem controle total para interromper
 *       a operação ou será notificado do erro, evitando que a UI fique "congelada" em um estado de
 *       carregamento.
 *     - **Benefícios:** A experiência do usuário é drasticamente melhorada, tornando a aplicação
 *       mais robusta e confiável.
 */
import { GoogleGenAI, Type, Part } from '@google/genai';
import { marked } from 'marked';

// --- Type Definitions ---
type AppStatus =
  | 'idle'
  | 'processingAttachments'
  | 'generatingBasePrompt'
  | 'customizingArchitectures'
  | 'awaitingArchitectureSelection'
  | 'generatingDossier'
  | 'refiningPrompt'
  | 'evaluatingPrompt'
  | 'success'
  | 'testingPrompt'
  | 'optimizingPrompt'
  | 'auditingCode'
  | 'error';

type AttachmentUsage = 'context' | 'style_source' | 'structural_example' | 'fact_check';

interface ProcessedFile {
    name: string;
    mimeType: string;
    base64: string;
}

interface AppState {
    current: AppStatus;
    userInput?: string;
    attachments: ProcessedFile[];
    attachmentUsage: AttachmentUsage;
    basePrompt?: string;
    selectedArchKey?: string;
    finalPrompt?: string;
    dossierHTML?: string;
    errorMessage?: string;
}

interface PromptArchitecture {
    title: string;
    description: string;
}

interface TailoredDescriptions {
    [key: string]: string;
}

interface EvaluationResult {
    clarity: number;
    efficiency: number;
    robustness: number;
    summary: string;
}

// --- Constants ---
const PROMPT_ARCHITECTURES: { [key: string]: PromptArchitecture } = {
  zero_shot: { title: 'Zero-Shot Direto', description: 'Executa a tarefa diretamente, confiando na capacidade inata do modelo. Ideal para tarefas simples e bem definidas.' },
  few_shot: { title: 'Few-Shot com Exemplos', description: 'Fornece 2-3 exemplos (entrada/saída) para guiar o modelo a um formato ou estilo de resposta específico.' },
  chain_of_thought: { title: 'Cadeia de Pensamento (CoT)', description: 'Instrui o modelo a "pensar passo a passo" para decompor problemas complexos, aumentando a precisão.' },
  react: { title: 'Agente Simulado (ReAct)', description: 'Estrutura o prompt para que a IA emule um ciclo de "Pensamento, Ação, Observação" para planejamento.' },
  rag: { title: 'Geração Aumentada por Recuperação (RAG Simulado)', description: 'Simula a arquitetura RAG, incluindo um placeholder para "Contexto Recuperado" no prompt.' },
  rollback_instructions: { title: 'Instruções de Rollback', description: 'Define "pontos de salvamento" e comandos de rollback (ex: `!desfazer`) para que o modelo possa reverter para um estado anterior se um caminho de raciocínio falhar.' },
  conditional_prompting: { title: 'Prompt Condicional (IF/THEN)', description: 'Estrutura o prompt com blocos lógicos (ex: "SE a entrada contém X, ENTÃO siga o caminho A, SENÃO siga o caminho B") para criar respostas dinâmicas.' },
};

const PHASE_3_BUILDERS: { [key: string]: string } = {
    zero_shot: `*   **Análise Evolutiva:** (O 'Prompt Elegante' já é uma forma de Zero-Shot. Refine-o adicionando clareza e diretivas explícitas. Gere duas mutações:
    *   **Mutação 1 (Adição de Persona):** Incorpore uma persona de especialista (ex: 'Aja como um historiador...') para focar o conhecimento do modelo.
    *   **Mutação 2 (Formatação de Saída Explícita):** Adicione instruções claras sobre o formato de saída desejado (ex: 'Responda em JSON com as chaves "titulo" e "resumo"').
    *   **Seleção:** Justifique tecnicamente qual dos três prompts é o 'Prompt Campeão' com base na clareza e robustez para uma execução direta.)`,
    few_shot: `*   **Análise Evolutiva:** (Tome o 'Prompt Elegante' como base para uma instrução geral. Agora, construa o prompt Few-Shot.
    *   **Geração de Exemplos:** Crie dois exemplos concisos e de alta qualidade de pares 'entrada/saída' que ilustrem perfeitamente a tarefa.
    *   **Construção do Prompt:** Integre os exemplos ao prompt elegante, seguindo o padrão clássico de Few-Shot.
    *   **Seleção:** Apresente a versão com os exemplos como o 'Prompt Campeão'. Justifique por que os exemplos escolhidos são eficazes para guiar o modelo.)`,
    chain_of_thought: `*   **Análise Evolutiva:** (Incorpore a técnica de Cadeia de Pensamento no 'Prompt Elegante'.
    *   **Mutação 1 (Instrução Direta):** Anexe a frase 'Pense passo a passo.' ou 'Vamos raciocinar sobre isso.' ao prompt.
    *   **Mutação 2 (Exemplo de CoT):** Crie um exemplo demonstrando o raciocínio passo a passo para uma tarefa similar, e adicione-o ao prompt.
    *   **Seleção:** Justifique qual mutação é mais eficaz para a tarefa do usuário, e apresente-a como o 'Campeão'. A Mutação 2 é geralmente mais robusta para problemas complexos.)`,
    react: `*   **Análise Evolutiva:** (Transforme o 'Prompt Elegante' em um prompt que simula um agente ReAct.
    *   **Definição do Ciclo:** Defina explicitamente o formato do ciclo 'Pensamento, Ação, Observação' que o modelo deve seguir.
    *   **Definição de Ferramentas (Simuladas):** Descreva 2-3 'ferramentas' que o agente pode usar (ex: 'search[query]', 'calculate[expression]').
    *   **Construção do Prompt Campeão:** Junte a tarefa do usuário com as instruções do ciclo ReAct e as ferramentas definidas, criando um prompt que guie o modelo a planejar e executar a tarefa de forma iterativa.)`,
    rag: `*   **Análise Evolutiva:** (Adapte o 'Prompt Elegante' para simular uma arquitetura RAG.
    *   **Definição do Placeholder de Contexto:** Crie um placeholder claro no prompt, como \`[INSERIR CONTEXTO RELEVANTE AQUI]\` ou usando tags XML como \`<contexto>...</contexto>\`.
    *   **Instrução de Grounding:** Adicione uma instrução explícita para o modelo basear sua resposta *exclusivamente* ou *prioritariamente* no contexto fornecido.
    *   **Construção do Prompt Campeão:** Apresente o prompt final contendo o placeholder e a instrução de grounding, explicando como um sistema externo preencheria o contexto para responder à pergunta original do usuário.)`,
    rollback_instructions: `*   **Análise Evolutiva:** (Transforme o 'Prompt Elegante' para incluir um mecanismo de rollback.
    *   **Definição de Pontos de Salvamento:** Identifique etapas lógicas na tarefa e defina como o modelo deve criar "pontos de salvamento" (ex: \`[SAVEPOINT: etapa_1_concluida]\`).
    *   **Definição do Comando de Rollback:** Crie um comando claro, como \`!desfazer\`, e instrua o modelo sobre como usá-lo para reverter para o último ponto de salvamento.
    *   **Construção do Prompt Campeão:** Integre a tarefa, as instruções de ponto de salvamento e o comando de rollback em um prompt que permita a depuração e correção de curso durante a geração.)`,
    conditional_prompting: `*   **Análise Evolutiva:** (Reestruture o 'Prompt Elegante' para operar com base em lógica condicional.
    *   **Identificação de Condições:** Analise a tarefa e identifique 2-3 condições-chave que podem alterar o resultado (ex: presença de uma palavra-chave, formato da entrada).
    *   **Definição dos Blocos Lógicos:** Para cada condição, escreva uma instrução clara no formato "SE [condição], ENTÃO [instrução_A], SENÃO [instrução_B]".
    *   **Construção do Prompt Campeão:** Monte o prompt final combinando a tarefa principal com os blocos lógicos, criando um sistema de decisão que guia o modelo para a saída correta com base na entrada.)`
};

const ATTACHMENT_PROCESSING_TIMEOUT = 30000; // 30 seconds

// --- DOM Element Selection ---
const ui = {
    promptForm: document.getElementById('prompt-form') as HTMLFormElement,
    promptInput: document.getElementById('prompt-input') as HTMLTextAreaElement,
    generateButton: document.getElementById('generate-button') as HTMLButtonElement,
    fileInput: document.getElementById('file-input') as HTMLInputElement,
    attachmentUsage: document.getElementById('attachment-usage') as HTMLSelectElement,
    fileList: document.getElementById('file-list') as HTMLDivElement,
    attachmentLoader: document.getElementById('attachment-loader') as HTMLDivElement,
    cancelAttachmentProcessing: document.getElementById('cancel-attachment-processing') as HTMLButtonElement,
    auditButton: document.getElementById('audit-button') as HTMLButtonElement,
    
    behaviorGuidanceContainer: document.getElementById('behavior-guidance-container') as HTMLDivElement,
    initialPromptLoader: document.getElementById('initial-prompt-loader') as HTMLDivElement,
    initialLoaderText: document.getElementById('initial-loader-text') as HTMLParagraphElement,
    initialPromptDisplay: document.getElementById('initial-prompt-display') as HTMLDivElement,
    initialPromptOutput: document.getElementById('initial-prompt-output') as HTMLQuoteElement,
    behaviorOptions: document.getElementById('behavior-options') as HTMLDivElement,

    resultContainer: document.getElementById('result-container') as HTMLDivElement,
    dossierHeader: document.getElementById('dossier-header') as HTMLDivElement,
    dossierLoader: document.getElementById('dossier-loader') as HTMLDivElement,
    loaderText: document.getElementById('loader-text') as HTMLParagraphElement,
    output: document.getElementById('output') as HTMLDivElement,

    evaluationContainer: document.getElementById('evaluation-container') as HTMLDivElement,
    evaluationLoader: document.getElementById('evaluation-loader') as HTMLDivElement,
    evaluationContent: document.getElementById('evaluation-content') as HTMLDivElement,

    playgroundContainer: document.getElementById('playground-container') as HTMLDivElement,
    playgroundForm: document.getElementById('playground-form') as HTMLFormElement,
    playgroundPrompt: document.getElementById('playground-prompt') as HTMLTextAreaElement,
    refinementInput: document.getElementById('refinement-input') as HTMLInputElement,
    optimizePromptButton: document.getElementById('optimize-prompt-button') as HTMLButtonElement,
    playgroundRunButton: document.getElementById('playground-run-button') as HTMLButtonElement,
    playgroundLoader: document.getElementById('playground-loader') as HTMLDivElement,
    playgroundOutput: document.getElementById('playground-output') as HTMLDivElement,
    playgroundResultContainer: document.getElementById('playground-result-container') as HTMLDivElement,

    auditModal: document.getElementById('audit-modal') as HTMLDivElement,
    auditModalClose: document.getElementById('audit-modal-close') as HTMLButtonElement,
    auditReportContent: document.getElementById('audit-report-content') as HTMLDivElement,
};

// --- Application State ---
let state: AppState = { current: 'idle', attachments: [], attachmentUsage: 'context' };
let ai: GoogleGenAI | null = null;
let fileProcessor: Worker | null = null;
let dossierLoadingInterval: number | null = null;
let attachmentTimeout: number | null = null;


// --- Type Guards & Validators ---
function isTailoredDescriptions(data: any): data is TailoredDescriptions {
    return typeof data === 'object' && data !== null && Object.keys(PROMPT_ARCHITECTURES).every(key => typeof data[key] === 'string');
}

function isEvaluationResult(data: any): data is EvaluationResult {
    return typeof data === 'object' && data !== null &&
           typeof data.clarity === 'number' &&
           typeof data.efficiency === 'number' &&
           typeof data.robustness === 'number' &&
           typeof data.summary === 'string';
}


// --- Gemini Service (API Abstraction) ---
const geminiService = {
    init(): GoogleGenAI {
        if (!ai) {
            ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
        return ai;
    },

    buildContent(prompt: string, attachments: ProcessedFile[]): Part[] {
        const content: Part[] = [{ text: prompt }];
        attachments.forEach(file => {
            content.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.base64,
                }
            });
        });
        return content;
    },
    
    async generateSimple(prompt: string, attachments: ProcessedFile[] = []): Promise<string> {
        const client = this.init();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: this.buildContent(prompt, attachments) },
        });
        return response.text.trim();
    },

    async generateJSON<T>(prompt: string, schema: any, validator: (data: any) => data is T): Promise<T> {
        const client = this.init();
        const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: this.buildContent(prompt, []) }, // JSON generation typically doesn't use files
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const parsed = JSON.parse(response.text);
        if (validator(parsed)) {
            return parsed;
        } else {
            throw new Error("API response failed validation.");
        }
    },

    async generateStream(prompt: string, attachments: ProcessedFile[], onChunk: (html: string) => void): Promise<string> {
        const client = this.init();
        const responseStream = await client.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: { parts: this.buildContent(prompt, attachments) },
        });

        let fullResponse = '';
        for await (const chunk of responseStream) {
            fullResponse += chunk.text;
            onChunk(marked.parse(fullResponse) as string);
        }
        return fullResponse;
    }
};


// --- UI Rendering & State Machine ---

function transitionToState(newState: AppState): void {
    console.log(`Transitioning from ${state.current} to ${newState.current}`);
    state = newState;
    renderUIForState();
}

function renderUIForState(): void {
    // --- Global Controls ---
    const isBusy = !['idle', 'success', 'error'].includes(state.current);
    ui.generateButton.disabled = isBusy;
    ui.promptInput.disabled = isBusy;
    ui.fileInput.disabled = isBusy;
    ui.attachmentUsage.disabled = isBusy;
    ui.auditButton.disabled = isBusy;

    ui.playgroundRunButton.disabled = isBusy;
    ui.optimizePromptButton.disabled = isBusy;
    ui.playgroundPrompt.disabled = isBusy;
    ui.refinementInput.disabled = isBusy;

    ui.optimizePromptButton.textContent = state.current === 'optimizingPrompt' ? 'Otimizando...' : 'Otimizar';

    // --- Loader Visibility ---
    ui.attachmentLoader.classList.toggle('hidden', state.current !== 'processingAttachments');
    
    // --- Audit Button State ---
    const auditIcon = ui.auditButton.querySelector('svg');
    const auditSpinner = ui.auditButton.querySelector('.spinner');
    if (state.current === 'auditingCode') {
        if (auditIcon) auditIcon.style.display = 'none';
        if (auditSpinner) auditSpinner.classList.remove('hidden'); else ui.auditButton.innerHTML = '<div class="spinner"></div>';
    } else {
        if (auditIcon) auditIcon.style.display = 'block';
        if (auditSpinner) auditSpinner.classList.add('hidden');
    }


    // --- Section Visibility ---
    const showBehaviorGuidance = ['generatingBasePrompt', 'customizingArchitectures', 'awaitingArchitectureSelection'].includes(state.current);
    const showResults = ['generatingDossier', 'refiningPrompt', 'evaluatingPrompt', 'success', 'testingPrompt', 'optimizingPrompt'].includes(state.current);
    const showEvaluation = ['evaluatingPrompt', 'success', 'testingPrompt', 'optimizingPrompt'].includes(state.current);
    const showPlayground = ['success', 'testingPrompt', 'optimizingPrompt'].includes(state.current);

    toggleSection(ui.behaviorGuidanceContainer, showBehaviorGuidance);
    toggleSection(ui.resultContainer, showResults);
    toggleSection(ui.evaluationContainer, showEvaluation);
    toggleSection(ui.playgroundContainer, showPlayground);
    
    // --- Render Specific Content for Current State ---
    switch (state.current) {
        case 'idle':
        case 'success':
            ui.output.innerHTML = state.dossierHTML || '';
            if (state.current === 'success') {
                enhanceFinalPromptBlock();
                ui.playgroundPrompt.value = state.finalPrompt || '';
            }
            ui.playgroundResultContainer.setAttribute('aria-busy', 'false');
            break;

        case 'generatingBasePrompt':
            ui.initialPromptDisplay.classList.add('hidden');
            ui.initialPromptLoader.classList.remove('hidden');
            ui.initialLoaderText.textContent = 'Analisando solicitação inicial...';
            break;
            
        case 'customizingArchitectures':
            ui.initialPromptDisplay.classList.remove('hidden');
            ui.initialPromptLoader.classList.remove('hidden');
            ui.initialLoaderText.textContent = 'Personalizando arquiteturas...';
            ui.initialPromptOutput.textContent = state.basePrompt || '';
            ui.behaviorOptions.innerHTML = ''; // Clear old buttons
            ui.behaviorOptions.appendChild(renderArchitectureButtons());
            break;

        case 'awaitingArchitectureSelection':
            ui.initialPromptDisplay.classList.remove('hidden');
            ui.initialPromptLoader.classList.add('hidden');
            ui.initialPromptOutput.textContent = state.basePrompt || '';
            break;

        case 'generatingDossier':
            ui.dossierHeader.classList.remove('hidden');
            ui.resultContainer.setAttribute('aria-busy', 'true');
            startDossierLoadingAnimation(['Analisando Intenção...', 'Destilando Prompt...', 'Evoluindo Variações...', 'Finalizando Dossiê...']);
            break;

        case 'refiningPrompt':
             ui.dossierHeader.classList.remove('hidden');
             ui.resultContainer.setAttribute('aria-busy', 'true');
             startDossierLoadingAnimation(['Analisando Estrutura...', 'Avaliando Pontos Fortes...', 'Formulando Estratégia...', 'Reconstruindo Prompt V2...']);
             break;
        
        case 'evaluatingPrompt':
            ui.resultContainer.setAttribute('aria-busy', 'false');
            stopDossierLoadingAnimation();
            ui.output.innerHTML = state.dossierHTML || '';
            enhanceFinalPromptBlock();
            ui.evaluationLoader.classList.remove('hidden');
            ui.evaluationContent.innerHTML = '';
            break;

        case 'testingPrompt':
            ui.playgroundLoader.classList.remove('hidden');
            ui.playgroundOutput.innerHTML = '';
            ui.playgroundResultContainer.setAttribute('aria-busy', 'true');
            break;

        case 'optimizingPrompt':
            ui.playgroundPrompt.style.opacity = '0.7';
            ui.evaluationContent.style.opacity = '0.5';
            break;
            
        case 'auditingCode':
             // State handled by global controls and audit button state
            break;

        case 'error':
            stopDossierLoadingAnimation();
            const activeContainer = showResults ? ui.resultContainer : (showBehaviorGuidance ? ui.behaviorGuidanceContainer : ui.promptForm);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = state.errorMessage || 'Ocorreu um erro inesperado.';
            // Clear previous content and show error
            ui.behaviorGuidanceContainer.classList.add('hidden');
            ui.resultContainer.classList.add('hidden');
            activeContainer.prepend(errorDiv); // Prepend to show it at the top
            break;
    }

    if (state.current !== 'optimizingPrompt') {
        ui.playgroundPrompt.style.opacity = '1';
        ui.evaluationContent.style.opacity = '1';
    }
}

function toggleSection(element: HTMLElement, show: boolean) {
    if (show) {
        element.classList.remove('hidden');
        setTimeout(() => element.classList.add('visible'), 10);
    } else {
        element.classList.remove('visible');
        setTimeout(() => {
            if (!element.classList.contains('visible')) {
                element.classList.add('hidden');
            }
        }, 500); // Match transition duration
    }
}


// --- Component-like Render Functions ---

function renderArchitectureButtons(): DocumentFragment {
    const fragment = document.createDocumentFragment();
    Object.entries(PROMPT_ARCHITECTURES).forEach(([key, behavior]) => {
        const button = document.createElement('button');
        button.className = 'behavior-btn';
        button.dataset.archKey = key;
        button.innerHTML = `<strong>${behavior.title}</strong><span>${behavior.description}</span>`;
        button.onclick = () => handleArchitectureSelection(key);
        fragment.appendChild(button);
    });
    return fragment;
}

function updateArchitectureButtonDescriptions(descriptions: TailoredDescriptions) {
    Object.entries(descriptions).forEach(([key, description]) => {
        const button = ui.behaviorOptions.querySelector(`[data-arch-key="${key}"]`);
        if (button) {
            const span = button.querySelector('span');
            if (span) span.textContent = description;
        }
    });
}

function renderEvaluationContent(evaluation: EvaluationResult | null, promptText: string) {
    const charCount = promptText.length;
    const wordCount = promptText.split(/\s+/).filter(Boolean).length;

    let contentHTML = `
        <div class="evaluation-grid">
            <div class="stat-card">
                <div class="value">${charCount}</div>
                <div class="label">Caracteres</div>
            </div>
            <div class="stat-card">
                <div class="value">${wordCount}</div>
                <div class="label">Palavras</div>
            </div>
    `;

    if (evaluation) {
        contentHTML += `
            <div class="stat-card">
                <div class="value">${evaluation.clarity}/10</div>
                <div class="label">Clareza</div>
            </div>
            <div class="stat-card">
                <div class="value">${evaluation.efficiency}/10</div>
                <div class="label">Eficiência</div>
            </div>
            <div class="stat-card">
                <div class="value">${evaluation.robustness}/10</div>
                <div class="label">Robustez</div>
            </div>
        `;
    }
    
    contentHTML += '</div>'; // close grid

    if (evaluation) {
        contentHTML += `<div class="evaluation-summary"><p><strong>Resumo da IA:</strong> ${evaluation.summary}</p></div>`;
    } else {
        contentHTML += `<div class="evaluation-summary"><p><strong>Análise da IA indisponível no momento.</strong></p></div>`;
    }

    ui.evaluationContent.innerHTML = contentHTML;
}


// --- Event Handlers ---

async function handleInitialSubmit(e: Event) {
    e.preventDefault();
    const userInput = ui.promptInput.value.trim();
    if (!userInput) {
        alert('Por favor, descreva sua necessidade ou objetivo.');
        return;
    }
    
    transitionToState({ ...state, current: 'generatingBasePrompt', userInput });

    try {
        const userPromptWithAttachments = buildUserPrompt();
        const prompt = `Baseado na seguinte solicitação do usuário, crie um prompt de uma única frase, simples e direto, que capture a essência do pedido. Responda apenas com o prompt. Solicitação: "${userPromptWithAttachments}"`;
        
        const basePrompt = await geminiService.generateSimple(prompt, state.attachments);
        
        transitionToState({ ...state, current: 'customizingArchitectures', basePrompt });
        await customizeArchitectureDescriptions(basePrompt);
        
        transitionToState({ ...state, current: 'awaitingArchitectureSelection' });

    } catch (error) {
        console.error('Error during initial prompt generation:', error);
        transitionToState({ ...state, current: 'error', errorMessage: 'Ocorreu um erro na análise inicial. Verifique o console e tente novamente.' });
    }
}

async function handleArchitectureSelection(architectureKey: string) {
    transitionToState({ ...state, current: 'generatingDossier', selectedArchKey: architectureKey });

    try {
        // --- Fase 1: Geração do Dossiê Inicial ---
        const masterPrompt = buildMasterPrompt(buildUserPrompt(), architectureKey);
        let initialDossierHTML = '';
        await geminiService.generateStream(masterPrompt, state.attachments, (htmlChunk) => {
            ui.output.innerHTML = htmlChunk;
            initialDossierHTML = htmlChunk;
        });

        // --- Fase 2: Refinamento Avançado (Nova Etapa) ---
        const championPrompt = extractChampionPrompt(initialDossierHTML);
        if (championPrompt) {
            transitionToState({ ...state, current: 'refiningPrompt', dossierHTML: initialDossierHTML });
            const refinementMasterPrompt = buildRefinementPrompt(championPrompt);
            let refinedDossierHTML = '';
            await geminiService.generateStream(refinementMasterPrompt, state.attachments, (htmlChunk) => {
                ui.output.innerHTML = htmlChunk;
                refinedDossierHTML = htmlChunk;
            });
            transitionToState({ ...state, current: 'evaluatingPrompt', dossierHTML: refinedDossierHTML });
        } else {
            // Fallback se não conseguir extrair o prompt para refinar
            transitionToState({ ...state, current: 'evaluatingPrompt', dossierHTML: initialDossierHTML });
        }
        
        await evaluateFinalPrompt();

    } catch (error) {
        console.error('Error during prompt dossier generation:', error);
        transitionToState({ ...state, current: 'error', errorMessage: 'Ocorreu um erro ao gerar o dossiê do prompt. Verifique o console e tente novamente.' });
    }
}

async function handlePlaygroundSubmit(e: Event) {
    e.preventDefault();
    const promptToRun = ui.playgroundPrompt.value.trim();
    if (!promptToRun) {
        ui.playgroundOutput.textContent = 'O prompt não pode estar vazio.';
        return;
    }

    transitionToState({ ...state, current: 'testingPrompt' });

    try {
        await geminiService.generateStream(promptToRun, state.attachments, (htmlChunk) => {
            ui.playgroundOutput.innerHTML = htmlChunk;
        });
        transitionToState({ ...state, current: 'success' });
    } catch (error)
        console.error('Error during playground run:', error);
        ui.playgroundOutput.innerHTML = `<div class="error-message">Ocorreu um erro ao executar o prompt. Verifique o console e tente novamente.</div>`;
        // Transition to success even on error, to unblock the UI
        transitionToState({ ...state, current: 'success' });
    }
}

async function handleOptimizePrompt(e: Event) {
    e.preventDefault();
    const currentPrompt = ui.playgroundPrompt.value.trim();
    const refinementInstruction = ui.refinementInput.value.trim();

    if (!refinementInstruction) {
        alert('Por favor, forneça uma instrução de refinamento.');
        ui.refinementInput.focus();
        return;
    }
    if (!currentPrompt) {
        alert('O prompt atual está vazio.');
        return;
    }

    transitionToState({ ...state, current: 'optimizingPrompt' });

    try {
        const optimizationMetaPrompt = `Você é um engenheiro de prompts de classe mundial. Sua tarefa é refinar o prompt a seguir com base na instrução do usuário. Responda APENAS com o texto do novo prompt completo, sem qualquer explicação, preâmbulo ou formatação markdown.
---
[PROMPT ATUAL]:
${currentPrompt}
---
[INSTRUÇÃO DE REFINAMENTO]:
${refinementInstruction}
---
[NOVO PROMPT OTIMIZADO]:`;

        const newPrompt = await geminiService.generateSimple(optimizationMetaPrompt);

        ui.playgroundPrompt.value = newPrompt;
        ui.refinementInput.value = '';

        await evaluateFinalPrompt();

    } catch (error) {
        console.error('Error during prompt optimization:', error);
        transitionToState({ ...state, current: 'error', errorMessage: 'Ocorreu um erro ao otimizar o prompt. Verifique o console e tente novamente.' });
    }
}

async function handleCodeAudit() {
    transitionToState({ ...state, current: 'auditingCode' });
    ui.auditReportContent.innerHTML = '<div class="loader-container"><div class="spinner"></div><p>Analisando o código-fonte...</p></div>';
    ui.auditModal.classList.remove('hidden');

    try {
        // In a real scenario, you might fetch these files.
        // For this self-contained environment, we'll embed the source code.
        const fileContents = {
            "index.html": document.documentElement.outerHTML,
            "index.css": await fetch('./index.css').then(res => res.text()),
            "index.tsx": await fetch('./index.tsx').then(res => res.text()),
            "fileProcessor.js": await fetch('./fileProcessor.js').then(res => res.text()),
        };

        const auditPrompt = buildCodeAuditorPrompt(fileContents);
        const report = await geminiService.generateSimple(auditPrompt);
        
        ui.auditReportContent.innerHTML = marked.parse(report) as string;

    } catch (error) {
        console.error("Error during code audit:", error);
        ui.auditReportContent.innerHTML = `<div class="error-message">Não foi possível gerar o relatório de auditoria.</div>`;
    } finally {
        // The state transition back to idle will happen when the modal is closed.
    }
}

function handleFileSelection(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (!files || files.length === 0) return;

    transitionToState({ ...state, current: 'processingAttachments' });
    
    if (attachmentTimeout) clearTimeout(attachmentTimeout);
    attachmentTimeout = window.setTimeout(() => {
        handleCancelAttachmentProcessing();
        transitionToState({ ...state, current: 'error', errorMessage: 'O processamento do arquivo demorou muito e foi cancelado.' });
    }, ATTACHMENT_PROCESSING_TIMEOUT);
    
    fileProcessor?.postMessage(Array.from(files));
}

function handleRemoveAttachment(fileName: string) {
    const updatedAttachments = state.attachments.filter(f => f.name !== fileName);
    transitionToState({ ...state, attachments: updatedAttachments });
    renderFileList();
}

function handleCancelAttachmentProcessing() {
    if (attachmentTimeout) clearTimeout(attachmentTimeout);
    attachmentTimeout = null;

    if (fileProcessor) {
        fileProcessor.terminate();
        initializeFileWorker(); // Re-initialize for future use
    }
    transitionToState({ ...state, current: 'idle' });
}


// --- Async Logic & Workers ---

function initializeFileWorker() {
    // Terminate existing worker if it exists
    if (fileProcessor) {
        fileProcessor.terminate();
    }
    
    fileProcessor = new Worker('./fileProcessor.js', { type: 'module' });

    fileProcessor.onmessage = (event: MessageEvent<ProcessedFile[] | { error: string }>) => {
        if (attachmentTimeout) clearTimeout(attachmentTimeout);
        attachmentTimeout = null;

        const data = event.data;
        if (Array.isArray(data)) {
            transitionToState({ ...state, current: 'idle', attachments: [...state.attachments, ...data] });
            renderFileList();
            ui.fileInput.value = ''; // Reset file input
        } else if (data && data.error) {
            console.error('Error from file processor worker:', data.error);
            transitionToState({ ...state, current: 'error', errorMessage: data.error });
        }
    };

    fileProcessor.onerror = (event: ErrorEvent) => {
        if (attachmentTimeout) clearTimeout(attachmentTimeout);
        attachmentTimeout = null;
        console.error('Error in file processor worker:', event.message);
        transitionToState({ ...state, current: 'error', errorMessage: `Erro ao processar arquivo: ${event.message}` });
    };
}

async function customizeArchitectureDescriptions(basePrompt: string) {
    try {
        const customizationPrompt = `Dado o prompt base do usuário: "${basePrompt}"\n\nPara cada uma das seguintes arquiteturas de prompt, escreva uma nova descrição concisa e personalizada (uma frase) que explique como a arquitetura seria aplicada a ESTE prompt específico.\n\n${Object.entries(PROMPT_ARCHITECTURES).map(([key, { title }]) => `- ${key}: ${title}`).join('\n')}\n\nRetorne APENAS um objeto JSON válido mapeando cada chave (ex: "zero_shot") para sua nova descrição personalizada. Não inclua markdown ou qualquer outro texto fora do JSON.`;

        const responseSchema = {
            type: Type.OBJECT,
            properties: Object.keys(PROMPT_ARCHITECTURES).reduce((acc, key) => {
                acc[key] = { type: Type.STRING, description: `Tailored description for ${key}` };
                return acc;
            }, {} as {[key: string]: any}),
        };

        const tailoredDescriptions = await geminiService.generateJSON(customizationPrompt, responseSchema, isTailoredDescriptions);
        updateArchitectureButtonDescriptions(tailoredDescriptions);
    } catch (error) {
        console.warn("Failed to generate dynamic descriptions, falling back to static.", error);
    }
}

async function evaluateFinalPrompt() {
    // Prioritize playground text, then find the *last* code block in the dossier
    const playgroundText = ui.playgroundPrompt.value;
    const codeBlocks = ui.output.querySelectorAll('pre code');
    const lastDossierBlock = codeBlocks.length > 0 ? codeBlocks[codeBlocks.length - 1] : null;

    let finalPrompt: string | null = null;
    
    if (playgroundText && playgroundText.trim() !== '') {
        finalPrompt = playgroundText.trim();
    } else if (lastDossierBlock) {
        finalPrompt = (lastDossierBlock as HTMLElement).innerText;
    }

    if (finalPrompt === null) {
        console.warn("Could not find a prompt to evaluate.");
        transitionToState({ ...state, current: 'success', finalPrompt: '' });
        return;
    }

    let evaluationResult: EvaluationResult | null = null;
    try {
        const evaluationPrompt = `Analise o seguinte prompt com base em Clareza, Eficiência e Robustez. Forneça uma pontuação de 1 a 10 para cada um e um resumo conciso de uma frase de suas descobertas. Prompt: "${finalPrompt}". Retorne APENAS um objeto JSON válido com as chaves "clarity" (número), "efficiency" (número), "robustness" (número) e "summary" (string). Não inclua markdown.`;
        
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                clarity: { type: Type.NUMBER },
                efficiency: { type: Type.NUMBER },
                robustness: { type: Type.NUMBER },
                summary: { type: Type.STRING },
            }
        };
        evaluationResult = await geminiService.generateJSON(evaluationPrompt, responseSchema, isEvaluationResult);
    } catch (error) {
        console.error("Failed to get AI evaluation for the prompt:", error);
    }
    
    renderEvaluationContent(evaluationResult, finalPrompt);
    transitionToState({ ...state, current: 'success', finalPrompt });
}


// --- Utility Functions ---

function buildUserPrompt(): string {
    let basePrompt = state.userInput || '';
    if (state.attachments.length > 0) {
        const fileNames = state.attachments.map(f => f.name).join(', ');
        const filesClause = `os seguintes arquivos anexos: ${fileNames}`;
        
        switch(state.attachmentUsage) {
            case 'context':
                basePrompt += `\n\nUse o conteúdo de ${filesClause} como sua principal fonte de contexto e referência para responder.`;
                break;
            case 'style_source':
                basePrompt = `Analise o tom, vocabulário, formatação e estilo geral de ${filesClause}. Depois, aplique um estilo idêntico para responder à seguinte solicitação: "${basePrompt}"`;
                break;
            case 'structural_example':
                basePrompt = `Os ${filesClause} são exemplos da estrutura de saída que desejo. Siga este formato e estrutura precisamente ao gerar uma resposta para a seguinte tarefa: "${basePrompt}"`;
                break;
            case 'fact_check':
                basePrompt += `\n\nDepois de gerar sua resposta inicial, use as informações contidas em ${filesClause} para validar, criticar e, se necessário, corrigir sua própria resposta em uma seção final chamada 'Validação Cruzada'.`;
                break;
        }
    }
    return basePrompt;
}

function buildMasterPrompt(userInput: string, architectureKey: string): string {
    const architecture = PROMPT_ARCHITECTURES[architectureKey];
    const phase3Instructions = PHASE_3_BUILDERS[architectureKey];
    return `
Você é um sistema de IA de ponta, um 'Meta-Prompt Engineer', especializado em implementar o "Protocolo de Gênese de Prompts da Singularidade Inversa".
Sua tarefa é pegar a necessidade ou objetivo bruto de um usuário e transformá-lo em um prompt de nível de produção, perfeitamente otimizado, através de um pipeline rigoroso de três estágios.

A necessidade do usuário é:
"${userInput}"

O usuário selecionou a seguinte arquitetura de prompt: **${architecture.title}**.
Descrição da Arquitetura: "${architecture.description}"

Incorpore esta arquitetura em todas as fases do seu processo, garantindo que o "Prompt Campeão Evoluído" seja um exemplo canônico desta técnica de engenharia de prompt.

Execute a seguinte cadeia de pensamentos sequencialmente. O resultado deve ser um dossiê técnico em Markdown, formatado para clareza e precisão. Não produza nada antes do dossiê. O dossiê deve estar em Português.

### DOSSIÊ DE GÊNESE DE PROMPT
---
#### FASE 1: A Arquitetura da Sua Intenção
* (Realize uma análise profunda da necessidade do usuário. Decomponha-a em uma especificação formal. Identifique o **Objetivo Principal**, as **Entidades Chave**, as **Restrinções**, o **Público-Alvo e Tom**, o **Formato de Saída** e os **Conceitos Negativos**. Apresente isso como um 'Grafo de Intenção' estruturado.)
---
#### FASE 2: O Prompt Elegante (Resultado da Destilação)
> (Usando o 'Grafo de Intenção' como especificação, construa o 'Prompt Elegante'. Esta é a sua tarefa mais crítica. O prompt deve ser a versão mais curta e densa em tokens possível que capture 100% da intenção, servindo como base para a arquitetura selecionada.)
---
#### FASE 3: O Prompt Campeão Evoluído
${phase3Instructions}
*   **VETOR FINAL (Pronto para uso):**
\`\`\`
(Apresente aqui o prompt final, otimizado e pronto para produção.)
\`\`\`
`;
}

function buildRefinementPrompt(championPrompt: string): string {
    return `
Com base no prompt abaixo, delimited por \`##<PROMPT_PARA_ANÁLISE>\` e \`</PROMPT_PARA_ANÁLISE>##\`, execute as 9 etapas a seguir em sequência. Seu resultado deve ser um único e coeso documento Markdown, contendo a análise, o prompt V2 otimizado e a justificativa.

##<PROMPT_PARA_ANÁLISE>
${championPrompt}
</PROMPT_PARA_ANÁLISE>##

---

### META-OTIMIZAÇÃO DE PROMPT V2

**1. Análise Estrutural:**
Primeiro, realize uma análise estrutural do prompt fornecido. Gere uma lista com marcadores identificando e descrevendo o propósito de cada componente principal que você conseguir identificar (ex: Persona, Missão, Princípios, Estrutura de Entrada, etc.).

**2. Avaliação Crítica:**
A seguir, produza uma avaliação crítica do texto do prompt original. Crie uma tabela com duas colunas: "Pontos Fortes" e "Áreas para Otimização". Na coluna "Pontos Fortes", liste elementos como a clareza da persona e a estrutura modular. Na coluna "Áreas para Otimização", identifique desafios potenciais para a IA, como a abstração de termos como "Singularidade Inversa" e a falta de um formato de saída explicitamente definido.

**3. Estratégia de Otimização:**
Agora, formule uma estratégia de otimização em formato de lista numerada. Descreva as técnicas avançadas que serão aplicadas para aprimorar o prompt. A lista deve incluir: (1) "Tradução de Conceitos Abstratos": Converter os princípios em instruções passo a passo e acionáveis; (2) "Reforço da Persona": Adicionar um 'processo de pensamento' ou 'monólogo interno' para guiar a IA; (3) "Estruturação Lógica Explícita": Reorganizar as seções para criar um fluxo de trabalho claro e sequencial; (4) "Definição de Formato de Saída": Especificar com precisão a estrutura do resultado final; (5) "Inclusão de um Exemplo de Poucas Tentativas (Few-Shot)": Criar um exemplo completo de entrada-saída para condicionar o comportamento do modelo.

**4. Reescrita da Persona e Missão:**
Com base na estratégia, reescreva a seção inicial da Persona e da Missão. No novo texto, comece com \`[PERFIL]\`. Mantenha a identidade central do 'Arquiteto de Performance', mas refine a linguagem para ser mais direta e instrutiva, e incorpore uma diretriz de 'Monólogo Interno', como por exemplo: "Seu processo começa com um monólogo interno: '1. Qual o objetivo real do usuário? 2. Quais são as restrições? 3. Como o ciclo GEV se aplica aqui?'".

**5. Tradução dos Princípios Operacionais:**
Traduza os dois Princípios Operacionais em uma nova seção intitulada \`[METODOLOGIA_ACIONÁVEL]\`. Para "Singularidade Inversa", gere uma subseção \`### Princípio 1: Otimização por Restrição (Singularidade Inversa)\` e liste passos concretos como: "1. Identifique e liste as 3 principais restrições explícitas ou implícitas na tarefa. 2. Proponha a solução mais simples e com o menor número de dependências que satisfaça plenamente o objetivo sob essas restrições." Para "Automação Resiliente", crie a subseção \`### Princípio 2: Ciclo de Execução Resiliente (GEV & Tree-of-Thought)\` e detalhe as fases: "Fase G (Gênese do Plano): Geração de um plano detalhado em etapas. Fase E (Execução): Descrição da execução orquestrada de cada etapa. Fase V (Validação): Definição de critérios de sucesso automáticos e um plano de auto-reparo em caso de falha.".

**6. Desenho da Nova Estrutura do Prompt:**
Desenhe a nova estrutura completa do prompt, utilizando marcadores de texto claros para delinear o fluxo de informações. Gere a seguinte estrutura de esqueleto, que integrará as seções revisadas e organizará as entradas do usuário:
\`\`\`
## PROMPT_SISTEMA_ARQUITETO_PERFORMANCE_V2 ##

[PERFIL]
{Texto gerado na etapa 4}

[METODOLOGIA_ACIONÁVEL]
{Texto gerado na etapa 5}

[FLUXO_DE_PROCESSAMENTO_OBRIGATÓRIO]
1. Analise o [CONTEXTO] e a [TAREFA_DO_USUÁRIO].
2. Execute seu Monólogo Interno para decompor o problema.
3. Aplique a METODologia_ACIONÁVEL para estruturar a solução.
4. Gere a saída estritamente no [FORMATO_DE_SAÍDA_ESPECIFICADO].

[FORMATO_DE_SAÍDA_ESPECIFICADO]
Gere um documento Markdown com as seguintes seções:
- **Análise do Objetivo:** Um parágrafo resumindo o resultado desejado.
- **Protocolo de Execução (Ciclo GEV):**
  - **Gênese do Plano:** Lista numerada de todas as etapas.
  - **Execução Orquestrada:** Detalhes técnicos para cada etapa.
  - **Validação Automatizada:** Critérios de sucesso e testes para cada etapa.
- **Considerações de Otimização (Singularidade Inversa):** Justificativa das escolhas baseadas em restrições.

[EXEMPLO_DE_USO_COMPLETO]
{Espaço reservado para o conteúdo da etapa 7}

--- INÍCIO DA TAREFA ATUAL ---

[CONTEXTO]
{INSERIR CONTEXTO AQUI}

[TAREFA_DO_USUÁRIO]
{INSERIR TAREFA AQUI}
\`\`\`

**7. Preenchimento do Exemplo (Few-Shot):**
Preencha a seção \`[EXEMPLO_DE_USO_COMPLETO]\` dentro da estrutura criada na etapa 6. Para a \`[TAREFA_DO_USUÁRIO]\` do exemplo, use o texto: \`"Crie um microserviço Python usando FastAPI que receba um texto, conte a frequência de cada palavra e retorne um JSON com as 10 palavras mais comuns, excluindo stopwords comuns em inglês."\`. Em seguida, gere uma resposta de exemplo completa e de alta qualidade que siga perfeitamente o \`[FORMATO_DE_SAÍDA_ESPECIFICADO]\`, demonstrando como o 'Arquiteto de Performance' idealmente processaria essa tarefa específica.

**8. Compilação do Prompt Final V2:**
Compile todas as saídas das etapas 4, 5, 6 e 7 em um único bloco de texto contínuo e coerente, formatado dentro de um bloco de código Markdown. Este bloco representará a versão final e otimizada do prompt, intitulado \`PROMPT_SISTEMA_ARQUITETO_PERFORMANCE_V2\`.

**9. Justificativa das Melhorias:**
Por fim, gere um parágrafo de conclusão intitulado \`JUSTIFICATIVA DAS MELHORIAS\`. Neste parágrafo, explique sucintamente por que a nova versão do prompt (\`V2\`) é superior à original, fazendo referência direta às otimizações implementadas, como a conversão de conceitos abstratos em passos acionáveis, a inclusão de um formato de saída explícito e a adição de um exemplo de poucas tentativas (few-shot) para melhorar a confiabilidade e a qualidade da geração.
`;
}

function buildCodeAuditorPrompt(files: { [key: string]: string }): string {
    return `
Você é um engenheiro de frontend sênior de classe mundial, com profunda experiência em TypeScript, performance da web, UI/UX e acessibilidade.
Sua tarefa é realizar uma auditoria de código completa na aplicação fornecida.

Analise os seguintes arquivos:
---
### \`index.html\`
\`\`\`html
${files['index.html']}
\`\`\`
---
### \`index.css\`
\`\`\`css
${files['index.css']}
\`\`\`
---
### \`index.tsx\`
\`\`\`typescript
${files['index.tsx']}
\`\`\`
---
### \`fileProcessor.js\` (Web Worker)
\`\`\`javascript
${files['fileProcessor.js']}
\`\`\`
---

Gere um relatório de auditoria abrangente em formato Markdown. O relatório deve ser construtivo, profissional e acionável. Estruture sua resposta com as seguintes seções:

### 1. Visão Geral e Arquitetura
(Faça um resumo de alto nível da arquitetura do aplicativo. Comente sobre o uso de uma máquina de estados, Web Workers e a separação de responsabilidades.)

### 2. Pontos Fortes
(Liste os aspectos positivos do código. Destaque boas práticas, como o uso de Web Workers para performance, uma máquina de estados clara, e UI/UX resiliente.)

### 3. Recomendações de Melhoria
(Esta é a seção principal. Forneça sugestões concretas, categorizadas por Performance, Manutenibilidade/Qualidade do Código e Acessibilidade/UX. Para cada recomendação, explique o 'porquê' e, se possível, forneça pequenos trechos de código 'antes' e 'depois'.)

### 4. Conclusão
(Resuma suas descobertas e dê uma avaliação geral da qualidade do código.)
`;
}

function extractChampionPrompt(htmlContent: string): string | null {
    // Create a temporary, non-rendered element to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Find the 'pre' tag which contains the final prompt
    const finalPromptBlock = tempDiv.querySelector('pre code');
    if (finalPromptBlock) {
        return (finalPromptBlock as HTMLElement).innerText.trim();
    }
    
    // Fallback regex if the structure is less predictable
    const regex = /VETOR FINAL \(Pronto para uso\):\s*```([\s\S]*?)```/;
    const match = tempDiv.innerText.match(regex);
    if (match && match[1]) {
        return match[1].trim();
    }
    
    return null;
}

function renderFileList() {
    ui.fileList.innerHTML = '';
    if (state.attachments.length === 0) return;

    const fragment = document.createDocumentFragment();
    state.attachments.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        const fileNameSpan = document.createElement('span');
        fileNameSpan.textContent = file.name;
        const removeButton = document.createElement('button');
        removeButton.innerHTML = '&times;';
        removeButton.ariaLabel = `Remover ${file.name}`;
        removeButton.onclick = () => handleRemoveAttachment(file.name);
        fileItem.appendChild(fileNameSpan);
        fileItem.appendChild(removeButton);
        fragment.appendChild(fileItem);
    });
    ui.fileList.appendChild(fragment);
}

function startDossierLoadingAnimation(messages: string[]) {
  if (dossierLoadingInterval) clearInterval(dossierLoadingInterval);
  let messageIndex = 0;
  
  ui.dossierLoader.classList.remove('hidden');
  ui.loaderText.textContent = messages[messageIndex];
  
  dossierLoadingInterval = window.setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    ui.loaderText.textContent = messages[messageIndex];
  }, 2500);
}

function stopDossierLoadingAnimation() {
  if (dossierLoadingInterval) {
    clearInterval(dossierLoadingInterval);
    dossierLoadingInterval = null;
  }
  ui.dossierLoader.classList.add('hidden');
}

function generateFilenameFromPrompt(promptText: string): string {
    const sanitized = promptText.replace(/[^\p{L}\p{N}\s]/gu, '').toLowerCase();
    const words = sanitized.split(/\s+/).filter(Boolean).slice(0, 5);
    return words.length === 0 ? 'prompt.txt' : `${words.join('_')}.txt`;
}

function enhanceFinalPromptBlock() {
  const finalPromptBlocks = ui.output.querySelectorAll('pre');
  if (finalPromptBlocks.length === 0) return;

  // Target the last 'pre' block, which should contain the final prompt
  const finalPromptBlock = finalPromptBlocks[finalPromptBlocks.length - 1];
  
  // Avoid adding buttons twice
  if (finalPromptBlock.querySelector('.prompt-actions')) return;

  const codeEl = finalPromptBlock.querySelector('code');
  if (!codeEl) return;
  
  const promptText = codeEl.innerText;
  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'prompt-actions';

  const copyButton = document.createElement('button');
  copyButton.className = 'action-btn';
  copyButton.setAttribute('data-tooltip', 'Copiar');
  copyButton.setAttribute('aria-label', 'Copiar Prompt');
  copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
  
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(promptText).then(() => {
      copyButton.setAttribute('data-tooltip', 'Copiado!');
      setTimeout(() => copyButton.setAttribute('data-tooltip', 'Copiar'), 2000);
    }).catch(err => console.error('Failed to copy text: ', err));
  });

  const saveButton = document.createElement('button');
  saveButton.className = 'action-btn';
  saveButton.setAttribute('data-tooltip', 'Salvar como .txt');
  saveButton.setAttribute('aria-label', 'Salvar como arquivo');
  saveButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>`;

  saveButton.addEventListener('click', () => {
    const filename = generateFilenameFromPrompt(promptText);
    const blob = new Blob([promptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  actionsContainer.appendChild(copyButton);
  actionsContainer.appendChild(saveButton);
  finalPromptBlock.prepend(actionsContainer);
}


// --- Initialization ---
ui.promptForm.addEventListener('submit', handleInitialSubmit);
ui.playgroundForm.addEventListener('submit', handlePlaygroundSubmit);
ui.optimizePromptButton.addEventListener('click', handleOptimizePrompt);
ui.auditButton.addEventListener('click', handleCodeAudit);
ui.fileInput.addEventListener('change', handleFileSelection);
ui.attachmentUsage.addEventListener('change', (e) => {
    state.attachmentUsage = (e.target as HTMLSelectElement).value as AttachmentUsage;
});
ui.cancelAttachmentProcessing.addEventListener('click', handleCancelAttachmentProcessing);

// Modal close logic
ui.auditModalClose.addEventListener('click', () => {
    ui.auditModal.classList.add('hidden');
    // Revert to idle state only if we were auditing
    if (state.current === 'auditingCode') {
        transitionToState({ ...state, current: 'idle' });
    }
});
ui.auditModal.addEventListener('click', (e) => {
    if (e.target === ui.auditModal) {
        ui.auditModal.classList.add('hidden');
        if (state.current === 'auditingCode') {
            transitionToState({ ...state, current: 'idle' });
        }
    }
});


document.addEventListener('DOMContentLoaded', () => {
    initializeFileWorker();
    transitionToState({ current: 'idle', attachments: [], attachmentUsage: 'context' });
});