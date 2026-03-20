import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, RefreshCw, BarChart3, Code2, Edit2, Trash2, Shield, ChevronDown, ChevronRight, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { ICON_MAP } from '@/lib/constants';
import { supabase } from '@/supabase';
import { UserProfile, TestResult } from '@/types';
import { cn } from '@/lib/utils';

export const AdminDashboard = () => {
  const { profile } = useAuth();
  const { categories, customTests, deleteCategory, deleteTest, showModal, refreshCategories } = useApp();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [allResults, setAllResults] = useState<TestResult[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [accessModalUser, setAccessModalUser] = useState<UserProfile | null>(null);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const fetchAllAdminData = async () => {
    if (profile?.role !== 'curator') return;
    
    try {
      const [resultsRes, profilesRes] = await Promise.all([
        supabase.from('results').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('last_name', { ascending: true })
      ]);
      
      if (resultsRes.error) throw resultsRes.error;
      if (profilesRes.error) throw profilesRes.error;

      if (resultsRes.data) setAllResults(resultsRes.data);
      if (profilesRes.data) setAllProfiles(profilesRes.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    if (profile?.role === 'curator') {
      fetchAllAdminData();
    }
  }, [profile]);

  if (profile?.role !== 'curator') {
    return <div className="p-8 text-center text-white/50">Access Denied</div>;
  }

  const combinedTopicsMap = new Map<string, any>();

  categories.forEach(c => {
    (c.topics || []).forEach(t => {
      combinedTopicsMap.set(`${c.name}-${t}`, {
        id: `cat-${c.id}-${t}`,
        category: c.name,
        categoryId: c.id,
        topic: t,
        isCustom: false,
      });
    });
  });

  customTests.forEach(t => {
    combinedTopicsMap.set(`${t.category}-${t.topic}`, {
      id: `test-${t.id}`,
      category: t.category,
      topic: t.topic,
      isCustom: true,
      test: t
    });
  });

  const combinedTopics = Array.from(combinedTopicsMap.values());
  const orphanedTopics = combinedTopics.filter(t => !categories.some(c => c.name === t.category));

  const handleDeleteCategoryTopic = async (categoryId: string, topicToRemove: string) => {
    showModal(
      "Подтверждение удаления",
      "Вы уверены, что хотите удалить эту тему из категории?",
      'confirm',
      async () => {
        try {
          const category = categories.find(c => c.id === categoryId);
          if (!category) return;
          const newTopics = (category.topics || []).filter(t => t !== topicToRemove);
          const { error } = await supabase.from('categories').update({ topics: newTopics }).eq('id', categoryId);
          if (error) throw error;
          await refreshCategories();
        } catch (error) {
          console.error(error);
          showModal("Ошибка", "Не удалось удалить тему.");
        }
      }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10 max-w-7xl mx-auto p-4 md:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight mb-2">Управление <span className="text-[#00f2ff]">Куратора</span></h2>
          <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Системное администрирование и контроль</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff]">Все профили</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-mono text-white/40">{allProfiles.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/admin/user/create')}
                className="p-2 glass-button text-[#00f2ff] hover:bg-[#00f2ff]/10 transition-all"
                title="Регистрация профиля"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              <input 
                type="text"
                placeholder="Поиск профилей..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:border-[#00f2ff]/30 transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase font-bold text-white/20 sticky top-0 bg-[#050505] z-10">
                  <th className="p-6">Профиль</th>
                  <th className="p-6">Дата регистрации</th>
                  <th className="p-6">Роль</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {allProfiles.filter(p => 
                  `${p.first_name} ${p.last_name} ${p.email} ${p.position}`.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((p) => (
                  <tr 
                    key={p.id} 
                    onClick={() => navigate(`/admin/user/${p.id}`)}
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <td className="p-6">
                      <div className="font-bold text-sm text-white/90 group-hover:text-[#00f2ff] transition-colors">{p.last_name} {p.first_name}</div>
                      <div className="text-[10px] text-white/30 font-mono mt-1">{p.company ? `${p.company} • ` : ''}{p.position} • {p.department}</div>
                    </td>
                    <td className="p-6">
                      <div className="text-white/70 text-sm">{new Date(p.created_at).toLocaleDateString('ru-RU')}</div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setAccessModalUser(p);
                          }}
                          className="p-2 glass-button text-white/40 hover:text-[#00f2ff] hover:border-[#00f2ff]/30 transition-all"
                          title="Управление доступом"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                          p.role === 'curator' ? "bg-[#7000ff]/20 text-[#7000ff] border border-[#7000ff]/30" : "bg-white/5 text-white/40 border border-white/10"
                        )}>
                          {p.role}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allProfiles.length === 0 && (
              <div className="p-12 text-center text-white/20 text-sm font-mono italic">ПРОФИЛИ_НЕ_НАЙДЕНЫ</div>
            )}
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff]">Последние тесты</h3>
            <BarChart3 className="w-4 h-4 text-white/20" />
          </div>
          <div className="overflow-x-auto">
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 p-6">
              {allResults.map((res) => {
                const scores = res.scores || {};
                const scoreValues = Object.values(scores);
                const avgScore = scoreValues.length > 0 ? scoreValues.reduce((a, b) => Number(a) + Number(b), 0) / scoreValues.length : 0;
                return (
                  <div 
                    key={res.id} 
                    onClick={() => navigate(`/results/${res.id}`, { state: { result: res } })}
                    className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div>
                      <div className="text-sm font-bold text-white/90 group-hover:text-[#00f2ff] transition-colors">{res.user_name}</div>
                      <div className="text-[10px] text-white/30 font-mono mt-1">{res.topic} • {new Date(res.created_at).toLocaleDateString()}</div>
                    </div>
                    <div className="text-lg font-bold text-[#00f2ff]">{Math.round(avgScore)}%</div>
                  </div>
                );
              })}
              {allResults.length === 0 && (
                <div className="p-12 text-center text-white/20 text-sm font-mono italic">ЗАПИСИ_НЕ_НАЙДЕНЫ</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff]">Все тесты</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/admin/category/create')}
              className="px-3 py-2 glass-button text-[#00f2ff] hover:bg-[#00f2ff]/10 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              title="Создать категорию"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Категория</span>
            </button>
            <button 
              onClick={() => navigate('/admin/test/create')}
              className="px-3 py-2 glass-button text-[#00f2ff] hover:bg-[#00f2ff]/10 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              title="Создать тест"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Тест</span>
            </button>
          </div>
        </div>
        <div className="divide-y divide-white/5">
          {categories.map(category => {
            const categoryTopics = combinedTopics.filter(t => t.category === category.name);
            const isExpanded = expandedCategories[category.name];
            
            if (categoryTopics.length === 0) return null;

            return (
              <div key={category.id} className="flex flex-col">
                <div 
                  onClick={() => toggleCategory(category.name)}
                  className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors w-full text-left cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-[#00f2ff]">
                      {ICON_MAP[category.icon_name] || <Code2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-white/90">{category.name}</div>
                      <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-1">
                        {categoryTopics.length} Тем(ы)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/admin/category/edit', { state: { category } });
                      }}
                      className="p-2 glass-button text-white/40 hover:text-[#00f2ff] hover:border-[#00f2ff]/30 transition-all"
                      title="Редактировать категорию"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="bg-black/20 divide-y divide-white/5 border-t border-white/5">
                    {categoryTopics.map(item => (
                      <div key={item.id} className="p-4 pl-16 flex items-center justify-between hover:bg-white/5 transition-colors group">
                        <div>
                          <div className="font-bold text-white/80 text-sm">{item.topic}</div>
                          <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-1">
                            {item.isCustom ? `${item.test.questions?.length || 0} Последовательностей` : 'AI Генерация'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.isCustom ? (
                            <>
                              <button 
                                onClick={() => navigate('/admin/test/edit', { state: { test: item.test } })}
                                className="p-2 glass-button text-white/40 hover:text-[#00f2ff] hover:border-[#00f2ff]/30 transition-all"
                                title="Редактировать узел"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => deleteTest(item.test.id!)}
                                className="p-2 glass-button text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all"
                                title="Удалить узел"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => navigate('/admin/test/create', { state: { category: item.category, topic: item.topic } })}
                                className="p-2 glass-button text-white/40 hover:text-[#00f2ff] hover:border-[#00f2ff]/30 transition-all"
                                title="Создать пользовательский тест"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCategoryTopic(item.categoryId, item.topic)}
                                className="p-2 glass-button text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all"
                                title="Удалить тему из категории"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {combinedTopics.length === 0 && (
            <div className="p-12 text-center text-white/20 text-sm font-mono italic">УЗЛЫ_НЕ_ИНИЦИАЛИЗИРОВАНЫ</div>
          )}

          {orphanedTopics.length > 0 && (
            <div className="flex flex-col">
              <div 
                onClick={() => toggleCategory('orphaned')}
                className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors w-full text-left cursor-pointer border-t border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="text-red-400">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white/90">Тесты без категорий (Ошибки привязки)</div>
                    <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-1">
                      {orphanedTopics.length} Тем(ы)
                    </div>
                  </div>
                </div>
                <div className={`transition-transform duration-200 ${expandedCategories['orphaned'] ? 'rotate-180' : ''}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/40"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
              
              {expandedCategories['orphaned'] && (
                <div className="bg-red-500/5 divide-y divide-white/5 border-t border-white/5">
                  {orphanedTopics.map(item => (
                    <div key={item.id} className="p-4 pl-16 flex items-center justify-between hover:bg-white/5 transition-colors group">
                      <div>
                        <div className="font-bold text-white/80 text-sm">{item.topic} <span className="text-white/20 ml-2 font-normal">(Бывшая категория: {item.category})</span></div>
                        <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-1">
                          {item.isCustom ? `${item.test.questions?.length || 0} Последовательностей` : 'AI Генерация'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.isCustom ? (
                          <>
                            <button 
                              onClick={() => navigate('/admin/test/edit', { state: { test: item.test } })}
                              className="p-2 glass-button text-white/40 hover:text-[#00f2ff] hover:border-[#00f2ff]/30 transition-all"
                              title="Редактировать узел"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => deleteTest(item.test.id!)}
                              className="p-2 glass-button text-white/40 hover:text-red-400 hover:border-red-400/30 transition-all"
                              title="Удалить узел"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {accessModalUser && (
        <AccessModal 
          user={accessModalUser} 
          onClose={() => {
            setAccessModalUser(null);
            fetchAllAdminData();
          }} 
        />
      )}
    </motion.div>
  );
};

const AccessModal = ({ user, onClose }: { user: UserProfile, onClose: () => void }) => {
  const { categories, customTests, showModal } = useApp();
  const [allowedCategories, setAllowedCategories] = useState<string[]>(user.allowed_categories || []);
  const [allowedTests, setAllowedTests] = useState<string[]>(user.allowed_tests || []);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const toggleCategory = (catName: string) => {
    setAllowedCategories(prev => {
      if (prev.includes(catName)) {
        return prev.filter(c => c !== catName);
      } else {
        return [...prev, catName];
      }
    });
  };

  const toggleTest = (testId: string) => {
    setAllowedTests(prev => {
      if (prev.includes(testId)) {
        return prev.filter(id => id !== testId);
      } else {
        return [...prev, testId];
      }
    });
  };

  const toggleExpand = (catName: string) => {
    setExpandedCats(prev => ({ ...prev, [catName]: !prev[catName] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          allowed_categories: allowedCategories,
          allowed_tests: allowedTests
        })
        .eq('id', user.id);

      if (error) throw error;
      onClose();
    } catch (error: any) {
      console.error('Save access error:', error);
      showModal('Ошибка', 'Не удалось сохранить настройки доступа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div>
            <h3 className="text-lg font-bold text-white/90">Управление доступом</h3>
            <p className="text-xs text-white/40 mt-1">{user.last_name} {user.first_name} ({user.email})</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-white/40" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {categories.map(cat => {
            const catTests = customTests.filter(t => t.category === cat.name);
            const isCatAllowed = allowedCategories.includes(cat.name);
            const isExpanded = expandedCats[cat.name];

            return (
              <div key={cat.id} className="border border-white/5 rounded-xl overflow-hidden bg-white/5">
                <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleCategory(cat.name)}
                      className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                        isCatAllowed ? "bg-[#00f2ff] border-[#00f2ff] text-black" : "border-white/20 hover:border-white/40"
                      )}
                    >
                      {isCatAllowed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    <span className="font-bold text-sm text-white/80">{cat.name}</span>
                  </div>
                  
                  <button 
                    onClick={() => toggleExpand(cat.name)}
                    className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-white/30 hover:text-[#00f2ff] transition-colors"
                  >
                    {catTests.length} тестов
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="bg-black/40 border-t border-white/5 p-2 space-y-1">
                    {catTests.map(test => {
                      const isTestAllowed = allowedTests.includes(test.id!);
                      return (
                        <div key={test.id} className="flex items-center gap-3 p-2 pl-10 hover:bg-white/5 rounded-lg transition-colors">
                          <button 
                            onClick={() => toggleTest(test.id!)}
                            className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-all",
                              isTestAllowed ? "bg-[#00f2ff]/50 border-[#00f2ff] text-white" : "border-white/10 hover:border-white/20"
                            )}
                          >
                            {isTestAllowed && <Check className="w-3 h-3 stroke-[3]" />}
                          </button>
                          <span className="text-xs text-white/60">{test.topic}</span>
                        </div>
                      );
                    })}
                    {catTests.length === 0 && (
                      <div className="p-4 text-center text-[10px] text-white/20 uppercase font-bold tracking-widest">
                        Нет пользовательских тестов
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-6 border-t border-white/5 bg-white/5 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white/60 transition-colors"
          >
            Отмена
          </button>
          <button 
            disabled={loading}
            onClick={handleSave}
            className="px-6 py-2 bg-[#00f2ff] text-black rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#00f2ff]/80 transition-all disabled:opacity-50"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
