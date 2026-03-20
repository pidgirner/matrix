import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/supabase';

export function CreateUser() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showModal } = useApp();
  const [loading, setLoading] = useState(false);

  const createUser = async (userData: any) => {
    setLoading(true);
    try {
      // 1. Create user in Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password || 'password123',
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
          }
        }
      });

      if (authError) throw authError;

      if (data.user) {
          // 2. Create profile
          const { error: profileError } = await supabase.from('profiles').insert([{
            id: data.user.id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            company: userData.company,
            position: userData.position,
            department: userData.department,
            directorate: userData.directorate,
            role: userData.role
          }]);
        
        if (profileError) throw profileError;
        
        showModal('Успех', `Пользователь ${userData.email} успешно создан.`);
        navigate('/admin');
      }
    } catch (error: any) {
      showModal('Ошибка', error.message || 'Не удалось создать пользователя');
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'curator') {
    return null;
  }

  return (
    <motion.div 
      key="create-user"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-6 mb-10">
        <button 
          onClick={() => navigate('/admin')} 
          className="w-12 h-12 glass-button flex items-center justify-center text-white/60 hover:text-[#00f2ff] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Регистрация <span className="text-[#00f2ff]">профиля</span></h2>
        </div>
      </div>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          createUser({
            email: formData.get('email') as string,
            first_name: formData.get('first_name') as string,
            last_name: formData.get('last_name') as string,
            company: formData.get('company') as string,
            position: formData.get('position') as string,
            department: formData.get('department') as string,
            directorate: formData.get('directorate') as string,
            role: formData.get('role') as 'employee' | 'curator',
            password: (formData.get('password') as string) || 'password123'
          });
        }}
        className="glass-card p-10 space-y-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Имя</label>
            <input name="first_name" required className="w-full p-4 glass-input text-white" placeholder="Иван" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Фамилия</label>
            <input name="last_name" required className="w-full p-4 glass-input text-white" placeholder="Иванов" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Идентификатор доступа (Email)</label>
            <input name="email" type="email" required className="w-full p-4 glass-input text-white" placeholder="subject@matrix.io" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Ключ безопасности</label>
            <input name="password" type="text" placeholder="password123" className="w-full p-4 glass-input text-white" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Компания</label>
            <input name="company" className="w-full p-4 glass-input text-white" placeholder="ООО Ромашка" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Обозначение (Должность)</label>
            <input name="position" required className="w-full p-4 glass-input text-white" placeholder="Старший аналитик" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Отдел (Подразделение)</label>
            <input name="department" required className="w-full p-4 glass-input text-white" placeholder="Интеллект" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Управление</label>
            <input name="directorate" className="w-full p-4 glass-input text-white" placeholder="Операции" />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Уровень доступа</label>
            <select name="role" className="w-full p-4 glass-input text-white bg-black/40">
              <option value="employee" className="bg-[#050505]">Стандартный профиль</option>
              <option value="curator" className="bg-[#050505]">Системный куратор</option>
            </select>
          </div>
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="w-full py-5 glass-button-primary flex items-center justify-center gap-3 group"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
          <span>Создать профиль</span>
        </button>
      </form>
    </motion.div>
  );
}
