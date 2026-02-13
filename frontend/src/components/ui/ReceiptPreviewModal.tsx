'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ReceiptPreviewModalProps {
    url: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ReceiptPreviewModal({ url, isOpen, onClose }: ReceiptPreviewModalProps) {
    const isPdf = url.toLowerCase().endsWith('.pdf');

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-surface-950/80" />

            {/* Modal */}
            <div
                className="relative bg-surface-800 border border-surface-700 rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-surface-700">
                    <h3 className="text-sm font-semibold text-surface-100">Receipt Preview</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-surface-400 hover:bg-surface-700 hover:text-surface-100 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {isPdf ? (
                        <iframe
                            src={url}
                            className="w-full h-[70vh] rounded-lg border border-surface-700"
                            title="Receipt PDF"
                        />
                    ) : (
                        <img
                            src={url}
                            alt="Receipt"
                            className="max-w-full h-auto rounded-lg mx-auto"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
