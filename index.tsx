// Fix: Replaced placeholder text with a functional React component.
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

// Per coding guidelines, API key is sourced from process.env.API_KEY.
// This is assumed to be configured in the build environment.
const API_KEY = process.env.API_KEY;

// M-3 Fix: Moved constant declaration before its use.
// This is the list of supported MIME types from fileProcessor.js to use in the file input accept attribute.
const SUPPORTED_MIME_TYPES_STRING = [
    'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
    'audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac',
    'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gpp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/rtf',
].join(',');


/**
 * A component to display the progress of a single file being processed.
 */
// Fix: Add explicit prop types for the FileProgress component.
const FileProgress = ({ file, progress, error }: { file: File, progress: number, error: string | null }) => (
    <div className="file-progress-item">
        <span className="file-name" title={file.name}>{file.name}</span>
        {error ? (
            <span className="error-text">{error}</span>
        ) : progress < 100 ? (
            <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
        ) : (
            <span className="status-text">✅ Processed</span>
        )}
    </div>
);

/**
 * The main application component.
 */
// Fix: Add types for file progress and processed file state to resolve TypeScript errors.
interface FileProgressState {
    file: File;
    progress: number;
    error: string | null;
}

interface ProcessedFile {
    name: string;
    mimeType: string;
    base64: string;
}

const App = () => {
    const [prompt, setPrompt] = useState('');
    // Fix: Add explicit types to useState and useRef hooks for better type safety.
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // File objects from input
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]); // Base64 encoded files from worker
    const [fileProgress, setFileProgress] = useState<Record<string, FileProgressState>>({}); // Progress tracking for each file
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const workerRef = useRef<Worker | null>(null);

    // Initialize the Web Worker
    useEffect(() => {
        workerRef.current = new Worker('fileProcessor.js');

        workerRef.current.onmessage = (event) => {
            const { type, payload } = event.data;
            switch (type) {
                case 'progress':
                    setFileProgress(prev => ({ ...prev, [payload.fileName]: { ...prev[payload.fileName], progress: payload.progress } }));
                    break;
                case 'complete':
                    setProcessedFiles(prev => [...prev, payload.file]);
                    setFileProgress(prev => ({ ...prev, [payload.file.name]: { ...prev[payload.file.name], progress: 100 } }));
                    break;
                case 'error':
                    setFileProgress(prev => ({ ...prev, [payload.fileName]: { ...prev[payload.fileName], error: payload.error } }));
                    break;
                default:
                    console.warn('Unknown message type from worker:', type);
            }
        };

        // Cleanup on unmount
        return () => {
            // Fix: Use optional chaining for safety.
            workerRef.current?.terminate();
        };
    }, []);

    // Fix: Add types for function parameters.
    const resetStateForNewFiles = (files: File[]) => {
        setUploadedFiles(files);
        setProcessedFiles([]);
        setResponse('');
        setError('');
        // Fix: Add type for initialProgress object.
        const initialProgress: Record<string, FileProgressState> = {};
        files.forEach(file => {
            initialProgress[file.name] = { file, progress: 0, error: null };
        });
        setFileProgress(initialProgress);
        // Also clear the file input value
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    // M-5: Implement Clear/Reset functionality
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

    // Fix: Add type for the event object.
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;
        resetStateForNewFiles(files);
        // Fix: Use optional chaining for safety.
        workerRef.current?.postMessage(files);
    };

    // Fix: Add type for the event object.
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!prompt && processedFiles.length === 0) {
            setError('Please enter a prompt or upload files.');
            return;
        }
        if (!API_KEY) {
            setError("API key is missing. Please ensure it's configured in your environment.");
            return;
        }

        setIsLoading(true);
        setResponse('');
        setError('');

        try {
            // Fix: Initialize GoogleGenAI with a named apiKey parameter as required.
            const ai = new GoogleGenAI({ apiKey: API_KEY });

            const fileParts = processedFiles.map(file => ({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.base64,
                },
            }));

            const contents = [{
                parts: [...fileParts, { text: prompt || '' }]
            }];

            // M-2: This API call structure is correct per the latest @google/genai guidelines.
            const result = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents
            });
            
            const text = result.text;
            setResponse(text);

        } catch (e: any) {
            console.error(e);
            setError(`An error occurred: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };
    
    // Fix: Add type for the event object.
    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drag-over');
        const files = Array.from(event.dataTransfer.files);
        if (files.length > 0) {
            resetStateForNewFiles(files);
            // Fix: Use optional chaining for safety.
            workerRef.current?.postMessage(files);
        }
    };

    // Fix: Add type for the event object.
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.add('drag-over');
    };

    // Fix: Add type for the event object.
    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove('drag-over');
    };

    // Fix: With types added to fileProgress state, this line no longer causes an error.
    const allFilesProcessedOrError = uploadedFiles.length > 0 && 
        Object.values(fileProgress).every(f => f.progress === 100 || f.error);

    return (
        <div className="app-container">
            <header>
                <h1>Multimodal AI with Gemini</h1>
            </header>
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
                        <p>Drag &amp; drop files here, or click to select files.</p>
                        <button type="button" onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}>
                            Browse Files
                        </button>
                    </div>

                    {uploadedFiles.length > 0 && (
                        <div className="file-progress-container">
                            {Object.values(fileProgress).map(({ file, progress, error }) => (
                                <FileProgress key={file.name} file={file} progress={progress} error={error} />
                            ))}
                        </div>
                    )}

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your prompt here..."
                        rows={4}
                        disabled={isLoading}
                    />
                    
                    <div className="button-group">
                        <button type="submit" disabled={isLoading || (uploadedFiles.length > 0 && !allFilesProcessedOrError)}>
                            {isLoading ? 'Generating...' : 'Send'}
                        </button>
                        {/* M-5: Added Clear button */}
                        <button type="button" className="secondary-button" onClick={handleClear} disabled={isLoading}>
                            Clear
                        </button>
                    </div>
                </form>

                {error && <div className="error-message">{error}</div>}

                {isLoading && <div className="loading-indicator">Thinking...</div>}

                {response && (
                    <div className="response-container">
                        <h2>Response</h2>
                        <ReactMarkdown>{response}</ReactMarkdown>
                    </div>
                )}
            </main>
        </div>
    );
};

// Render the app into the DOM
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<React.StrictMode><App /></React.StrictMode>);
}

// Basic CSS for styling - appended to head to avoid creating a new file
const styles = `
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; background-color: #f4f4f9; color: #333; }
    .app-container { max-width: 800px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 1rem; margin-bottom: 2rem; }
    h1 { color: #444; font-weight: 600; }
    .prompt-form { display: flex; flex-direction: column; gap: 1.5rem; }
    textarea { width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid #ccc; font-size: 1rem; resize: vertical; box-sizing: border-box; transition: border-color 0.2s; }
    textarea:focus { border-color: #007bff; outline: none; }
    .button-group { display: flex; gap: 1rem; }
    button { padding: 0.75rem 1.5rem; border: none; border-radius: 6px; background-color: #007bff; color: white; font-size: 1rem; cursor: pointer; transition: background-color 0.2s; font-weight: 500; flex-grow: 1; }
    button:disabled { background-color: #ccc; cursor: not-allowed; }
    button:hover:not(:disabled) { background-color: #0056b3; }
    button.secondary-button { background-color: #6c757d; }
    button.secondary-button:hover:not(:disabled) { background-color: #5a6268; }
    .response-container { margin-top: 2rem; padding: 1.5rem; border: 1px solid #eee; border-radius: 6px; background-color: #fafafa; line-height: 1.6; }
    .response-container h2 { margin-top: 0; }
    .response-container pre { background-color: #f0f0f0; padding: 1rem; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; }
    .error-message { color: #d9534f; background-color: #f2dede; border: 1px solid #ebccd1; padding: 1rem; border-radius: 6px; margin-top: 1rem; }
    .loading-indicator { text-align: center; margin-top: 1rem; color: #555; font-style: italic; }
    .drop-zone { border: 2px dashed #ccc; border-radius: 8px; padding: 2rem; text-align: center; cursor: pointer; transition: background-color 0.2s, border-color 0.2s; }
    .drop-zone.drag-over { background-color: #f0f8ff; border-color: #007bff; }
    .drop-zone p { margin: 0 0 1rem 0; color: #666; }
    .file-progress-container { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0; }
    .file-progress-item { display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; padding: 0.25rem 0; }
    .file-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50%; }
    .progress-bar-container { width: 40%; height: 10px; background-color: #e0e0e0; border-radius: 5px; overflow: hidden; }
    .progress-bar { height: 100%; background-color: #4caf50; transition: width 0.3s; }
    .status-text { color: #4caf50; font-weight: 500; }
    .error-text { color: #d9534f; font-weight: 500; }
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);