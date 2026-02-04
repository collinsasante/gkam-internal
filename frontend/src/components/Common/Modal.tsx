import React, { useEffect, useRef } from 'react';

interface ModalProps {
    id?: string;
    isOpen: boolean;
    onClose: () => void;
    title: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'lg' | 'xl';
}

export default function Modal({
    id = 'modal',
    isOpen,
    onClose,
    title,
    children,
    footer,
    size
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    // Handle ESC key to close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (isOpen && e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    // Prevent scrolling on body when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        } else {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClass = size ? `modal-${size}` : '';

    return (
        <>
            <div
                className="modal fade show"
                id={id}
                tabIndex={-1}
                role="dialog"
                style={{ display: 'block' }}
                aria-labelledby={`${id}-label`}
                aria-modal="true"
                onClick={(e) => {
                    // Close on clicking backdrop
                    if (e.target === modalRef.current) {
                        onClose();
                    }
                }}
                ref={modalRef}
            >
                <div className={`modal-dialog ${sizeClass}`} role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id={`${id}-label`}>{title}</h5>
                            <button
                                type="button"
                                className="close btn btn-icon btn-sm btn-active-light-primary ms-2"
                                onClick={onClose}
                                aria-label="Close"
                            >
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            {children}
                        </div>
                        {footer && (
                            <div className="modal-footer">
                                {footer}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
}
