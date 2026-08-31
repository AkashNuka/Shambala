'use client';

import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      ref={overlayRef}
    >
      <div className="w-full max-w-lg bg-bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-xl font-bold">{title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-bg-elevated text-text-secondary rounded-full hover:bg-bg-input hover:text-text transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
        
      </div>
    </div>
  );
}
