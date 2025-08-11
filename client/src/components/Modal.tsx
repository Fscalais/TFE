import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string; // optionnel si tu veux ajouter des classes au panneau
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className = "" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={
          "relative w-full max-w-md rounded-2xl border shadow-xl backdrop-blur-xl " +
          // clair
          "border-white/10 bg-white/95 text-slate-900 " +
          // sombre
          "dark:bg-[#0e1333]/90 dark:text-slate-100 " +
          className
        }
      >
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;

