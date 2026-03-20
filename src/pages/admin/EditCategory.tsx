import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Category } from '@/types';
import { cn } from '@/lib/utils';
import { ICON_MAP } from '@/lib/constants';
import { supabase } from '@/supabase';

export function EditCategory() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category as Category;
  
  const { showModal, refreshCategories, refreshCustomTests } = useApp();
  const [editingCategory, setEditingCategory] = useState<Category | null>(category || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) {
      navigate('/admin');
    }
  }, [category, navigate]);

  if (!editingCategory) return null;

  const saveCategory = async (cat: Category) => {
    setLoading(true);
    try {
      const oldName = category.name;
      const nameChanged = oldName !== cat.name;

      // 1. Update the category itself
      const { error: catError } = await supabase
        .from('categories')
        .update({
          name: cat.name,
          icon_name: cat.icon_name,
          topics: cat.topics
        })
        .eq('id', cat.id);

      if (catError) throw catError;

      // 2. If name changed, update references in other tables
      if (nameChanged) {
        // Update custom_tests
        const { error: testsError } = await supabase
          .from('custom_tests')
          .update({ category: cat.name })
          .eq('category', oldName);
        
        if (testsError) console.error('Error updating custom_tests category:', testsError);

        // Update results
        const { error: resultsError } = await supabase
          .from('results')
          .update({ category: cat.name })
          .eq('category', oldName);
        
        if (resultsError) console.error('Error updating results category:', resultsError);

        // Update user profiles (allowed_categories)
        // This is a bit more complex as it's an array field. 
        // We'll fetch profiles that have the old name and update them.
        const { data: profiles, error: profilesFetchError } = await supabase
          .from('profiles')
          .select('id, allowed_categories')
          .contains('allowed_categories', [oldName]);

        if (!profilesFetchError && profiles) {
          for (const profile of profiles) {
            const newAllowed = profile.allowed_categories?.map(c => c === oldName ? cat.name : c) || [];
            await supabase
              .from('profiles')
              .update({ allowed_categories: newAllowed })
              .eq('id', profile.id);
          }
        }
      }
      
      showModal('Успех', 'Категория успешно синхронизирована');
      await Promise.all([
        refreshCategories(),
        refreshCustomTests()
      ]);
      navigate('/admin');
    } catch (error: any) {
      console.error('Update category error:', error);
      showModal('Ошибка', error.message || 'Не удалось обновить категорию');
    } finally {
      setLoading(false);
    }
  };

  const onBack = () => navigate('/admin');

  return (
    <motion.div 
      key="edit-category"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex items-center gap-6 mb-10">
        <button 
          onClick={onBack} 
          className="w-12 h-12 glass-button flex items-center justify-center text-white/60 hover:text-[#00f2ff] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Управление <span className="text-[#00f2ff]">Категорией</span></h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Настройка системного узла</p>
        </div>
      </div>

      <div className="glass-card p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Название категории</label>
            <input 
              value={editingCategory.name}
              onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              className="w-full p-4 glass-input text-white"
              placeholder="например, Кибербезопасность"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Системная иконка</label>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 p-3 bg-black/40 rounded-xl border border-white/10 max-h-[180px] overflow-y-auto custom-scrollbar">
              {Object.keys(ICON_MAP).map(iconName => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setEditingCategory({ ...editingCategory, icon_name: iconName })}
                  className={cn(
                    "p-2.5 rounded-lg flex items-center justify-center transition-all",
                    editingCategory.icon_name === iconName 
                      ? "bg-[#00f2ff]/20 border border-[#00f2ff]/50 text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.1)]" 
                      : "bg-white/5 border border-white/5 text-white/20 hover:text-white/60 hover:border-white/20"
                  )}
                  title={iconName}
                >
                  <div className="scale-75">
                    {ICON_MAP[iconName]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={() => saveCategory(editingCategory)}
          disabled={loading || !editingCategory.name}
          className="w-full py-5 glass-button-primary flex items-center justify-center gap-3 group"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
          <span>Синхронизировать категорию</span>
        </button>
      </div>
    </motion.div>
  );
}
