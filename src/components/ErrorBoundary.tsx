import React, { Component, ErrorInfo } from 'react';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#050505] text-white overflow-hidden relative">
          <div className="liquid-bg">
            <div className="blob blob-1 opacity-20" />
            <div className="blob blob-2 opacity-20" />
          </div>
          
          <div className="glass-card p-10 max-w-md w-full text-center relative z-10 border-red-500/20">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 mx-auto border border-red-500/20">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-3">Системная <span className="text-red-500">Ошибка</span></h2>
            <p className="text-white/40 text-sm font-mono mb-8 leading-relaxed">
              {this.state.error?.message || 'Произошла непредвиденная ошибка'}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 glass-button text-red-400 border-red-400/20 hover:bg-red-400/10 font-bold"
            >
              Перезапустить Систему
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
