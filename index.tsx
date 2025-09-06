/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';

// --- Constants ---
const PROMPT_ARCHITECTURES: { [key: string]: { title: string, description: string } } = {
  zero_shot: { title: 'Zero-Shot Direto', description: 'Executa a tarefa diretamente, confiando na capacidade inata do modelo. Ideal para tarefas simples e bem definidas.' },
  few_shot: { title: 'Few-Shot com Exemplos', description: 'Fornece 2-3 exemplos (entrada/saída) para guiar o modelo a um formato ou estilo de resposta específico.' },
  chain_of_thought: { title: 'Cadeia de Pensamento (CoT)', description: 'Instrui o modelo a "pensar passo a passo" para decompor problemas complexos, aumentando a precisão.' },
  react: { title: 'Agente Simulado (ReAct)', description: 'Estrutura o prompt para que a IA emule um ciclo de "Pensamento, Ação, Observação" para planejamento.' },
  rag: { title: 'Geração Aumentada por Recuperação (RAG Simulado)', description: 'Simula a arquitetura RAG, incluindo um placeholder para "Contexto Recuperado" no prompt.' },
};

const PHASE_3_BUILDERS: { [key: string]: string } = {
    zero_shot: `*   **Análise Evolutiva:** (O 'Prompt Elegante' já é uma forma de Zero-Shot. Refine-o adicionando clareza e diretivas explícitas. Gere duas mutações:
    *   **Mutação 1 (Adição de Persona):** Incorpore uma persona de especialista (ex: 'Aja como um historiador...') para focar o conhecimento do modelo.
    *   **Mutação 2 (Formatação de Saída Explícita):** Adicione instruções claras sobre o formato de saída desejado (ex: 'Responda em JSON com as chaves "titulo" e "resumo"').
    *   **Seleção:** Justifique tecnicamente qual dos três prompts é o 'Campeão' com base na clareza e robustez para uma execução direta.)`,
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
    *   **Construção do Prompt Campeão:** Apresente o prompt final contendo o placeholder e a instrução de grounding, explicando como um sistema externo preencheria o contexto para responder à pergunta original do usuário.)`
};


// --- DOM Element Selection ---
const ui = {
    promptForm: document.getElementById('prompt-form') as HTMLFormElement,
    promptInput: document.getElementById('prompt-input') as HTMLTextAreaElement,
    generateButton: document.getElementById('generate-button') as HTMLButtonElement,
    
    behaviorGuidanceContainer: document.getElementById('behavior-guidance-container') as HTMLDivElement,
    initialPromptLoader: document.getElementById('initial-prompt-loader') as HTMLDivElement,
    initialPromptDisplay: document.getElementById('initial-prompt-display') as HTMLDivElement,
    initialPromptOutput: document.getElementById('initial-prompt-output') as HTMLQuoteElement,
    behaviorOptions: document.getElementById('behavior-options') as HTMLDivElement,

    resultContainer: document.getElementById('result-container') as HTMLDivElement,
    dossierHeader: document.getElementById('dossier-header') as HTMLDivElement,
    dossierLoader: document.getElementById('dossier-loader') as HTMLDivElement,
    loaderText: document.getElementById('loader-text') as HTMLParagraphElement,
    output: document.getElementById('output') as HTMLDivElement,

    playgroundContainer: document.getElementById('playground-container') as HTMLDivElement,
    playgroundForm: document.getElementById('playground-form') as HTMLFormElement,
    playgroundPrompt: document.getElementById('playground-prompt') as HTMLTextAreaElement,
    playgroundRunButton: document.getElementById('playground-run-button') as HTMLButtonElement,
    playgroundLoader: document.getElementById('playground-loader') as HTMLDivElement,
    playgroundOutput: document.getElementById('playground-output') as HTMLDivElement,
    playgroundResultContainer: document.getElementById('playground-result-container') as HTMLDivElement,
};

// --- State ---
let dossierLoadingInterval: number | null = null;
let ai: GoogleGenAI | null = null;


// --- Helper Functions ---

/**
 * Displays an error message in a specified container.
 * @param {string} message - The error message to display.
 * @param {HTMLElement} container - The container to display the error in.
 */
function displayError(message: string, container: HTMLElement) {
    container.innerHTML = `<div class="error-message">${message}</div>`;
}

/**
 * Streams a response from the Gemini API to a target element.
 * @param {string} prompt - The prompt to send to the API.
 * @param {HTMLElement} targetElement - The element to stream the response into.
 * @returns {Promise<string>} A promise that resolves with the full response text.
 */
async function streamResponse(prompt: string, targetElement: HTMLElement): Promise<string> {
    if (!ai) {
        throw new Error("AI client not initialized.");
    }
    const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    let fullResponse = '';
    for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        targetElement.innerHTML = marked.parse(fullResponse) as string;
    }
    return fullResponse;
}


/**
 * Constructs the master prompt for the Gemini API.
 * @param {string} userInput - The user's raw input.
 * @param {string} architectureKey - The architecture profile key.
 * @returns {string} The complete, advanced prompt for the AI.
 */
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


/**
 * Starts a cycling animation of loading messages for dossier generation.
 */
function startDossierLoadingAnimation() {
  const messages = ['Analisando Intenção...', 'Destilando Prompt...', 'Evoluindo Variações...', 'Finalizando Dossiê...'];
  let messageIndex = 0;
  
  ui.dossierLoader.classList.remove('hidden');
  ui.loaderText.textContent = messages[messageIndex];
  
  dossierLoadingInterval = window.setInterval(() => {
    messageIndex = (messageIndex + 1) % messages.length;
    ui.loaderText.textContent = messages[messageIndex];
  }, 2000);
}

/**
 * Stops the dossier loading animation.
 */
function stopDossierLoadingAnimation() {
  if (dossierLoadingInterval) {
    clearInterval(dossierLoadingInterval);
    dossierLoadingInterval = null;
  }
  ui.dossierLoader.classList.add('hidden');
}

/**
 * Generates a safe filename from the first few words of a prompt.
 * @param {string} promptText The text of the prompt.
 * @returns {string} A sanitized filename ending in .txt.
 */
function generateFilenameFromPrompt(promptText: string): string {
    const sanitized = promptText.replace(/[^\p{L}\p{N}\s]/gu, '').toLowerCase();
    const words = sanitized.split(/\s+/).filter(Boolean).slice(0, 5);
    if (words.length === 0) {
        return 'prompt.txt';
    }
    return `${words.join('_')}.txt`;
}

/**
 * Adds "Copy" and "Save" buttons to the final code block in the output.
 */
function enhanceFinalPromptBlock() {
  const finalPromptBlock = ui.output.querySelector('pre');
  if (!finalPromptBlock) return;

  const codeEl = finalPromptBlock.querySelector('code');
  if (!codeEl) return;
  
  const promptText = codeEl.innerText;

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'prompt-actions';

  // --- Copy Button ---
  const copyButton = document.createElement('button');
  copyButton.className = 'action-btn';
  copyButton.setAttribute('data-tooltip', 'Copiar');
  copyButton.setAttribute('aria-label', 'Copiar Prompt');
  copyButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
  
  copyButton.addEventListener('click', () => {
    navigator.clipboard.writeText(promptText).then(() => {
      copyButton.setAttribute('data-tooltip', 'Copiado!');
      setTimeout(() => {
        copyButton.setAttribute('data-tooltip', 'Copiar');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      copyButton.setAttribute('data-tooltip', 'Erro!');
    });
  });

  // --- Save Button ---
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


/**
 * Extracts the final prompt, populates the playground, and displays it.
 */
function setupPlayground() {
  const finalPromptBlock = ui.output.querySelector('pre code');
  if (finalPromptBlock) {
    const finalPromptText = (finalPromptBlock as HTMLElement).innerText;
    ui.playgroundPrompt.value = finalPromptText;
    ui.playgroundContainer.classList.remove('hidden');
    setTimeout(() => ui.playgroundContainer.classList.add('visible'), 10);
  } else {
    ui.playgroundContainer.classList.add('hidden');
    ui.playgroundContainer.classList.remove('visible');
    console.warn("Could not find the final prompt block to set up the playground.");
  }
}

/**
 * Resets the UI to its initial state before a new generation cycle.
 */
function resetUI() {
    ui.output.innerHTML = '';
    ui.playgroundOutput.innerHTML = '';
    
    // Use the 'visible' class to manage transitions
    ui.behaviorGuidanceContainer.classList.remove('visible');
    ui.resultContainer.classList.remove('visible');
    ui.playgroundContainer.classList.remove('visible');

    // Still use hidden for sub-elements that shouldn't transition
    ui.initialPromptDisplay.classList.add('hidden');
    ui.dossierHeader.classList.add('hidden');
}


/**
 * Handles the initial form submission to generate a base prompt.
 * @param {Event} e - The form submission event.
 */
async function handleInitialSubmit(e: Event) {
  e.preventDefault();
  const userInput = ui.promptInput.value.trim();
  if (!userInput) {
    alert('Por favor, descreva sua necessidade ou objetivo.');
    return;
  }
  
  console.log("Starting initial prompt generation for:", userInput);
  resetUI();
  ui.generateButton.disabled = true;
  ui.behaviorGuidanceContainer.classList.remove('hidden');
  setTimeout(() => ui.behaviorGuidanceContainer.classList.add('visible'), 10);

  ui.initialPromptLoader.classList.remove('hidden');
  ui.initialPromptDisplay.classList.add('hidden');


  try {
    if (!ai) ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Baseado na seguinte solicitação do usuário, crie um prompt de uma única frase, simples e direto, que capture a essência do pedido. Responda apenas com o prompt. Solicitação: "${userInput}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    const basePrompt = response.text.trim();

    ui.initialPromptOutput.textContent = basePrompt;
    
    ui.behaviorOptions.innerHTML = '';
    Object.entries(PROMPT_ARCHITECTURES).forEach(([key, behavior]) => {
        const button = document.createElement('button');
        button.className = 'behavior-btn';
        button.innerHTML = `<strong>${behavior.title}</strong><span>${behavior.description}</span>`;
        button.onclick = () => handleArchitectureSelection(userInput, key);
        ui.behaviorOptions.appendChild(button);
    });

    ui.initialPromptLoader.classList.add('hidden');
    ui.initialPromptDisplay.classList.remove('hidden');

  } catch (error) {
    console.error('Error during initial prompt generation:', error);
    displayError('Ocorreu um erro na análise inicial. Verifique o console e tente novamente.', ui.behaviorGuidanceContainer);
  } finally {
      ui.generateButton.disabled = false;
  }
}

/**
 * Handles the user's selection of a prompt architecture.
 * @param {string} userInput - The original user input.
 * @param {string} architectureKey - The key of the selected architecture.
 */
async function handleArchitectureSelection(userInput: string, architectureKey: string) {
    console.log(`Architecture selected: ${architectureKey}`);
    
    // Start transition
    ui.behaviorGuidanceContainer.classList.remove('visible');
    ui.resultContainer.classList.remove('hidden');
    setTimeout(() => ui.resultContainer.classList.add('visible'), 10);
    
    ui.dossierHeader.classList.remove('hidden');
    ui.resultContainer.setAttribute('aria-busy', 'true');
    startDossierLoadingAnimation();

    try {
        const masterPrompt = buildMasterPrompt(userInput, architectureKey);
        console.log("Generating dossier with master prompt:", masterPrompt);
        
        await streamResponse(masterPrompt, ui.output);

        enhanceFinalPromptBlock(); 
        setupPlayground();
        
    } catch (error) {
        console.error('Error during prompt dossier generation:', error);
        displayError('Ocorreu um erro ao gerar o dossiê do prompt. Verifique o console e tente novamente.', ui.output);
    } finally {
        stopDossierLoadingAnimation();
        ui.resultContainer.setAttribute('aria-busy', 'false');
    }
}


/**
 * Handles the playground form submission to test the generated prompt.
 * @param {Event} e - The form submission event.
 */
async function handlePlaygroundSubmit(e: Event) {
  e.preventDefault();
  const promptToRun = ui.playgroundPrompt.value.trim();
  if (!promptToRun) {
    ui.playgroundOutput.textContent = 'O prompt não pode estar vazio.';
    return;
  }

  console.log("Running prompt in playground:", promptToRun);
  ui.playgroundRunButton.disabled = true;
  ui.playgroundOutput.innerHTML = '';
  ui.playgroundLoader.classList.remove('hidden');
  ui.playgroundResultContainer.setAttribute('aria-busy', 'true');

  try {
    await streamResponse(promptToRun, ui.playgroundOutput);
  } catch (error) {
    console.error('Error during playground run:', error);
    displayError('Ocorreu um erro ao executar o prompt. Verifique o console e tente novamente.', ui.playgroundOutput);
  } finally {
    ui.playgroundLoader.classList.add('hidden');
    ui.playgroundRunButton.disabled = false;
    ui.playgroundResultContainer.setAttribute('aria-busy', 'false');
  }
}


// --- Event Listeners ---
ui.promptForm.addEventListener('submit', handleInitialSubmit);
ui.playgroundForm.addEventListener('submit', handlePlaygroundSubmit);
