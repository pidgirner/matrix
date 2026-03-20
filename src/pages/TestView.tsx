import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Loader2, Upload, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { generateTest } from '@/services/geminiService';
import { supabase } from '@/supabase';
import { TestResult, Question, CustomTest } from '@/types';
import { cn } from '@/lib/utils';

export const TestView = () => {
  const [searchParams] = useSearchParams();
  const categoryName = searchParams.get('category');
  const topic = searchParams.get('topic');
  const navigate = useNavigate();
  
  const { session, profile, userResults, loading: authLoading, refreshUserResults } = useAuth();

  const [loading, setLoading] = useState(true);
  const [currentTest, setCurrentTest] = useState<Question[] | null>(null);
  const [testConfig, setTestConfig] = useState<CustomTest | null>(null);
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [testStep, setTestStep] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [gracePeriod, setGracePeriod] = useState<number | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const isCurator = profile?.role === 'curator' || profile?.role === 'admin';
  
  // New fields for file and text
  const [userComment, setUserComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    
    if (!categoryName || !topic) {
      navigate('/');
      return;
    }

    if (currentTest) return; // Do not restart if already started

    const startTest = async () => {
      setLoading(true);
      try {
        // Fetch custom test directly to avoid race conditions on page refresh
        const { data: customTestData, error: customTestError } = await supabase
          .from('custom_tests')
          .select('*')
          .eq('category', categoryName)
          .eq('topic', topic)
          .maybeSingle();
        
        // Permission check
        
        console.log('TestView Debug:', {
          role: profile?.role,
          isCurator,
          categoryName,
          topic,
          hasLimit: customTestData?.has_attempts_limit,
          limit: customTestData?.attempts_limit
        });

        // Check attempts limit
        if (customTestData?.has_attempts_limit) {
          const { data: latestResults } = await supabase
            .from('results')
            .select('id')
            .eq('user_id', session?.user.id)
            .eq('category', categoryName)
            .eq('topic', topic);

          const attemptsCount = latestResults?.length || 0;
          const limit = customTestData.attempts_limit || 1;
          console.log('Attempts check:', { attemptsCount, limit });

          if (attemptsCount >= limit) {
            setIsLimitReached(true);
            if (!isCurator) {
              console.error("Лимит попыток исчерпан");
              navigate('/', { replace: true });
              return;
            }
          }
        }

        if (!isCurator && (profile?.allowed_categories || profile?.allowed_tests)) {
          const isCategoryAllowed = profile?.allowed_categories?.includes(categoryName);
          const isTestAllowed = customTestData && profile?.allowed_tests?.includes(customTestData.id);
          
          if (!isCategoryAllowed && !isTestAllowed) {
            console.error("Доступ к этому тесту ограничен");
            navigate('/');
            return;
          }
        }

        let questions: Question[];
        if (customTestData && !customTestError) {
          questions = customTestData.questions;
          setTestConfig(customTestData);
        } else {
          questions = await generateTest(categoryName, topic);
        }

        setCurrentTest(questions);
        setTestAnswers([]);
        setTestStep(0);

        if (customTestData?.has_timer && customTestData?.time_limit) {
          setTimeLeft(customTestData.time_limit);
          setTimerActive(true);
        }
      } catch (error) {
        console.error("Не удалось начать тест:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    startTest();
  }, [categoryName, topic, navigate, authLoading, profile, session, userResults]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      setIsTimeUp(true);
      setGracePeriod(10); // 10 seconds grace period to finish current question
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimeUp && gracePeriod !== null && gracePeriod > 0) {
      interval = setInterval(() => {
        setGracePeriod(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (gracePeriod === 0 && isTimeUp) {
      // Auto-submit after grace period
      if (testConfig?.allow_file_upload || testConfig?.allow_text_input) {
        setIsFinished(true);
      } else {
        calculateResults(testAnswers, true);
      }
    }
    return () => clearInterval(interval);
  }, [isTimeUp, gracePeriod, testConfig, testAnswers]);

  const submitAnswer = (index: number) => {
    if (isTimeUp) {
      // If time is up, this is the last answer allowed
      const newAnswers = [...testAnswers, index];
      setTestAnswers(newAnswers);
      setGracePeriod(null);
      if (testConfig?.allow_file_upload || testConfig?.allow_text_input) {
        setIsFinished(true);
      } else {
        calculateResults(newAnswers, true);
      }
      return;
    }

    const newAnswers = [...testAnswers, index];
    setTestAnswers(newAnswers);
    if (testStep < (currentTest?.length || 0) - 1) {
      setTestStep(testStep + 1);
    } else {
      setTimerActive(false); // Stop timer when questions are done
      // Check if we need to show additional inputs
      if (testConfig?.allow_file_upload || testConfig?.allow_text_input) {
        setIsFinished(true);
      } else {
        calculateResults(newAnswers, false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер 10МБ');
        return;
      }
      setSelectedFile(file);
    }
  };

  const calculateResults = async (answers: number[], timedOut: boolean = false) => {
    if (!currentTest || !session || !profile || !categoryName || !topic) return;
    setLoading(true);

    let fileUrl = '';
    if (selectedFile) {
      try {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `test-uploads/${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('test-assets')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('test-assets')
          .getPublicUrl(filePath);
        
        fileUrl = publicUrl;
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Ошибка при загрузке файла. Результат будет сохранен без вложения.');
      }
    }

    const skillScores: Record<string, number[]> = {};
    currentTest.forEach((q, i) => {
      if (!skillScores[q.skill]) skillScores[q.skill] = [];
      const answer = answers[i];
      if (answer === undefined) {
        skillScores[q.skill].push(0);
        return;
      }
      if (q.type === 'nps') {
        skillScores[q.skill].push(((answer - 1) / 4) * 100);
      } else {
        skillScores[q.skill].push(answer === q.correctIndex ? 100 : 0);
      }
    });

    const finalScores: Record<string, number> = {};
    Object.keys(skillScores).forEach(skill => {
      const avg = skillScores[skill].reduce((a, b) => a + b, 0) / skillScores[skill].length;
      finalScores[skill] = avg;
    });

    const result: Omit<TestResult, 'id'> = {
      user_id: session.user.id,
      user_name: `${profile.last_name} ${profile.first_name}`,
      category: categoryName,
      topic: topic,
      scores: finalScores,
      user_comment: userComment || undefined,
      file_url: fileUrl || undefined,
      finished_by_timeout: timedOut,
      total_questions: currentTest.length,
      answered_questions: answers.length,
      created_at: new Date().toISOString()
    };

    console.log('Saving result with timeout info:', { timedOut, answered: answers.length });

    try {
      const { data, error } = await supabase.from('results').insert([result]).select().single();
      if (error) throw error;
      
      await refreshUserResults();
      navigate(`/results/${data.id}`, { state: { result: data }, replace: true });
    } catch (error) {
      console.error('Error saving result:', error);
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || !currentTest) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#00e5ff] animate-spin" />
          <p className="text-white/60 font-mono text-sm uppercase tracking-widest">Генерация нейронных связей...</p>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto p-4 md:p-8"
      >
        <div className="glass-card p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00e5ff] shadow-[0_0_15px_rgba(0,229,255,0.5)]" />
          
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-[#00f2ff]/10 border border-[#00f2ff]/20 flex items-center justify-center text-[#00f2ff]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Тест <span className="text-[#00f2ff]">завершен</span></h2>
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">Дополнительная информация</p>
            </div>
          </div>

          <div className="space-y-8">
            {testConfig?.allow_text_input && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white/60">
                  <MessageSquare className="w-4 h-4 text-[#00f2ff]" />
                  <span className="text-xs font-bold uppercase tracking-widest">Ваш комментарий</span>
                </div>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value.slice(0, 500))}
                  placeholder="Введите ваш ответ или комментарий (до 500 символов)..."
                  className="w-full h-32 p-4 glass-input text-white resize-none"
                />
                <div className="flex justify-end">
                  <span className="text-[10px] font-mono text-white/20">{userComment.length}/500</span>
                </div>
              </div>
            )}

            {testConfig?.allow_file_upload && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-white/60">
                  <Upload className="w-4 h-4 text-[#00f2ff]" />
                  <span className="text-xs font-bold uppercase tracking-widest">Прикрепить файл</span>
                </div>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-8 border-2 border-dashed border-white/10 rounded-2xl hover:border-[#00f2ff]/30 hover:bg-[#00f2ff]/5 transition-all cursor-pointer flex flex-col items-center gap-4"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                  {selectedFile ? (
                    <>
                      <div className="w-12 h-12 rounded-xl bg-[#00f2ff]/20 flex items-center justify-center text-[#00f2ff]">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-white/20" />
                      <div className="text-center">
                        <p className="text-sm font-medium text-white/60">Нажмите для выбора файла</p>
                        <p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Максимум 10МБ</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={() => calculateResults(testAnswers)}
              disabled={loading}
              className="w-full py-5 glass-button-primary flex items-center justify-center gap-3 group"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              <span>Завершить и получить результат</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (loading || !currentTest) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#00e5ff] animate-spin" />
          <p className="text-white/60 font-mono text-sm uppercase tracking-widest">Генерация нейронных связей...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-3xl mx-auto p-4 md:p-8"
    >
      <div className="glass-card p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#00e5ff] to-[#7000ff] shadow-[0_0_15px_rgba(0,229,255,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${((testStep + 1) / currentTest.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#00e5ff] mb-2">
              Диагностическая последовательность: {topic}
            </div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-bold tracking-tight">Активная оценка</h2>
              {isLimitReached && isCurator && (
                <span className="px-2 py-1 rounded-md bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-bold text-yellow-500 uppercase tracking-wider">
                  Админ-доступ (Лимит исчерпан)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="glass-button px-4 py-2 text-xs font-mono font-bold text-white/60">
              {testStep + 1} из {currentTest.length}
            </div>
            {timeLeft !== null && (
              <div className={cn(
                "px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border transition-colors",
                timeLeft < 60 ? "text-red-400 border-red-400/30 bg-red-400/10 animate-pulse" : "text-[#00f2ff] border-[#00f2ff]/30 bg-[#00f2ff]/10"
              )}>
                Осталось: {formatTime(timeLeft)}
              </div>
            )}
          </div>
        </div>

        <div className="mb-12 relative">
          {isTimeUp && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center glass-card bg-red-500/10 border-red-500/30 backdrop-blur-md"
            >
              <div className="text-red-400 font-bold uppercase tracking-[0.3em] text-xl mb-4 animate-pulse">Время вышло!</div>
              <p className="text-white/80 text-center max-w-xs mb-6 text-sm">
                Вы можете завершить текущий вопрос. {gracePeriod !== null && `Автозавершение через ${gracePeriod} сек.`}
              </p>
              <button 
                onClick={() => calculateResults(testAnswers, true)}
                className="px-6 py-3 glass-button text-xs font-bold uppercase tracking-widest text-red-400 border-red-400/30 hover:bg-red-400/10"
              >
                Завершить сейчас
              </button>
            </motion.div>
          )}

          <h3 className="text-2xl font-medium leading-relaxed text-white/90 mb-10">
            {currentTest[testStep].question}
          </h3>
          
          {currentTest[testStep].type === 'nps' ? (
            <div className="flex flex-col items-center gap-6">
              <div className="flex justify-between w-full max-w-md px-2 text-xs font-bold text-white/40 uppercase tracking-wider">
                <span>Полностью не согласен</span>
                <span>Полностью согласен</span>
              </div>
              <div className="flex justify-center gap-3 md:gap-6 w-full">
                {[1, 2, 3, 4, 5].map(score => (
                  <motion.button
                    key={score}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => submitAnswer(score)}
                    className="w-12 h-12 md:w-16 md:h-16 rounded-full glass-button flex items-center justify-center text-xl font-bold text-white/80 hover:text-[#00e5ff] hover:border-[#00e5ff]/50 transition-all"
                  >
                    {score}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {currentTest[testStep].options.map((option, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ x: 10 }}
                  onClick={() => submitAnswer(idx)}
                  className="w-full text-left p-5 glass-button group flex items-center justify-between"
                >
                  <span className="font-medium text-white/70 group-hover:text-white transition-colors">{option}</span>
                  <ChevronRight className="w-4 h-4 text-[#00e5ff] opacity-0 group-hover:opacity-100 transition-all" />
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
