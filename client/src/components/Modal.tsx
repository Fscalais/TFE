import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

//composant par dessus la page

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, className = "" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={
          "relative w-full max-w-md rounded-2xl border shadow-xl backdrop-blur-xl " +
          "border-white/10 bg-white/95 text-slate-900 " +
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

