import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Trophy, LayoutDashboard, Loader2, ArrowLeft, X, MessageSquare, FileText, Download, ExternalLink } from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { supabase } from '@/supabase';
import { TestResult } from '@/types';

export const ResultsView = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState<TestResult | null>(location.state?.result || null);
  const [loading, setLoading] = useState(!result);

  useEffect(() => {
    if (result) {
      console.log('ResultsView: result loaded', {
        id: result.id,
        topic: result.topic,
        file_url: result.file_url
      });
    }
    if (!result && id) {
      const fetchResult = async () => {
        try {
          const { data, error } = await supabase
            .from('results')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          setResult(data);
        } catch (error) {
          console.error("Error fetching result:", error);
          navigate('/');
        } finally {
          setLoading(false);
        }
      };
      fetchResult();
    }
  }, [id, result, navigate]);

  if (loading || !result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-[#00e5ff] animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto p-4 md:p-8"
    >
      <div className="flex items-start md:items-center justify-between mb-10 w-full gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Результаты</h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Просмотр завершенного отчета</p>
        </div>
        <button 
          onClick={() => navigate('/', { replace: true })} 
          className="w-12 h-12 glass-button flex items-center justify-center text-white/60 hover:text-[#00f2ff] transition-all shrink-0"
          title="Вернуться в дашборд"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="glass-card p-10">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 md:w-14 md:h-14 glass-button flex items-center justify-center text-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.2)] shrink-0">
              <Trophy className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Оценка завершена</h2>
            </div>
          </div>

          <div className="mb-10 p-6 glass-input border-white/5 relative overflow-hidden">
            {result.finished_by_timeout && (
              <div className="absolute top-0 right-0 px-3 py-1 bg-red-500/20 border-l border-b border-red-500/30 text-[8px] font-bold text-red-400 uppercase tracking-widest rounded-bl-lg">
                Завершено по времени
              </div>
            )}
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 mb-2">Тема диагностики</div>
            <div className="text-2xl font-bold text-[#00e5ff]">{result.topic}</div>
            {result.total_questions !== undefined && (
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                <span>Прогресс:</span>
                <span className="text-white/60">{result.answered_questions} из {result.total_questions} вопросов</span>
              </div>
            )}
          </div>

          <div className="space-y-6 mb-10">
            {Object.entries(result.scores).map(([skill, score]) => (
              <div key={skill} className="space-y-2">
                <div className="flex justify-between text-xs font-bold tracking-wider uppercase">
                  <span className="text-white/60">{skill}</span>
                  <span className="font-mono text-[#00e5ff]">{Math.round(Number(score))}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#00e5ff] to-[#7000ff]"
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {(result.user_comment || result.file_url) && (
            <div className="space-y-6 mb-10 pt-10 border-t border-white/5">
              {result.user_comment && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">
                    <MessageSquare className="w-3 h-3 text-[#00f2ff]" />
                    <span>Ответ пользователя</span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-sm text-white/80 leading-relaxed italic">
                    "{result.user_comment}"
                  </div>
                </div>
              )}

              {result.file_url && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">
                    <FileText className="w-3 h-3 text-[#00f2ff]" />
                    <span>Прикрепленный файл</span>
                  </div>
                  <a 
                    href={result.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#00f2ff]/10 flex items-center justify-center text-[#00f2ff]">
                        <Download className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium text-white/80">Скачать вложение</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-[#00f2ff] transition-colors" />
                  </a>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-4 glass-button-primary flex items-center justify-center gap-3"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Закрыть и вернуться</span>
          </button>
        </div>

        <div className="glass-card p-10 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-[#00e5ff]/5 to-transparent opacity-50" />
          <h3 className="text-xl font-bold mb-10 tracking-tight relative z-10">Нейронное <span className="text-[#00e5ff]">Отображение</span></h3>
          <div className="w-full h-[350px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={Object.entries(result.scores).map(([skill, score]) => ({ skill, score }))}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Оценка"
                  dataKey="score"
                  stroke="#00e5ff"
                  strokeWidth={2}
                  fill="#00e5ff"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
