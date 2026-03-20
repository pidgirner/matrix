import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/supabase';
import { MatrixLogo } from '@/components/MatrixLogo';
import { Background } from '@/components/Background';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { configError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
        <Background />
        <div className="glass-card p-8 max-w-md w-full text-center border-red-500/20 relative z-10">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Ошибка конфигурации</h2>
          <p className="text-white/60">
            Пожалуйста, подключите Supabase, нажав кнопку "Connect to Supabase" в правом верхнем углу.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <Background />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-card p-10 max-w-md w-full relative z-10 border-white/10 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <MatrixLogo className="w-24 h-24 mb-6" />
          <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50 mb-2">
            MATRIX
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#00e5ff] font-bold">
            Competency System
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3 font-medium"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}
          
          <div className="space-y-4">
            <div className="relative group">
              <input
                type="email"
                placeholder="Электронная почта"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-[#00e5ff]/50 focus:ring-1 focus:ring-[#00e5ff]/50 transition-all duration-300 peer"
                required
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00e5ff]/20 to-blue-500/20 opacity-0 peer-focus:opacity-100 pointer-events-none transition-opacity duration-500" />
            </div>
            
            <div className="relative group">
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-white/30 focus:outline-none focus:border-[#00e5ff]/50 focus:ring-1 focus:ring-[#00e5ff]/50 transition-all duration-300 peer"
                required
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#00e5ff]/20 to-blue-500/20 opacity-0 peer-focus:opacity-100 pointer-events-none transition-opacity duration-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#00e5ff] to-blue-600 text-black font-black text-lg tracking-wide hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Вход в Систему
                  <LogIn className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
