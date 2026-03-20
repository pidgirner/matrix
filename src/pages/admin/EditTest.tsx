import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Save, Trash2, Wand2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { CustomTest, Question } from '@/types';
import { generateTest as generateAITest } from '@/services/geminiService';
import { supabase } from '@/supabase';
import { cn } from '@/lib/utils';

export function EditTest() {
  const navigate = useNavigate();
  const location = useLocation();
  const test = location.state?.test as CustomTest;
  
  const { categories, showModal, refreshCustomTests } = useApp();
  const [editingTest, setEditingTest] = useState<CustomTest | null>(test || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!test) {
      navigate('/admin');
    }
  }, [test, navigate]);

  if (!editingTest) return null;

  const generateTest = async (category: string, topic: string) => {
    try {
      return await generateAITest(category, topic, 3);
    } catch (error) {
      console.error('AI Generation error:', error);
      throw error;
    }
  };

  const updateTest = async (testData: CustomTest) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('custom_tests')
        .update({
          category: testData.category,
          topic: testData.topic,
          questions: testData.questions,
          allow_file_upload: testData.allow_file_upload,
          allow_text_input: testData.allow_text_input,
          has_timer: testData.has_timer,
          time_limit: testData.time_limit,
          has_attempts_limit: testData.has_attempts_limit,
          attempts_limit: testData.attempts_limit,
          include_in_average: testData.include_in_average ?? true
        })
        .eq('id', testData.id);

      if (error) throw error;
      
      showModal('Успех', 'Тест успешно обновлен');
      refreshCustomTests();
      navigate('/admin');
    } catch (error: any) {
      console.error('Update test error:', error);
      showModal('Ошибка', error.message || 'Не удалось обновить тест');
    } finally {
      setLoading(false);
    }
  };

  const onBack = () => navigate('/admin');

  return (
    <motion.div 
      key="edit-test"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center gap-6 mb-10">
        <button 
          onClick={onBack} 
          className="w-12 h-12 glass-button flex items-center justify-center text-white/60 hover:text-[#00f2ff] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Редактировать <span className="text-[#00f2ff]">тест</span></h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Изменить существующий тест</p>
        </div>
      </div>

      <div className="glass-card p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Категория</label>
            <select 
              value={editingTest.category}
              onChange={(e) => setEditingTest({ ...editingTest, category: e.target.value })}
              className="w-full p-4 glass-input text-white bg-black/40"
            >
              {categories.map(c => <option key={c.id} value={c.name} className="bg-[#050505]">{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Тема</label>
            <div className="flex gap-2">
              <input 
                value={editingTest.topic}
                onChange={(e) => setEditingTest({ ...editingTest, topic: e.target.value })}
                className="flex-1 p-4 glass-input text-white"
                placeholder="например, React Hooks"
              />
              <button
                onClick={async () => {
                  if (!editingTest.category || !editingTest.topic) {
                    showModal('Ошибка', 'Пожалуйста, сначала укажите Категорию и Тему');
                    return;
                  }
                  setLoading(true);
                  try {
                    const aiQuestions = await generateTest(editingTest.category, editingTest.topic);
                    setEditingTest({ ...editingTest, questions: [...editingTest.questions, ...aiQuestions] });
                    showModal('Успех', `Успешно сгенерировано ${aiQuestions.length} вопросов`);
                  } catch (err) {
                    showModal('Ошибка', 'Не удалось сгенерировать тест с помощью ИИ');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-4 glass-button text-[#00f2ff] flex items-center gap-2 hover:bg-[#00f2ff]/10 transition-all"
                title="Сгенерировать с помощью ИИ"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                <span className="text-[10px] font-bold uppercase tracking-widest">ИИ</span>
              </button>
            </div>
          </div>
          
          <div className="md:col-span-2 flex flex-wrap gap-8 pt-4 border-t border-white/5">
            <div className="w-full flex flex-wrap gap-8 mb-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setEditingTest({ ...editingTest, has_timer: !editingTest.has_timer })}
                  className={cn(
                    "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                    editingTest.has_timer ? "bg-[#00f2ff] border-[#00f2ff] text-black" : "glass-button text-transparent"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Ограничить по времени</span>
              </label>

              {editingTest.has_timer && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                  <input 
                    type="number"
                    value={Math.floor((editingTest.time_limit || 0) / 60)}
                    onChange={(e) => setEditingTest({ ...editingTest, time_limit: parseInt(e.target.value) * 60 })}
                    className="w-20 p-2 glass-input text-white text-center text-sm"
                    min="1"
                  />
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">минут</span>
                </div>
              )}
            </div>

            <div className="w-full flex flex-wrap gap-8 mb-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setEditingTest({ ...editingTest, has_attempts_limit: !editingTest.has_attempts_limit })}
                  className={cn(
                    "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                    editingTest.has_attempts_limit ? "bg-[#00f2ff] border-[#00f2ff] text-black" : "glass-button text-transparent"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Ограничить количество попыток</span>
              </label>

              {editingTest.has_attempts_limit && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                  <input 
                    type="number"
                    value={editingTest.attempts_limit || 1}
                    onChange={(e) => setEditingTest({ ...editingTest, attempts_limit: parseInt(e.target.value) })}
                    className="w-20 p-2 glass-input text-white text-center text-sm"
                    min="1"
                  />
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">попыток</span>
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setEditingTest({ ...editingTest, allow_file_upload: !editingTest.allow_file_upload })}
                className={cn(
                  "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                  editingTest.allow_file_upload ? "bg-[#00f2ff] border-[#00f2ff] text-black" : "glass-button text-transparent"
                )}
              >
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Добавить файл (до 10МБ)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setEditingTest({ ...editingTest, allow_text_input: !editingTest.allow_text_input })}
                className={cn(
                  "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                  editingTest.allow_text_input ? "bg-[#00f2ff] border-[#00f2ff] text-black" : "glass-button text-transparent"
                )}
              >
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Окно ввода (до 500 симв.)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setEditingTest({ ...editingTest, include_in_average: !editingTest.include_in_average })}
                className={cn(
                  "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                  editingTest.include_in_average !== false ? "bg-[#00f2ff] border-[#00f2ff] text-black" : "glass-button text-transparent"
                )}
              >
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Учитывать в общих результатах</span>
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-[#00f2ff]">Вопросы ({editingTest.questions.length})</h3>
            <button 
              onClick={() => {
                setEditingTest({
                  ...editingTest,
                  questions: [{ type: 'standard', question: 'Новый вопрос', options: ['', '', '', ''], correctIndex: 0, explanation: '', skill: '' }, ...editingTest.questions]
                });
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-[#00f2ff] transition-colors flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              Добавить наверх
            </button>
          </div>
          {editingTest.questions.map((q, qIdx) => (
            <div key={qIdx} className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Вопрос {qIdx + 1}</span>
                <button 
                  onClick={() => {
                    const newQuestions = [...editingTest.questions];
                    newQuestions.splice(qIdx, 1);
                    setEditingTest({ ...editingTest, questions: newQuestions });
                  }}
                  className="text-red-400/60 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input 
                value={q.question}
                onChange={(e) => {
                  const newQuestions = [...editingTest.questions];
                  newQuestions[qIdx].question = e.target.value;
                  setEditingTest({ ...editingTest, questions: newQuestions });
                }}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-[8px] uppercase font-bold tracking-[0.2em] text-white/20 ml-1">Тип вопроса</label>
                  <select 
                    value={q.type || 'standard'}
                    onChange={(e) => {
                      const newQuestions = [...editingTest.questions];
                      newQuestions[qIdx].type = e.target.value as 'standard' | 'nps';
                      setEditingTest({ ...editingTest, questions: newQuestions });
                    }}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs"
                  >
                    <option value="standard" className="bg-[#050505]">С правильным ответом</option>
                    <option value="nps" className="bg-[#050505]">Шкала (1-5 баллов)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[8px] uppercase font-bold tracking-[0.2em] text-white/20 ml-1">Навык / Компетенция</label>
                  <input 
                    value={q.skill || ''}
                    onChange={(e) => {
                      const newQuestions = [...editingTest.questions];
                      newQuestions[qIdx].skill = e.target.value;
                      setEditingTest({ ...editingTest, questions: newQuestions });
                    }}
                    placeholder="например, Hooks, Синтаксис, Память"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[8px] uppercase font-bold tracking-[0.2em] text-white/20 ml-1">Объяснение</label>
                  <textarea 
                    value={q.explanation || ''}
                    onChange={(e) => {
                      const newQuestions = [...editingTest.questions];
                      newQuestions[qIdx].explanation = e.target.value;
                      setEditingTest({ ...editingTest, questions: newQuestions });
                    }}
                    placeholder="Почему это правильно..."
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white text-xs h-[42px] resize-none"
                  />
                </div>
              </div>
              
              {(!q.type || q.type === 'standard') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-3">
                      <input 
                        type="radio"
                        checked={q.correctIndex === oIdx}
                        onChange={() => {
                          const newQuestions = [...editingTest.questions];
                          newQuestions[qIdx].correctIndex = oIdx;
                          setEditingTest({ ...editingTest, questions: newQuestions });
                        }}
                        className="accent-[#00f2ff]"
                      />
                      <input 
                        value={opt}
                        onChange={(e) => {
                          const newQuestions = [...editingTest.questions];
                          newQuestions[qIdx].options[oIdx] = e.target.value;
                          setEditingTest({ ...editingTest, questions: newQuestions });
                        }}
                        className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs"
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {q.type === 'nps' && (
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className="text-xs text-white/60 mb-3">Пользователю будет предложено оценить от 1 до 5 баллов.</p>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map(score => (
                      <div key={score} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 font-bold text-xs">
                        {score}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <button 
            onClick={() => {
              setEditingTest({
                ...editingTest,
                questions: [...editingTest.questions, { type: 'standard', question: 'Новый вопрос', options: ['', '', '', ''], correctIndex: 0, explanation: '', skill: '' }]
              });
            }}
            className="w-full py-4 border border-dashed border-white/20 rounded-2xl text-white/40 hover:text-[#00f2ff] hover:border-[#00f2ff]/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Добавить вопрос вручную</span>
          </button>
        </div>

        <button 
          onClick={() => updateTest(editingTest)}
          disabled={loading}
          className="w-full py-5 glass-button-primary flex items-center justify-center gap-3 group"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
          <span>Сохранить изменения</span>
        </button>
      </div>
    </motion.div>
  );
}
