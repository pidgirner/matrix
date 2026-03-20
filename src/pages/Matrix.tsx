import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Search, Table2, Download, Paperclip, Clock, X, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/supabase';
import { UserProfile, TestResult, CustomTest } from '@/types';

// Extended type to include attempt_count from the View
interface LatestMatrixResult extends TestResult {
  attempt_count: number;
}

export const Matrix = () => {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [results, setResults] = useState<LatestMatrixResult[]>([]);
  const [customTests, setCustomTests] = useState<Partial<CustomTest>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistory, setSelectedHistory] = useState<{
    userName: string;
    topic: string;
    attempts: TestResult[];
    loading: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchMatrixData = async () => {
      try {
        const [profilesRes, resultsRes] = await Promise.all([
          supabase.from('profiles').select('*').order('last_name', { ascending: true }),
          supabase.from('matrix_latest_results').select('*')
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (resultsRes.error) throw resultsRes.error;

        setProfiles(profilesRes.data || []);
        setResults(resultsRes.data as LatestMatrixResult[] || []);

        // Fetch custom tests separately so it doesn't block the whole matrix if column is missing
        try {
          const { data: testsData, error: testsError } = await supabase
            .from('custom_tests')
            .select('topic, include_in_average');
          
          if (!testsError && testsData) {
            setCustomTests(testsData);
          } else {
            // Fallback: try fetching just topics
            const { data: fallbackData } = await supabase
              .from('custom_tests')
              .select('topic');
            if (fallbackData) {
              setCustomTests(fallbackData.map(t => ({ ...t, include_in_average: true })));
            }
          }
        } catch (e) {
          console.warn('Failed to fetch custom tests settings:', e);
        }
      } catch (error) {
        console.error('Error fetching matrix data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatrixData();
  }, []);

  const loadHistory = async (userId: string, userName: string, topic: string) => {
    setSelectedHistory({ userName, topic, attempts: [], loading: true });
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('user_id', userId)
        .eq('topic', topic)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSelectedHistory({ userName, topic, attempts: data || [], loading: false });
    } catch (e) {
      console.error('Failed to load history', e);
      setSelectedHistory({ userName, topic, attempts: [], loading: false });
    }
  };

  // Extract unique departments for the filter
  const departments = useMemo(() => {
    const deps = new Set(profiles.map(p => p.department).filter(Boolean));
    return Array.from(deps).sort();
  }, [profiles]);

  // Extract unique companies for the filter
  const companies = useMemo(() => {
    const comps = new Set(profiles.map(p => p.company).filter(Boolean));
    return Array.from(comps).sort();
  }, [profiles]);

  // Extract unique positions for the filter
  const positions = useMemo(() => {
    const pos = new Set(profiles.map(p => p.position).filter(Boolean));
    return Array.from(pos).sort();
  }, [profiles]);

  // Process data for the matrix
  const matrixData = useMemo(() => {
    // Filter profiles
    let filteredProfiles = profiles;
    if (selectedDepartment !== 'all') {
      filteredProfiles = filteredProfiles.filter(p => p.department === selectedDepartment);
    }
    if (selectedCompany !== 'all') {
      filteredProfiles = filteredProfiles.filter(p => p.company === selectedCompany);
    }
    if (selectedPosition !== 'all') {
      filteredProfiles = filteredProfiles.filter(p => p.position === selectedPosition);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredProfiles = filteredProfiles.filter(p => 
        `${p.last_name} ${p.first_name} ${p.position}`.toLowerCase().includes(term)
      );
    }

    // Filter results by date range
    let filteredResults = results;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filteredResults = filteredResults.filter(r => new Date(r.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredResults = filteredResults.filter(r => new Date(r.created_at) <= end);
    }

    // Map results by user_id and topic (all are latest already!)
    const userTopicData: Record<string, Record<string, { score: number; file_url?: string; attempt_count: number }>> = {};
    const allTopicsSet = new Set<string>();

    // Create a set of filtered user IDs for quick lookup
    const filteredUserIds = new Set(filteredProfiles.map(p => p.id));

    filteredResults.forEach(res => {
      // Only process results for users in the filtered list
      if (!filteredUserIds.has(res.user_id)) return;

      if (!userTopicData[res.user_id]) {
        userTopicData[res.user_id] = {};
      }
      
      // Calculate average score for this specific test result
      const scoreValues = Object.values(res.scores || {}) as number[];
      const avgScore = scoreValues.length > 0 
        ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length 
        : 0;

      userTopicData[res.user_id][res.topic] = {
        score: Math.round(avgScore),
        file_url: res.file_url,
        attempt_count: res.attempt_count
      };
      allTopicsSet.add(res.topic);
    });

    const allTopics = Array.from(allTopicsSet).sort();

    // Build rows
    const rows = filteredProfiles.map(profile => {
      const userData = userTopicData[profile.id] || {};
      
      // Calculate overall average for this user across all topics they took
      // Exclude topics that are marked as not to be included in average
      const takenTopics = Object.entries(userData).filter(([topic]) => {
        const test = customTests.find(t => t.topic === topic);
        return test?.include_in_average !== false;
      }).map(([_, data]) => data);

      const overallAvg = takenTopics.length > 0 
        ? Math.round(takenTopics.reduce((a, b) => a + b.score, 0) / takenTopics.length)
        : null;

      return {
        id: profile.id,
        fullName: `${profile.last_name} ${profile.first_name}`,
        position: profile.position || '—',
        department: profile.department || '—',
        scores: userData,
        overallAvg
      };
    });

    return { rows, allTopics };
  }, [profiles, results, customTests, selectedDepartment, selectedCompany, selectedPosition, searchTerm, startDate, endDate]);

  const handleExportXLSX = () => {
    if (matrixData.rows.length === 0) return;

    const headers = ['ФИО', 'Подразделение', 'Должность', ...matrixData.allTopics, 'Итог средний %'];
    
    const data = matrixData.rows.map(row => {
      const rowData: any = {
        'ФИО': row.fullName,
        'Подразделение': row.department,
        'Должность': row.position
      };
      
      matrixData.allTopics.forEach(topic => {
        rowData[topic] = row.scores[topic] !== undefined ? `${row.scores[topic]}%` : '-';
      });
      
      rowData['Итог средний %'] = row.overallAvg !== null ? `${row.overallAvg}%` : '-';
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Matrix");

    const companySuffix = selectedCompany === 'all' ? '' : `_${selectedCompany}`;
    const departmentSuffix = selectedDepartment === 'all' ? '' : `_${selectedDepartment}`;
    const positionSuffix = selectedPosition === 'all' ? '' : `_${selectedPosition}`;
    const dateSuffix = (startDate || endDate) ? `_${startDate || 'start'}_to_${endDate || 'end'}` : '';
    const fileName = `matrix${companySuffix}${departmentSuffix}${positionSuffix}${dateSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#00f2ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto p-4 md:p-8 space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Матрица <span className="text-[#00f2ff]">Компетенций</span></h2>
          <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Сводная таблица результатов тестирования</p>
        </div>
        <button
          onClick={handleExportXLSX}
          disabled={matrixData.rows.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          Экспорт XLSX
        </button>
      </div>

      <div className="glass-card p-6">
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="text"
                placeholder="Поиск по ФИО или должности..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-[#00f2ff]/50 transition-all"
              />
            </div>
            <div className="md:w-64 relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-[#00f2ff]/50 transition-all"
              />
              <div className="absolute -top-2 left-3 px-1 bg-[#1a1a1a] text-[8px] text-white/40 uppercase tracking-widest font-bold">От</div>
            </div>
            <div className="md:w-64 relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-[#00f2ff]/50 transition-all"
              />
              <div className="absolute -top-2 left-3 px-1 bg-[#1a1a1a] text-[8px] text-white/40 uppercase tracking-widest font-bold">До</div>
            </div>
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-all flex items-center gap-2"
                title="Сбросить даты"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-[#00f2ff]/50 transition-all appearance-none"
              >
                <option value="all">Все компании</option>
                {companies.map(comp => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-[#00f2ff]/50 transition-all appearance-none"
              >
                <option value="all">Все подразделения</option>
                {departments.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-[#00f2ff]/50 transition-all appearance-none"
              >
                <option value="all">Все должности</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar rounded-xl border border-white/5">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-[#050505] border-b border-white/10">
                <th className="p-4 text-[10px] uppercase font-bold text-white/40 tracking-wider sticky left-0 bg-[#050505] z-20 border-r border-white/5">ФИО</th>
                <th className="p-4 text-[10px] uppercase font-bold text-white/40 tracking-wider border-r border-white/5">Подразделение</th>
                <th className="p-4 text-[10px] uppercase font-bold text-white/40 tracking-wider border-r border-white/5">Должность</th>
                {matrixData.allTopics.map(topic => (
                  <th key={topic} className="p-4 text-[10px] uppercase font-bold text-white/40 tracking-wider text-center border-r border-white/5 max-w-[120px] truncate" title={topic}>
                    {topic}
                  </th>
                ))}
                <th className="p-4 text-[10px] uppercase font-bold text-[#00f2ff] tracking-wider text-center bg-[#00f2ff]/5">Итог средний %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {matrixData.rows.length === 0 ? (
                <tr>
                  <td colSpan={matrixData.allTopics.length + 3} className="p-12 text-center text-white/20 text-sm font-mono italic">
                    НЕТ ДАННЫХ ДЛЯ ОТОБРАЖЕНИЯ
                  </td>
                </tr>
              ) : (
                matrixData.rows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-medium text-sm text-white/90 sticky left-0 bg-[#050505] group-hover:bg-[#111] transition-colors z-10 border-r border-white/5 whitespace-nowrap">
                      {row.fullName}
                    </td>
                    <td className="p-4 text-xs text-white/60 border-r border-white/5 whitespace-nowrap">
                      {row.department}
                    </td>
                    <td className="p-4 text-xs text-white/60 border-r border-white/5 whitespace-nowrap">
                      {row.position}
                    </td>
                    {matrixData.allTopics.map(topic => {
                      const data = row.scores[topic];
                      return (
                        <td key={topic} className="p-4 text-center border-r border-white/5">
                          {data !== undefined ? (
                            <div className="flex flex-col items-center gap-1">
                              <button 
                                onClick={() => loadHistory(row.id, row.fullName, topic)}
                                className={`inline-flex items-center justify-center px-2 py-1 rounded text-xs font-mono font-bold transition-all hover:scale-110 ${
                                  data.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  data.score >= 50 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                  'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                              >
                                {data.score}%
                                {data.attempt_count > 1 && (
                                  <span className="ml-1 text-[8px] opacity-60">({data.attempt_count})</span>
                                )}
                              </button>
                              {data.file_url && (
                                <a 
                                  href={data.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center w-6 h-6 rounded-md bg-[#00f2ff]/10 text-[#00f2ff] hover:bg-[#00f2ff]/20 transition-all"
                                  title="Открыть вложение"
                                >
                                  <Paperclip className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-white/10">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-4 text-center bg-[#00f2ff]/5">
                      {row.overallAvg !== null ? (
                        <span className="font-mono font-bold text-sm text-[#00f2ff]">
                          {row.overallAvg}%
                        </span>
                      ) : (
                        <span className="text-white/10">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      <AnimatePresence>
        {selectedHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHistory(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-2xl p-6 md:p-10 relative z-10 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00e5ff] to-[#7000ff]" />
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 glass-button flex items-center justify-center text-[#00f2ff]">
                     {selectedHistory.loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">История попыток</h2>
                    <p className="text-white/30 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                      {selectedHistory.userName} — {selectedHistory.topic}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedHistory(null)}
                  className="w-10 h-10 glass-button flex items-center justify-center text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {selectedHistory.attempts.map((attempt, idx) => {
                  const scoreValues = Object.values(attempt.scores || {}) as number[];
                  const avgScore = scoreValues.length > 0 
                    ? Math.round(scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length)
                    : 0;

                  return (
                    <div 
                      key={attempt.id}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xs font-mono text-white/20">
                          #{selectedHistory.attempts.length - idx}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white/90">
                            {new Date(attempt.created_at).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {attempt.file_url && (
                              <a 
                                href={attempt.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-[#00f2ff] hover:underline"
                              >
                                <Paperclip className="w-3 h-3" />
                                Вложение
                              </a>
                            )}
                            {attempt.user_comment && (
                              <span className="text-[10px] text-white/30 italic truncate max-w-[200px]">
                                "{attempt.user_comment}"
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`text-xl font-mono font-bold ${
                          avgScore >= 80 ? 'text-emerald-400' :
                          avgScore >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {avgScore}%
                        </div>
                        <button 
                          onClick={() => {
                            // Navigate to results view
                            window.open(`/results/${attempt.id}`, '_blank');
                          }}
                          className="p-2 glass-button text-white/40 hover:text-[#00f2ff] transition-colors"
                          title="Открыть отчет"
                        >
                          <Table2 className="w-4 h-4" />
                        </button>
                      </div>
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
