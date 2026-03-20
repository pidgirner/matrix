import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Award, 
  Clock, 
  Target, 
  Zap, 
  AlertCircle,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { profile, userResults: results } = useAuth();
  const { categories, customTests } = useApp();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    if (results.length === 0) return null;

    const filteredResults = results.filter(r => {
      const test = customTests.find(t => t.topic === r.topic);
      return test?.include_in_average !== false;
    });

    if (filteredResults.length === 0) {
      return {
        avgScore: 0,
        totalTests: results.length,
        lastActivity: new Date(results[0].created_at).toLocaleDateString(),
        completionRate: Math.round((results.length / 20) * 100)
      };
    }

    const avgScore = Math.round(
      filteredResults.reduce((acc, r) => {
        const scores = Object.values(r.scores) as number[];
        return acc + (scores.reduce((a, b) => a + b, 0) / scores.length);
      }, 0) / filteredResults.length
    );

    const latestResult = results[0];
    
    return {
      avgScore,
      totalTests: results.length,
      lastActivity: new Date(latestResult.created_at).toLocaleDateString(),
      completionRate: Math.round((results.length / 20) * 100) // Mock target of 20 tests
    };
  }, [results, customTests]);

  const radarData = useMemo(() => {
    return categories.map(cat => {
      const catResults = results.filter(r => {
        if (r.category !== cat.name) return false;
        const test = customTests.find(t => t.topic === r.topic);
        return test?.include_in_average !== false;
      });
      const avg = catResults.length > 0
        ? Math.round(
            catResults.reduce((acc, r) => {
              const scores = Object.values(r.scores) as number[];
              return acc + (scores.reduce((a, b) => a + b, 0) / scores.length);
            }, 0) / catResults.length
          )
        : 0;
      return {
        subject: cat.name,
        A: avg,
        fullMark: 100
      };
    }).filter(d => d.A > 0);
  }, [categories, results, customTests]);

  const progressData = useMemo(() => {
    return results
      .filter(r => {
        const test = customTests.find(t => t.topic === r.topic);
        return test?.include_in_average !== false;
      })
      .reverse()
      .map(r => ({
        date: new Date(r.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        score: Math.round((Object.values(r.scores) as number[]).reduce((a, b) => a + b, 0) / Object.values(r.scores).length)
      }));
  }, [results, customTests]);

  const topicData = useMemo(() => {
    const topics: Record<string, { score: number; count: number }> = {};
    results
      .filter(r => {
        const test = customTests.find(t => t.topic === r.topic);
        return test?.include_in_average !== false;
      })
      .forEach(r => {
        const avg = (Object.values(r.scores) as number[]).reduce((a, b) => a + b, 0) / Object.values(r.scores).length;
        if (!topics[r.topic] || avg > topics[r.topic].score) {
          topics[r.topic] = { score: Math.round(avg), count: (topics[r.topic]?.count || 0) + 1 };
        }
      });
    return Object.entries(topics)
      .map(([name, data]) => ({ name, score: data.score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [results, customTests]);

  if (!stats) {
    return (
      <div className="max-w-5xl mx-auto p-8 text-center">
        <div className="glass-card p-12 space-y-6">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <BarChart3 className="w-10 h-10 text-white/20" />
          </div>
          <h2 className="text-2xl font-bold">Ваш дашборд пуст</h2>
          <p className="text-white/40 max-w-md mx-auto">
            Пройдите хотя бы один тест, чтобы мы могли проанализировать ваши навыки и построить графики прогресса.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-[#00f2ff] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all"
          >
            К списку тестов
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Личный <span className="text-[#00f2ff]">Дашборд</span></h2>
          <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Анализ ваших компетенций и прогресса</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.avgScore}%</div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Средний балл</div>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#00f2ff]/10 text-[#00f2ff]">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.totalTests}</div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Тестов пройдено</div>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.lastActivity}</div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Активность</div>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Цель обучения</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart - Skills Distribution */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff] flex items-center gap-2">
              <PieChartIcon className="w-4 h-4" />
              Распределение навыков
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#00f2ff"
                  fill="#00f2ff"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart - Progress Over Time */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Динамика результатов
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                  dy={10}
                />
                <YAxis 
                  domain={[0, 100]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#00f2ff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#00f2ff" 
                  strokeWidth={3} 
                  dot={{ fill: '#00f2ff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bar Chart - Top Topics */}
        <div className="lg:col-span-2 glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff] flex items-center gap-2">
              <Award className="w-4 h-4" />
              Лучшие показатели по темам
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                  width={150}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                  {topicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights */}
        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff] flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Инсайты
          </h3>
          <div className="space-y-4">
            {topicData.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Сильная сторона</span>
                </div>
                <p className="text-sm text-white/70">
                  Вы отлично разбираетесь в теме <span className="text-white font-bold">"{topicData[0].name}"</span>. 
                  Это ваш лучший результат.
                </p>
              </div>
            )}
            
            {topicData.length > 1 && (
              <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10 space-y-2">
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Зона роста</span>
                </div>
                <p className="text-sm text-white/70">
                  Тема <span className="text-white font-bold">"{topicData[topicData.length - 1].name}"</span> требует дополнительного внимания для достижения целевых показателей.
                </p>
              </div>
            )}

            <button 
              onClick={() => navigate('/tests')}
              className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between group"
            >
              <span className="text-sm font-bold">Продолжить обучение</span>
              <ChevronRight className="w-4 h-4 text-[#00f2ff] group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
