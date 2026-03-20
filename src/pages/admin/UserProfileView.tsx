import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { User, Mail, Shield, Briefcase, Award, TrendingUp, Clock, ArrowLeft, Loader2, Lock, Check, Save, ChevronDown, ChevronUp, X, Paperclip } from 'lucide-react';
import { supabase } from '@/supabase';
import { UserProfile, TestResult, Category, CustomTest } from '@/types';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { AnimatePresence } from 'motion/react';

export const UserProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories, customTests } = useApp();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [allowedTests, setAllowedTests] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;
      
      try {
        const [profileRes, resultsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', id).single(),
          supabase.from('results').select('*').eq('user_id', id).order('created_at', { ascending: false })
        ]);

        if (profileRes.error) throw profileRes.error;
        if (resultsRes.error) throw resultsRes.error;

        setProfile(profileRes.data);
        setResults(resultsRes.data || []);
        setAllowedCategories(profileRes.data.allowed_categories || []);
        setAllowedTests(profileRes.data.allowed_tests || []);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleSavePermissions = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          allowed_categories: allowedCategories.length > 0 ? allowedCategories : null,
          allowed_tests: allowedTests.length > 0 ? allowedTests : null
        })
        .eq('id', id);

      if (error) throw error;
      
      setProfile(prev => prev ? { 
        ...prev, 
        allowed_categories: allowedCategories.length > 0 ? allowedCategories : undefined,
        allowed_tests: allowedTests.length > 0 ? allowedTests : undefined
      } : null);

      alert('Права доступа успешно обновлены');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Ошибка при сохранении прав доступа');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (catName: string) => {
    setAllowedCategories(prev => 
      prev.includes(catName) 
        ? prev.filter(c => c !== catName)
        : [...prev, catName]
    );
  };

  const toggleTest = (testId: string) => {
    setAllowedTests(prev => 
      prev.includes(testId)
        ? prev.filter(t => t !== testId)
        : [...prev, testId]
    );
  };

  const toggleCategoryExpansion = (catName: string) => {
    setExpandedCategories(prev => 
      prev.includes(catName) 
        ? prev.filter(c => c !== catName)
        : [...prev, catName]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[#00f2ff] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-white/50">Профиль не найден</div>
        <button 
          onClick={() => navigate('/admin')}
          className="px-6 py-2 glass-button text-sm"
        >
          Вернуться назад
        </button>
      </div>
    );
  }

  const stats = [
    { label: 'Тестов пройдено', value: results.length, icon: Award, color: 'text-[#00f2ff]' },
    { 
      label: 'Средний балл', 
      value: (() => {
        const filteredResults = results.filter(r => {
          const test = customTests.find(t => t.topic === r.topic);
          return test?.include_in_average !== false;
        });
        if (filteredResults.length === 0) return '0%';
        const avg = Math.round(filteredResults.reduce((acc, r) => acc + (Object.values(r.scores).reduce((a, b) => Number(a) + Number(b), 0) as number) / Object.values(r.scores).length, 0) / filteredResults.length);
        return `${avg}%`;
      })(), 
      icon: TrendingUp, 
      color: 'text-emerald-400' 
    },
    { label: 'Последняя активность', value: results.length > 0 ? new Date(results[0].created_at).toLocaleDateString() : 'Нет данных', icon: Clock, color: 'text-purple-400' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 p-4 md:p-8"
    >
      <button 
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад в настройки
      </button>

      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f2ff]/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
          <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-[#00f2ff]/20 to-[#7000ff]/20 flex items-center justify-center border border-white/10 shadow-2xl">
            <User className="w-16 h-16 text-[#00f2ff]" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h2 className="text-4xl font-bold tracking-tight mb-2">
              {profile.last_name} <span className="text-[#00f2ff]">{profile.first_name}</span>
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-white/50 text-sm font-medium">
                <Mail className="w-4 h-4" />
                {profile.email}
              </div>
              <div className="flex items-center gap-2 text-white/50 text-sm font-medium">
                <Shield className="w-4 h-4" />
                <span className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-widest",
                  profile.role === 'curator' ? "bg-[#7000ff]/20 text-[#7000ff] border border-[#7000ff]/30" : "bg-white/5 text-white/40 border border-white/10"
                )}>
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-card p-6 flex items-center gap-4"
          >
            <div className={cn("p-3 rounded-xl bg-white/5", stat.color)}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-white/40 uppercase font-bold tracking-widest">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6 space-y-6 md:col-span-2">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff] flex items-center gap-2">
            <Award className="w-4 h-4" />
            История диагностик
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(
              results.reduce((acc, res) => {
                if (!acc[res.topic]) acc[res.topic] = [];
                acc[res.topic].push(res);
                return acc;
              }, {} as Record<string, TestResult[]>)
            ).map(([topic, topicResults]) => {
              const latest = topicResults[0];
              const best = [...topicResults].sort((a, b) => {
                const scoreA = Object.values(a.scores).reduce((sum, s) => sum + s, 0) / Object.values(a.scores).length;
                const scoreB = Object.values(b.scores).reduce((sum, s) => sum + s, 0) / Object.values(b.scores).length;
                return scoreB - scoreA;
              })[0];
              
              const bestScore = Math.round(Object.values(best.scores).reduce((sum, s) => sum + s, 0) / Object.values(best.scores).length);
              const isExpanded = expandedCategories.includes(`history_${topic}`);

              return (
                <div key={topic} className="glass-card bg-white/5 border-white/5 overflow-hidden">
                  <div 
                    onClick={() => toggleCategoryExpansion(`history_${topic}`)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm",
                        bestScore >= 80 ? "bg-emerald-500/10 text-emerald-400" :
                        bestScore >= 50 ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-red-500/10 text-red-400"
                      )}>
                        {bestScore}%
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white/90">{topic}</div>
                        <div className="text-[10px] text-white/30 uppercase tracking-widest">
                          Попыток: {topicResults.length} • Последняя: {new Date(latest.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/5 bg-black/20"
                      >
                        {topicResults.map((res, idx) => {
                          const avg = Math.round(Object.values(res.scores).reduce((sum, s) => sum + s, 0) / Object.values(res.scores).length);
                          return (
                            <div 
                              key={res.id}
                              onClick={() => navigate(`/results/${res.id}`, { state: { result: res } })}
                              className="p-3 pl-12 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-mono text-white/20">#{topicResults.length - idx}</span>
                                <span className="text-xs text-white/60">{new Date(res.created_at).toLocaleString()}</span>
                                {res.file_url && <Paperclip className="w-3 h-3 text-[#00f2ff]" />}
                              </div>
                              <div className={cn(
                                "text-xs font-mono font-bold",
                                avg >= 80 ? "text-emerald-400" :
                                avg >= 50 ? "text-yellow-400" :
                                "text-red-400"
                              )}>
                                {avg}%
                              </div>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {results.length === 0 && (
              <div className="col-span-2 text-center py-12 text-white/20 text-sm font-mono italic">НЕТ_ДАННЫХ_О_ТЕСТАХ</div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff] flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Управление доступом
            </h3>
            <button
              onClick={() => setIsAccessModalOpen(true)}
              className="px-4 py-2 glass-button text-sm flex items-center gap-2 text-[#00f2ff] hover:bg-[#00f2ff]/10 transition-all"
            >
              <Shield className="w-4 h-4" />
              Доступы
            </button>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-2">Активные права</div>
            <div className="flex flex-wrap gap-2">
              {allowedCategories.map(cat => (
                <span key={cat} className="px-2 py-1 rounded-md bg-[#00f2ff]/10 text-[#00f2ff] text-[10px] font-bold border border-[#00f2ff]/20">
                  {cat}
                </span>
              ))}
              {allowedTests.map(testId => {
                const test = customTests.find(t => t.id === testId);
                return (
                  <span key={testId} className="px-2 py-1 rounded-md bg-[#7000ff]/10 text-[#7000ff] text-[10px] font-bold border border-[#7000ff]/20">
                    {test?.topic || 'Тест'}
                  </span>
                );
              })}
              {allowedCategories.length === 0 && allowedTests.length === 0 && (
                <span className="text-xs text-white/20 italic">Доступ ко всем материалам</span>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-6">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff] flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Служебная информация
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-sm text-white/40">Компания</span>
              <span className="text-sm font-bold">{profile.company || '—'}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-sm text-white/40">Подразделение</span>
              <span className="text-sm font-bold">{profile.department || '—'}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-sm text-white/40">Должность</span>
              <span className="text-sm font-bold">{profile.position || '—'}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-sm text-white/40">Дата регистрации</span>
              <span className="text-sm font-bold">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Не указана'}</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAccessModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccessModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-2xl p-6 md:p-10 relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00e5ff] to-[#7000ff]" />
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 glass-button flex items-center justify-center text-[#00e5ff]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Настройка доступов</h2>
                    <p className="text-white/30 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Управление категориями и тестами</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAccessModalOpen(false)}
                  className="w-10 h-10 glass-button flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 mb-8">
                {categories.map(cat => {
                  const isExpanded = expandedCategories.includes(cat.name);
                  const isCatAllowed = allowedCategories.includes(cat.name);
                  const catTests = customTests.filter(t => t.category === cat.name);

                  return (
                    <div key={cat.id} className="space-y-2">
                      <div className={cn(
                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                        isCatAllowed ? "bg-[#00e5ff]/10 border-[#00e5ff]/30" : "bg-white/5 border-white/5"
                      )}>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => toggleCategory(cat.name)}
                            className={cn(
                              "w-6 h-6 rounded border flex items-center justify-center transition-all",
                              isCatAllowed ? "bg-[#00e5ff] border-[#00e5ff] text-black" : "border-white/20 text-transparent"
                            )}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <span className={cn("font-bold transition-colors", isCatAllowed ? "text-[#00e5ff]" : "text-white/70")}>
                            {cat.name}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleCategoryExpansion(cat.name)}
                          className="p-2 glass-button text-white/40 hover:text-white transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden pl-10 space-y-2"
                          >
                            {catTests.map(test => {
                              const isTestAllowed = allowedTests.includes(test.id!);
                              return (
                                <div 
                                  key={test.id}
                                  className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border transition-all",
                                    isTestAllowed ? "bg-[#7000ff]/10 border-[#7000ff]/30" : "bg-white/5 border-white/5"
                                  )}
                                >
                                  <span className={cn("text-sm transition-colors", isTestAllowed ? "text-[#7000ff]" : "text-white/40")}>
                                    {test.topic}
                                  </span>
                                  <button
                                    onClick={() => toggleTest(test.id!)}
                                    className={cn(
                                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                      isTestAllowed ? "bg-[#7000ff] border-[#7000ff] text-white" : "border-white/10 text-transparent"
                                    )}
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                            {catTests.length === 0 && (
                              <div className="text-[10px] text-white/20 italic p-2">Нет индивидуальных тестов в этой категории</div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <p className="text-[10px] text-white/20 italic max-w-[60%]">
                  * Выбор категории открывает доступ ко всем тестам в ней. 
                  Выбор отдельного теста дает доступ только к нему.
                </p>
                <button
                  onClick={async () => {
                    await handleSavePermissions();
                    setIsAccessModalOpen(false);
                  }}
                  disabled={saving}
                  className="px-8 py-3 glass-button text-[#00e5ff] font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-[#00e5ff]/10 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Сохранить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
