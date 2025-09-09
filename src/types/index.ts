export interface FileProgressState {
    file: File;
    progress: number;
    error: string | null;
}

export interface ProcessedFile {
    name: string;
    mimeType: string;
    base64: string;
}

export interface LlamaMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface LlamaResponse {
    response: string;
    done: boolean;
    context?: number[];
}