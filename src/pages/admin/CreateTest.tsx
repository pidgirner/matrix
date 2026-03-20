import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus, Save, Trash2, Wand2, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { CustomTest } from '@/types';
import { generateTest } from '@/services/geminiService';
import { supabase } from '@/supabase';

export function CreateTest() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { categories, showModal, refreshCustomTests } = useApp();
  const [loading, setLoading] = useState(false);
  const [newTest, setNewTest] = useState<Partial<CustomTest>>({
    category: categories[0]?.name || '',
    topic: '',
    questions: [],
    allow_file_upload: false,
    allow_text_input: false,
    has_timer: false,
    time_limit: 300, // Default 5 minutes in seconds
    has_attempts_limit: false,
    attempts_limit: 1,
    include_in_average: true
  });

  const generateQuestionsAI = async () => {
    if (!newTest.topic || !newTest.category) {
      showModal('Ошибка', 'Укажите категорию и тему для генерации вопросов');
      return;
    }

    setLoading(true);
    try {
      const generatedQuestions = await generateTest(newTest.category, newTest.topic, 5);

      setNewTest(prev => ({
        ...prev,
        questions: [...(prev.questions || []), ...generatedQuestions]
      }));
      
      showModal('Успех', `Сгенерировано ${generatedQuestions.length} вопросов`);
    } catch (error) {
      console.error('AI Generation error:', error);
      showModal('Ошибка', 'Не удалось сгенерировать вопросы с помощью ИИ');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setNewTest(prev => ({
      ...prev,
      questions: [
        ...(prev.questions || []),
        { type: 'standard', question: '', options: ['', '', '', ''], correctIndex: 0, skill: '' }
      ]
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setNewTest(prev => {
      const questions = [...(prev.questions || [])];
      questions[index] = { ...questions[index], [field]: value };
      return { ...prev, questions };
    });
  };

  const removeQuestion = (index: number) => {
    setNewTest(prev => {
      const questions = [...(prev.questions || [])];
      questions.splice(index, 1);
      return { ...prev, questions };
    });
  };

  const saveTest = async () => {
    if (!newTest.topic || !newTest.category || !newTest.questions?.length) {
      showModal('Ошибка', 'Заполните все обязательные поля и добавьте хотя бы один вопрос');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('custom_tests').insert([{
        category: newTest.category,
        topic: newTest.topic,
        questions: newTest.questions,
        allow_file_upload: newTest.allow_file_upload,
        allow_text_input: newTest.allow_text_input,
        has_timer: newTest.has_timer,
        time_limit: newTest.time_limit,
        has_attempts_limit: newTest.has_attempts_limit,
        attempts_limit: newTest.attempts_limit,
        include_in_average: newTest.include_in_average ?? true,
        created_by: profile?.id,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      
      showModal('Успех', 'Тест успешно сохранен');
      refreshCustomTests();
      navigate('/admin');
    } catch (error: any) {
      console.error('Save test error:', error);
      showModal('Ошибка', error.message || 'Не удалось сохранить тест');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      key="create-test"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-6 mb-10">
        <button 
          onClick={() => navigate('/admin')} 
          className="w-12 h-12 glass-button flex items-center justify-center text-white/60 hover:text-[#00f2ff] transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Создание <span className="text-[#00f2ff]">теста</span></h2>
        </div>
      </div>

      <div className="space-y-10">
        <div className="glass-card p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Категория</label>
            <select 
              value={newTest.category}
              onChange={(e) => setNewTest({ ...newTest, category: e.target.value })}
              className="w-full p-4 glass-input text-white bg-black/40"
            >
              {categories.map(c => <option key={c.id} value={c.name} className="bg-[#050505]">{c.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Тема теста</label>
            <input 
              type="text"
              value={newTest.topic}
              onChange={(e) => setNewTest({ ...newTest, topic: e.target.value })}
              placeholder="например, Продвинутые паттерны React"
              className="w-full p-4 glass-input text-white"
            />
          </div>
          
          <div className="md:col-span-2 flex flex-wrap gap-8 pt-4 border-t border-white/5">
            <div className="w-full flex flex-wrap gap-8 mb-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setNewTest({ ...newTest, has_timer: !newTest.has_timer })}
                  className={cn(
                    "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                    newTest.has_timer ? "bg-[#00f2ff] border-[#00f2ff] text-black" : "glass-button text-transparent"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Ограничить по времени</span>
              </label>

              {newTest.has_timer && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                  <input 
                    type="number"
                    value={Math.floor((newTest.time_limit || 0) / 60)}
                    onChange={(e) => setNewTest({ ...newTest, time_limit: parseInt(e.target.value) * 60 })}
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
                  onClick={() => setNewTest({ ...newTest, has_attempts_limit: !newTest.has_attempts_limit })}
                  className={cn(
                    "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                    newTest.has_attempts_limit ? "bg-[#00f2ff] border-[#00f2ff] text-black" : "glass-button text-transparent"
                  )}
                >
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Ограничить количество попыток</span>
              </label>

              {newTest.has_attempts_limit && (
                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                  <input 
                    type="number"
                    value={newTest.attempts_limit || 1}
                    onChange={(e) => setNewTest({ ...newTest, attempts_limit: parseInt(e.target.value) })}
                    className="w-20 p-2 glass-input text-white text-center text-sm"
                    min="1"
                  />
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/30">попыток</span>
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setNewTest({ ...newTest, allow_file_upload: !newTest.allow_file_upload })}
                className={cn(
                  "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                  newTest.allow_file_upload ? "bg-[#00f2ff] border-[#00f2ff] text-black" : "glass-button text-transparent"
                )}
              >
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Добавить файл (до 10МБ)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setNewTest({ ...newTest, allow_text_input: !newTest.allow_text_input })}
                className={cn(
                  "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                  newTest.allow_text_input ? "bg-[#00f2ff] border-[#00f2ff] text-black" : "glass-button text-transparent"
                )}
              >
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Окно ввода (до 500 симв.)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div 
                onClick={() => setNewTest({ ...newTest, include_in_average: !newTest.include_in_average })}
                className={cn(
                  "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                  newTest.include_in_average !== false ? "bg-[#00f2ff] border-[#00f2ff] text-black" : "glass-button text-transparent"
                )}
              >
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Учитывать в общих результатах</span>
            </label>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <h3 className="text-xl font-bold tracking-tight flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-[#00f2ff]" />
              Вопросы ({newTest.questions?.length || 0})
            </h3>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={generateQuestionsAI}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-3 glass-button text-xs font-bold text-purple-400 border-purple-400/20 hover:bg-purple-400/10 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                Синтез ИИ
              </button>
              <button 
                onClick={addQuestion}
                className="flex items-center gap-2 px-5 py-3 glass-button text-xs font-bold text-[#00f2ff] border-[#00f2ff]/20 hover:bg-[#00f2ff]/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                Добавить вопрос
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {newTest.questions?.map((q, qIdx) => (
              <div key={qIdx} className="glass-card p-8 relative group">
                <button 
                  onClick={() => removeQuestion(qIdx)}
                  className="absolute top-6 right-6 p-3 glass-button text-white/20 hover:text-red-400 hover:border-red-400/30 transition-all opacity-0 group-hover:opacity-100"
                  title="Удалить вопрос"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Вопрос {qIdx + 1}</label>
                    <input 
                      type="text"
                      value={q.question}
                      onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                      className="w-full p-4 glass-input text-white font-medium"
                      placeholder="Введите вопрос..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Тип вопроса</label>
                    <select 
                      value={q.type || 'standard'}
                      onChange={(e) => updateQuestion(qIdx, 'type', e.target.value)}
                      className="w-full p-4 glass-input text-white bg-black/40"
                    >
                      <option value="standard" className="bg-[#050505]">С правильным ответом</option>
                      <option value="nps" className="bg-[#050505]">Шкала (1-5 баллов)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-bold tracking-[0.2em] text-white/30 ml-1">Навык / Компетенция</label>
                    <input 
                      type="text"
                      value={q.skill}
                      onChange={(e) => updateQuestion(qIdx, 'skill', e.target.value)}
                      placeholder="например, Логика"
                      className="w-full p-4 glass-input text-white"
                    />
                  </div>
                </div>

                {(!q.type || q.type === 'standard') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => updateQuestion(qIdx, 'correctIndex', oIdx)}
                          className={cn(
                            "w-10 h-10 flex items-center justify-center text-xs font-bold rounded-xl border transition-all shrink-0",
                            q.correctIndex === oIdx 
                              ? "bg-[#00f2ff] border-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]" 
                              : "glass-button text-white/40"
                          )}
                        >
                          {oIdx + 1}
                        </button>
                        <input 
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const opts = [...q.options];
                            opts[oIdx] = e.target.value;
                            updateQuestion(qIdx, 'options', opts);
                          }}
                          className="flex-1 p-4 glass-input text-sm text-white/80 focus:text-white"
                          placeholder={`Вариант ${oIdx + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
                
                {q.type === 'nps' && (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-sm text-white/60 mb-4">Пользователю будет предложено оценить от 1 до 5 баллов.</p>
                    <div className="flex justify-center gap-4">
                      {[1, 2, 3, 4, 5].map(score => (
                        <div key={score} className="w-12 h-12 rounded-full glass-button flex items-center justify-center text-white/40 font-bold">
                          {score}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button 
            onClick={addQuestion}
            className="w-full py-4 border border-dashed border-white/20 rounded-2xl text-white/40 hover:text-[#00f2ff] hover:border-[#00f2ff]/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Добавить вопрос вручную</span>
          </button>

          {newTest.questions && newTest.questions.length > 0 && (
            <button 
              onClick={saveTest}
              disabled={loading}
              className="w-full py-5 glass-button-primary flex items-center justify-center gap-3 group disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
              <span>Сохранить тест</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
