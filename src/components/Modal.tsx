import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

export const Modal = () => {
  const { modal, closeModal } = useApp();

  return (
    <AnimatePresence>
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="glass-card p-6 max-w-md w-full relative z-10"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${modal.type === 'confirm' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-[#00e5ff]/10 text-[#00e5ff]'}`}>
                {modal.type === 'confirm' ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <h3 className="text-xl font-bold">{modal.title}</h3>
            </div>
            <p className="text-white/70 mb-6">{modal.message}</p>
            <div className="flex gap-3 justify-end">
              {modal.type === 'confirm' && (
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Отмена
                </button>
              )}
              <button
                onClick={() => {
                  if (modal.onConfirm) modal.onConfirm();
                  closeModal();
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  modal.type === 'confirm' 
                    ? 'bg-yellow-500 hover:bg-yellow-400 text-black' 
                    : 'bg-[#00e5ff] hover:bg-[#00c8ff] text-black'
                }`}
              >
                {modal.type === 'confirm' ? 'Подтвердить' : 'Понятно'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
