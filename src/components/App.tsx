import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import llamaService from '../services/llamaService';
import FileProgress from './FileProgress';
import { FileProgressState, ProcessedFile, LlamaMessage } from '../types';

// Supported MIME types for file uploads
const SUPPORTED_MIME_TYPES_STRING = [
    'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
    'audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac',
    'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gpp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/rtf',
    'text/plain',
    'text/csv',
].join(',');

const App: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [fileProgress, setFileProgress] = useState<Record<string, FileProgressState>>({});
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState('llama2');
    const [llamaUrl, setLlamaUrl] = useState('http://localhost:11434');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const workerRef = useRef<Worker | null>(null);

    // Check LLaMA connection on mount
    useEffect(() => {
        checkConnection();
        loadAvailableModels();
        
        // Set up periodic connection check
        const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [llamaUrl]);

    // Initialize file processing worker
    useEffect(() => {
        workerRef.current = new Worker('/fileProcessor.js');

        workerRef.current.onmessage = (event) => {
            const { type, payload } = event.data;
            switch (type) {
                case 'progress':
                    setFileProgress(prev => ({ 
                        ...prev, 
                        [payload.fileName]: { 
                            ...prev[payload.fileName], 
                            progress: payload.progress 
                        } 
                    }));
                    break;
                case 'complete':
                    setProcessedFiles(prev => [...prev, payload.file]);
                    setFileProgress(prev => ({ 
                        ...prev, 
                        [payload.file.name]: { 
                            ...prev[payload.file.name], 
                            progress: 100 
                        } 
                    }));
                    break;
                case 'error':
                    setFileProgress(prev => ({ 
                        ...prev, 
                        [payload.fileName]: { 
                            ...prev[payload.fileName], 
                            error: payload.error 
                        } 
                    }));
                    break;
                default:
                    console.warn('Unknown message type from worker:', type);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const checkConnection = async () => {
        try {
            llamaService.setBaseUrl(llamaUrl);
            const connected = await llamaService.checkConnection();
            setIsConnected(connected);
            if (!connected) {
                setError('Não foi possível conectar ao LLaMA local. Verifique se o Ollama está rodando em ' + llamaUrl);
            } else {
                setError('');
            }
        } catch (error) {
            setIsConnected(false);
            setError('Erro ao verificar conexão com o LLaMA local');
        }
    };

    const loadAvailableModels = async () => {
        try {
            llamaService.setBaseUrl(llamaUrl);
            const models = await llamaService.getAvailableModels();
            setAvailableModels(models);
            if (models.length > 0 && !models.includes(selectedModel)) {
                setSelectedModel(models[0]);
            }
        } catch (error) {
            console.error('Error loading models:', error);
        }
    };

    const resetStateForNewFiles = (files: File[]) => {
        setUploadedFiles(files);
        setProcessedFiles([]);
        setResponse('');
        setError('');
        
        const initialProgress: Record<string, FileProgressState> = {};
        files.forEach(file => {
            initialProgress[file.name] = { file, progress: 0, error: null };
        });
        setFileProgress(initialProgress);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClear = () => {
        setPrompt('');
        setUploadedFiles([]);
        setProcessedFiles([]);
        setFileProgress({});
        setResponse('');
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
        resetStateForNewFiles(files);
        workerRef.current?.postMessage(files);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!prompt && processedFiles.length === 0) {
            setError('Por favor, digite um prompt ou faça upload de arquivos.');
            return;
        }

        if (!isConnected) {
            setError('Não há conexão com o LLaMA local. Verifique se o Ollama está rodando.');
            return;
        }

        setIsLoading(true);
        setResponse('');
        setError('');

        try {
            llamaService.setModel(selectedModel);
            llamaService.setBaseUrl(llamaUrl);

            const messages: LlamaMessage[] = [
                {
                    role: 'system',
                    content: 'Você é um assistente AI útil. Responda de forma clara e precisa.'
                },
                {
                    role: 'user',
                    content: prompt || 'Analise os arquivos fornecidos.'
                }
            ];

            // Include file information for context
            const fileDescriptions = processedFiles.map(file => 
                `Arquivo: ${file.name} (tipo: ${file.mimeType})`
            );

            const fullResponse = await llamaService.generateResponse(messages, fileDescriptions);
            setResponse(fullResponse);

        } catch (e: any) {
            console.error(e);
            setError(`Erro ao gerar resposta: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drag-over');
        
        const files = Array.from(event.dataTransfer.files);
        if (files.length > 0) {
            resetStateForNewFiles(files);
            workerRef.current?.postMessage(files);
        }
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drag-over');
    };

    const allFilesProcessedOrError = uploadedFiles.length > 0 && 
        Object.values(fileProgress).every(f => f.progress === 100 || f.error);

    return (
        <div className="app-container fade-in">
            <header>
                <h1>Interface Multimodal com LLaMA Local</h1>
            </header>

            {/* Connection Status Bar */}
            <div className="status-bar">
                <div className="connection-status">
                    <div className={`status-indicator ${isConnected ? 'status-connected' : 'status-disconnected'}`}></div>
                    <span>
                        {isConnected ? 'Conectado ao LLaMA' : 'Desconectado'}
                    </span>
                </div>
                
                <div className="model-selector">
                    <label htmlFor="model-select">Modelo:</label>
                    <select 
                        id="model-select"
                        value={selectedModel} 
                        onChange={(e) => {
                            setSelectedModel(e.target.value);
                            llamaService.setModel(e.target.value);
                        }}
                        disabled={!isConnected || availableModels.length === 0}
                    >
                        {availableModels.length === 0 ? (
                            <option value="">Nenhum modelo disponível</option>
                        ) : (
                            availableModels.map(model => (
                                <option key={model} value={model}>{model}</option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            {/* URL Configuration */}
            <div className="status-bar">
                <div>
                    <label htmlFor="llama-url">URL do LLaMA:</label>
                    <input 
                        id="llama-url"
                        type="text" 
                        value={llamaUrl}
                        onChange={(e) => setLlamaUrl(e.target.value)}
                        onBlur={checkConnection}
                        style={{ marginLeft: '0.5rem', padding: '0.5rem' }}
                    />
                </div>
                <button 
                    type="button" 
                    onClick={checkConnection}
                    className="secondary-button"
                    style={{ minWidth: 'auto', padding: '0.5rem 1rem' }}
                >
                    Testar Conexão
                </button>
            </div>

            <main>
                <form onSubmit={handleSubmit} className="prompt-form">
                    <div 
                        className="drop-zone"
                        onClick={triggerFileInput}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            multiple
                            style={{ display: 'none' }}
                            accept={SUPPORTED_MIME_TYPES_STRING}
                        />
                        <p>Arraste e solte arquivos aqui, ou clique para selecionar arquivos.</p>
                        <button 
                            type="button" 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                triggerFileInput(); 
                            }}
                        >
                            Procurar Arquivos
                        </button>
                    </div>

                    {uploadedFiles.length > 0 && (
                        <div className="file-progress-container">
                            {Object.values(fileProgress).map((fileProgressState) => (
                                <FileProgress 
                                    key={fileProgressState.file.name} 
                                    fileProgress={fileProgressState} 
                                />
                            ))}
                        </div>
                    )}

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Digite seu prompt aqui... (ou faça upload de arquivos para análise)"
                        rows={4}
                        disabled={isLoading}
                    />
                    
                    <div className="button-group">
                        <button 
                            type="submit" 
                            disabled={
                                isLoading || 
                                !isConnected || 
                                (uploadedFiles.length > 0 && !allFilesProcessedOrError)
                            }
                        >
                            {isLoading ? (
                                <span className="pulse">Gerando Resposta...</span>
                            ) : (
                                'Enviar'
                            )}
                        </button>
                        <button 
                            type="button" 
                            className="secondary-button" 
                            onClick={handleClear} 
                            disabled={isLoading}
                        >
                            Limpar
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="error-message fade-in">
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="loading-indicator pulse">
                        Processando com LLaMA local...
                    </div>
                )}

                {response && (
                    <div className="response-container fade-in">
                        <h2>Resposta do LLaMA</h2>
                        <ReactMarkdown>{response}</ReactMarkdown>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;