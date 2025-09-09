import React from 'react';
import { FileProgressState } from '../types';

interface FileProgressProps {
    fileProgress: FileProgressState;
}

const FileProgress: React.FC<FileProgressProps> = ({ fileProgress }) => {
    const { file, progress, error } = fileProgress;

    return (
        <div className="file-progress-item">
            <span className="file-name" title={file.name}>
                {file.name}
            </span>
            {error ? (
                <span className="error-text">{error}</span>
            ) : progress < 100 ? (
                <div className="progress-bar-container">
                    <div 
                        className="progress-bar" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            ) : (
                <span className="status-text">✅ Processado</span>
            )}
        </div>
    );
};

export default FileProgress;