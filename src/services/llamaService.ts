import { LlamaMessage, LlamaResponse } from '../types';

class LlamaService {
    private baseUrl: string = 'http://localhost:11434'; // Default Ollama URL
    private model: string = 'llama2'; // Default model, can be configurable

    constructor(baseUrl?: string, model?: string) {
        if (baseUrl) this.baseUrl = baseUrl;
        if (model) this.model = model;
    }

    async checkConnection(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch (error) {
            console.error('Failed to connect to LLaMA:', error);
            return false;
        }
    }

    async getAvailableModels(): Promise<string[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) throw new Error('Failed to fetch models');
            
            const data = await response.json();
            return data.models?.map((model: any) => model.name) || [];
        } catch (error) {
            console.error('Error fetching models:', error);
            return [];
        }
    }

    async generateResponse(messages: LlamaMessage[], includeFiles?: string[]): Promise<string> {
        try {
            // Convert messages to a single prompt for Ollama
            let prompt = messages.map(msg => {
                if (msg.role === 'system') return `System: ${msg.content}`;
                if (msg.role === 'user') return `User: ${msg.content}`;
                return `Assistant: ${msg.content}`;
            }).join('\n');

            // Add file context if available
            if (includeFiles && includeFiles.length > 0) {
                prompt += '\n\nFiles attached for analysis:\n' + includeFiles.join('\n');
            }

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`LLaMA API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.response || 'Nenhuma resposta recebida do modelo.';
        } catch (error) {
            console.error('Error generating response:', error);
            throw new Error(`Erro ao conectar com o LLaMA local: ${error.message}`);
        }
    }

    async generateStreamResponse(
        messages: LlamaMessage[], 
        onChunk: (chunk: string) => void,
        includeFiles?: string[]
    ): Promise<void> {
        try {
            let prompt = messages.map(msg => {
                if (msg.role === 'system') return `System: ${msg.content}`;
                if (msg.role === 'user') return `User: ${msg.content}`;
                return `Assistant: ${msg.content}`;
            }).join('\n');

            if (includeFiles && includeFiles.length > 0) {
                prompt += '\n\nFiles attached for analysis:\n' + includeFiles.join('\n');
            }

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error(`LLaMA API error: ${response.status} ${response.statusText}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Failed to get response reader');

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            if (data.response) {
                                onChunk(data.response);
                            }
                        } catch (e) {
                            console.warn('Failed to parse line:', line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in stream response:', error);
            throw error;
        }
    }

    setModel(model: string) {
        this.model = model;
    }

    setBaseUrl(url: string) {
        this.baseUrl = url;
    }
}

export default new LlamaService();