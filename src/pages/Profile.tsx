import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Shield, Briefcase, Award, TrendingUp, Clock, LogOut, ChevronDown, ChevronUp, Paperclip } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/supabase';
import { cn } from '@/lib/utils';
import { TestResult } from '@/types';

export const Profile = () => {
  const { profile, userResults: results } = useAuth();
  const { customTests } = useApp();
  const navigate = useNavigate();
  const [expandedTopics, setExpandedTopics] = useState<string[]>([]);

  if (!profile) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const toggleTopic = (topic: string) => {
    setExpandedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

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
              <span className="text-sm font-bold">{profile.department}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-sm text-white/40">Должность</span>
              <span className="text-sm font-bold">{profile.position}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
              <span className="text-sm text-white/40">Дата регистрации</span>
              <span className="text-sm font-bold">{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Не указана'}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 space-y-6">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff] flex items-center gap-2">
            <Award className="w-4 h-4" />
            История диагностик
          </h3>
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
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
              const isExpanded = expandedTopics.includes(topic);

              return (
                <div key={topic} className="glass-card bg-white/5 border-white/5 overflow-hidden">
                  <div 
                    onClick={() => toggleTopic(topic)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-[10px]",
                        bestScore >= 80 ? "bg-emerald-500/10 text-emerald-400" :
                        bestScore >= 50 ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-red-500/10 text-red-400"
                      )}>
                        {bestScore}%
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white/90">{topic}</div>
                        <div className="text-[8px] text-white/30 uppercase tracking-widest">
                          Попыток: {topicResults.length}
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
                              className="p-2 pl-10 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-mono text-white/20">#{topicResults.length - idx}</span>
                                <span className="text-[10px] text-white/60">{new Date(res.created_at).toLocaleDateString()}</span>
                                {res.file_url && <Paperclip className="w-3 h-3 text-[#00f2ff]" />}
                              </div>
                              <div className={cn(
                                "text-[10px] font-mono font-bold",
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
              <div className="text-center py-8 text-white/20 text-sm font-mono italic">НЕТ_ДАННЫХ_О_ТЕСТАХ</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold">Выйти из аккаунта</span>
        </button>
      </div>
    </motion.div>
  );
};
