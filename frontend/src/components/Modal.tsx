'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            padding: '20px'
        }} onClick={onClose}>
            <div
                className="glass-panel"
                style={{
                    width: '100%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 0 40px rgba(0, 242, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    overflow: 'hidden'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--border-glass)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.03)'
                }}>
                    <h2 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '5px'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px'
                }}>
                    {children}
                </div>

                <div style={{
                    padding: '12px 24px',
                    borderTop: '1px solid var(--border-glass)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    fontSize: '10px',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                }}>
                    Lebanon Monitor Intelligence Feed
                </div>
            </div>
        </div>
    );
};

export default Modal;
