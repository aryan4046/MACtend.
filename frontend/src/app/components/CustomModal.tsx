import React from 'react';
import { 
  CheckCircle2, AlertCircle, XCircle, Info, 
  X, AlertTriangle
} from 'lucide-react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
}

export function CustomModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}: CustomModalProps) {
  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={48} />,
    error: <XCircle className="text-rose-500" size={48} />,
    warning: <AlertTriangle className="text-amber-500" size={48} />,
    info: <Info className="text-blue-500" size={48} />,
    confirm: <AlertCircle className="text-indigo-500" size={48} />
  };

  const buttonStyles = {
    success: "bg-emerald-600 hover:bg-emerald-700",
    error: "bg-rose-600 hover:bg-rose-700",
    warning: "bg-amber-600 hover:bg-amber-700",
    info: "bg-blue-600 hover:bg-blue-700",
    confirm: "bg-indigo-600 hover:bg-indigo-700 text-white"
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Glass Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white/90 backdrop-blur-xl w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 ease-out">
        <div className="p-8 pb-6 flex flex-col items-center text-center">
          <div className="mb-6 p-4 rounded-full bg-slate-50 border border-slate-100 shadow-inner">
            {icons[type]}
          </div>
          
          <h3 className="text-xl font-bold text-slate-800 mb-2 leading-tight">
            {title}
          </h3>
          
          <p className="text-slate-500 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-6 bg-slate-50/50 flex gap-3 border-t border-slate-100">
          {type === 'confirm' ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm?.();
                  onClose();
                }}
                className={`flex-1 px-4 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${buttonStyles[type]}`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className={`w-full px-4 py-3 rounded-2xl font-bold transition-all shadow-lg active:scale-95 text-white ${buttonStyles[type]}`}
            >
              Understand
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
