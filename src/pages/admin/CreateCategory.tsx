import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { supabase } from '@/supabase';
import { useApp } from '@/contexts/AppContext';
import { ICON_MAP } from '@/lib/constants';

export const CreateCategory = () => {
  const navigate = useNavigate();
  const { showModal, refreshCategories } = useApp();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon_name: 'Code2',
    topics: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const { error } = await supabase.from('categories').insert([formData]);
      if (error) throw error;
      
      refreshCategories();
      showModal("Успех", "Категория успешно создана.");
      navigate('/admin');
    } catch (error) {
      console.error(error);
      showModal("Ошибка", "Не удалось создать категорию.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-4 md:p-8"
    >
      <div className="glass-card p-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Создание <span className="text-[#00f2ff]">Категории</span></h2>
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6 text-white/40" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold tracking-widest text-white/40">Название категории</label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-[#00f2ff]/30 transition-all"
              placeholder="Напр: Frontend Development"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs uppercase font-bold tracking-widest text-white/40">Визуальный идентификатор (Icon)</label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {Object.keys(ICON_MAP).map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon_name: iconName })}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-center ${
                    formData.icon_name === iconName 
                      ? 'bg-[#00f2ff]/20 border-[#00f2ff] text-[#00f2ff]' 
                      : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                  }`}
                >
                  {ICON_MAP[iconName]}
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full py-4 glass-button-primary font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Инициализация...' : 'Сохранить категорию'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};
