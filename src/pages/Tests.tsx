import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Code2, Edit2, Trash2, Plus, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { ICON_MAP } from '@/lib/constants';
import { Category } from '@/types';
import { cn } from '@/lib/utils';

export const Tests = () => {
  const { profile, userResults } = useAuth();
  const { categories, customTests, deleteCategory, deleteTest } = useApp();
  const navigate = useNavigate();
  const [activeCategoryPopup, setActiveCategoryPopup] = useState<Category | null>(null);

  // Filtering logic
  const isCurator = profile?.role === 'curator' || profile?.role === 'admin';
  
  const filteredCategories = categories.filter(cat => {
    if (isCurator) return true;
    
    // If no restrictions, show all
    if (!profile?.allowed_categories && !profile?.allowed_tests) return true;

    // Check if category is explicitly allowed
    const isCategoryAllowed = profile?.allowed_categories?.includes(cat.name);
    
    // Check if any test in this category is explicitly allowed
    const hasAllowedTestInCategory = customTests.some(t => 
      t.category === cat.name && profile?.allowed_tests?.includes(t.id!)
    );

    return isCategoryAllowed || hasAllowedTestInCategory;
  });

  const getFilteredTopics = (cat: Category) => {
    const allTopics = Array.from(new Set([
      ...(cat.topics || []),
      ...customTests.filter(t => t.category === cat.name).map(t => t.topic)
    ]));

    if (isCurator) return allTopics;
    if (!profile?.allowed_categories && !profile?.allowed_tests) return allTopics;

    return allTopics.filter(topic => {
      const test = customTests.find(t => t.category === cat.name && t.topic === topic);
      
      // If category is allowed, all its tests are allowed UNLESS allowed_tests is also specified?
      // Let's assume allowed_categories grants full access to the category.
      // And allowed_tests grants access to specific tests even if the category isn't in allowed_categories.
      
      const isCategoryAllowed = profile?.allowed_categories?.includes(cat.name);
      const isTestAllowed = test && profile?.allowed_tests?.includes(test.id!);

      return isCategoryAllowed || isTestAllowed;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto p-4 md:p-8"
    >
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Узлы <span className="text-[#00e5ff]">Навыков</span></h2>
        <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Выберите категорию для начала тестирования / оценки</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredCategories.map((cat) => (
          <motion.div 
            key={cat.id}
            whileHover={{ scale: 1.02, translateY: -5 }}
            className="glass-card p-4 md:p-6 group relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#00e5ff]/10 to-transparent -mr-20 -mt-20 rounded-full blur-3xl group-hover:bg-[#00e5ff]/20 transition-all" />
            
            <div className="flex flex-row items-center text-left space-x-4 md:space-x-6 relative z-10">
              <button 
                onClick={() => setActiveCategoryPopup(cat)}
                className="w-12 h-12 md:w-16 md:h-16 glass-button flex items-center justify-center text-[#00e5ff] group-hover:shadow-[0_0_30px_rgba(0,229,255,0.2)] transition-all rounded-xl md:rounded-2xl shrink-0"
              >
                {ICON_MAP[cat.icon_name] || <Code2 className="w-6 h-6 md:w-8 md:h-8" />}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm md:text-lg font-bold tracking-tight mb-1">{cat.name}</h3>
                  {isCurator && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/admin/category/edit', { state: { category: cat } });
                        }}
                        className="p-1.5 glass-button text-white/40 hover:text-[#00e5ff] transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCategory(cat.id);
                        }}
                        className="p-1.5 glass-button text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-white/30 text-[8px] md:text-[10px] font-bold uppercase tracking-widest">
                  {getFilteredTopics(cat).length} Подмодулей
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Topic Selection Popup */}
      <AnimatePresence>
        {activeCategoryPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCategoryPopup(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-4xl p-6 md:p-10 relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00e5ff] to-[#7000ff] shrink-0" />
              
              <div className="flex items-start md:items-center justify-between mb-8 shrink-0">
                <div className="flex items-start md:items-center gap-4 flex-1 min-w-0 pr-4">
                  <div className="w-12 h-12 glass-button flex items-center justify-center text-[#00e5ff] shrink-0">
                    {ICON_MAP[activeCategoryPopup.icon_name] || <Code2 className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg md:text-xl font-bold tracking-tight break-words whitespace-normal leading-tight">{activeCategoryPopup.name}</h2>
                    <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest mt-1 break-words whitespace-normal leading-relaxed">Выберите тест</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveCategoryPopup(null)}
                  className="w-10 h-10 glass-button flex items-center justify-center text-white/40 hover:text-white transition-colors shrink-0"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
                {getFilteredTopics(activeCategoryPopup).map((topic) => {
                  const customTest = customTests.find(t => t.category === activeCategoryPopup.name && t.topic === topic);
                  
                  // Calculate attempts and best score
                  const topicResults = userResults.filter(r => r.category === activeCategoryPopup.name && r.topic === topic);
                  const attemptsCount = topicResults.length;
                  const bestScore = topicResults.length > 0 
                    ? Math.max(...topicResults.map(r => {
                      const values = Object.values(r.scores) as number[];
                      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                      }))
                    : null;

                  const isLimitReached = customTest?.has_attempts_limit && attemptsCount >= (customTest.attempts_limit || 1);

                  return (
                    <div key={topic} className="relative group">
                      <motion.button
                        whileHover={!isLimitReached ? { scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.08)" } : {}}
                        whileTap={!isLimitReached ? { scale: 0.98 } : {}}
                        disabled={isLimitReached && !isCurator}
                        onClick={() => {
                          if (isLimitReached && !isCurator) return;
                          navigate(`/test?category=${encodeURIComponent(activeCategoryPopup.name)}&topic=${encodeURIComponent(topic)}`);
                          setActiveCategoryPopup(null);
                        }}
                        className={cn(
                          "w-full p-6 glass-button text-left relative overflow-hidden transition-all",
                          isLimitReached && !isCurator ? "opacity-80 cursor-not-allowed border-white/5" : "group-hover:border-[#00f2ff]/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className={cn(
                              "font-bold transition-colors",
                              isLimitReached && !isCurator ? "text-white/40" : "text-white/80 group-hover:text-[#00f2ff]"
                            )}>
                              {topic}
                            </span>
                            {isLimitReached && (
                              <span className={cn(
                                "text-[8px] uppercase font-bold tracking-widest mt-1",
                                isCurator ? "text-yellow-400/60" : "text-red-400/60"
                              )}>
                                {isCurator ? "Лимит исчерпан (Админ-доступ)" : "Попытки исчерпаны"}
                              </span>
                            )}
                          </div>
                          
                          {bestScore !== null ? (
                            <div className="flex flex-col items-end">
                              <span className="text-lg font-mono font-bold text-[#00f2ff]">
                                {Math.round(bestScore)}%
                              </span>
                              <span className="text-[8px] uppercase font-bold tracking-widest text-white/20">
                                Лучший результат
                              </span>
                            </div>
                          ) : (
                            !isLimitReached && <ChevronRight className="w-4 h-4 text-[#00f2ff] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                          )}
                        </div>

                        {customTest?.has_attempts_limit && !isCurator && (
                          <div className="mt-4 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full transition-all duration-500",
                                  isLimitReached ? "bg-red-500/50" : "bg-[#00f2ff]/30"
                                )}
                                style={{ width: `${Math.min((attemptsCount / (customTest.attempts_limit || 1)) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-[8px] font-mono text-white/20">
                              {attemptsCount}/{customTest.attempts_limit}
                            </span>
                          </div>
                        )}
                      </motion.button>
                      
                      {isCurator && (
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          {customTest ? (
                            <>
                              <button 
                                onClick={() => {
                                  navigate('/admin/test/edit', { state: { test: customTest } });
                                  setActiveCategoryPopup(null);
                                }}
                                className="p-1.5 glass-button text-white/40 hover:text-[#00e5ff] transition-colors"
                                title="Редактировать тест"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => deleteTest(customTest.id!)}
                                className="p-1.5 glass-button text-white/40 hover:text-red-400 transition-colors"
                                title="Удалить тест"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => {
                                navigate('/admin/test/create', { state: { category: activeCategoryPopup.name, topic } });
                                setActiveCategoryPopup(null);
                              }}
                              className="p-1.5 glass-button text-white/40 hover:text-[#00e5ff] transition-colors"
                              title="Создать пользовательский тест"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
