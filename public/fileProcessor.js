/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A simple Web Worker to process files off the main thread.
// It reads files, converts them to base64, and sends them back with progress.

const MAX_FILE_SIZE = 20 * 1024 * 1024; // Increased limit for larger files like video/audio

// List of supported MIME types by Gemini 1.5 Flash.
// See: https://ai.google.dev/gemini-api/docs/prompting_with_media#supported_file_formats
const SUPPORTED_MIME_TYPES = [
    'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
    'audio/wav', 'audio/mp3', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac',
    'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv', 'video/mpg', 'video/webm', 'video/wmv', 'video/3gpp',
    'application/pdf',
    // Added common document formats
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/rtf', // .rtf
];

self.onmessage = async (event) => {
    const files = event.data;
    // Process all files in parallel
    files.forEach(processFile);
};

/**
 * Reads a file, converts it to a base64 string, and posts progress updates.
 * @param {File} file The file to process.
 */
function processFile(file) {
    if (file.size > MAX_FILE_SIZE) {
        self.postMessage({
            type: 'error',
            payload: { error: `O arquivo "${file.name}" excede o limite de 20MB.`, fileName: file.name }
        });
        return;
    }
    
    if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
         self.postMessage({
            type: 'error',
            payload: { error: `O tipo de arquivo "${file.type}" não é suportado.`, fileName: file.name }
        });
        return;
    }

    const reader = new FileReader();

    reader.onprogress = (event) => {
        if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            self.postMessage({
                type: 'progress',
                payload: { fileName: file.name, progress: progress }
            });
        }
    };

    reader.onload = () => {
        const encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
        self.postMessage({
            type: 'complete',
            payload: {
                file: {
                    name: file.name,
                    mimeType: file.type,
                    base64: encoded,
                }
            }
        });
    };

    reader.onerror = () => {
        self.postMessage({
            type: 'error',
            payload: { error: `Não foi possível ler o arquivo "${file.name}".`, fileName: file.name }
        });
    };

    reader.readAsDataURL(file);
}