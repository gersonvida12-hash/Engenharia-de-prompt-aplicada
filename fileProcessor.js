/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// A simple Web Worker to process files off the main thread.
// It reads files, converts them to base64, and sends them back.

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB, a common limit for Gemini multimodal

self.onmessage = async (event) => {
    const files = event.data;
    const processedFiles = [];

    for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
            // Post an error message back to the main thread
            self.postMessage({ error: `O arquivo "${file.name}" excede o limite de 4MB.` });
            return; // Stop processing
        }
        
        try {
            const base64 = await fileToBase64(file);
            processedFiles.push({
                name: file.name,
                mimeType: file.type,
                base64: base64,
            });
        } catch (error) {
            self.postMessage({ error: `Não foi possível ler o arquivo "${file.name}".` });
            return;
        }
    }
    
    self.postMessage(processedFiles);
};

/**
 * Reads a file and converts it to a base64 string.
 * @param {File} file The file to convert.
 * @returns {Promise<string>} A promise that resolves with the base64 string.
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // result is "data:mime/type;base64,the-real-base64-string"
            // We need to strip the prefix
            const encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
            if ((encoded.length % 4) > 0) {
               encoded += '='.repeat(4 - (encoded.length % 4));
            }
            resolve(encoded);
        };
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}
