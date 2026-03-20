import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard,
  ClipboardList, 
  Settings, 
  LogOut, 
  UserCircle,
  Table2
} from 'lucide-react';
import { supabase } from '@/supabase';
import { useAuth } from '@/contexts/AuthContext';

import { Background } from '@/components/Background';

export const Layout = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Дашборд', path: '/' },
    { id: 'tests', icon: ClipboardList, label: 'Тесты', path: '/tests' },
    { id: 'matrix', icon: Table2, label: 'Матрица', path: '/matrix' },
    ...(profile?.role === 'curator' ? [
      { id: 'admin', icon: Settings, label: 'Настройки', path: '/admin' }
    ] : []),
    { id: 'profile', icon: UserCircle, label: 'Профиль', path: '/profile' }
  ];

  return (
    <div className="min-h-screen text-white flex overflow-hidden relative">
      <div className="digital-noise" />
      <Background />

      {/* Universal Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-36 pt-16 glass-nav z-50 flex items-center justify-around md:justify-center md:gap-16 px-4 pb-safe">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 group relative ${
                isActive ? 'text-[#00e5ff]' : 'text-white/40 hover:text-white/70'
              }`}
            >
              <div className={`p-1 transition-transform duration-300 ${isActive ? '-translate-y-1' : 'group-hover:-translate-y-0.5'}`}>
                <item.icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] scale-110' : 'scale-100'}`} />
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 pb-20">
        <Outlet />
      </main>
    </div>
  );
};
