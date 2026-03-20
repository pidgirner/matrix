import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { Category, CustomTest, ModalState } from '@/types';

const DEFAULT_CATEGORIES: Category[] = [
  { 
    id: 'programming', 
    name: 'Языки программирования', 
    description: 'Тестирование навыков программирования и разработки ПО',
    icon_name: 'Code2',
    topics: ['JavaScript', 'Python', 'TypeScript', 'Go', 'Rust', 'Java', 'C++', 'PHP', 'Swift', 'Kotlin']
  },
  { 
    id: 'psychotype', 
    name: 'Психотип и личность', 
    description: 'Определение психологического профиля и личностных качеств',
    icon_name: 'BrainCircuit',
    topics: ['MBTI', 'Большая пятерка', 'Эннеаграмма', 'DISC', 'Темперамент', 'Профориентация']
  },
  { 
    id: 'hard_skills', 
    name: 'Хард скиллы', 
    description: 'Проверка профессиональных технических компетенций',
    icon_name: 'Zap',
    topics: ['Системный дизайн', 'Управление БД', 'Облачная архитектура', 'Безопасность', 'Docker & K8s', 'CI/CD']
  },
  { 
    id: 'soft_skills', 
    name: 'Софт скиллы', 
    description: 'Оценка навыков межличностного общения и управления',
    icon_name: 'Users',
    topics: ['Лидерство', 'Коммуникация', 'Разрешение конфликтов', 'Тайм-менеджмент', 'Публичные выступления', 'Эмоциональный интеллект']
  },
  {
    id: 'design',
    name: 'Дизайн и UX',
    description: 'Тестирование в области визуального дизайна и UX-исследований',
    icon_name: 'Wand2',
    topics: ['UI Дизайн', 'UX Исследования', 'Figma', 'Типографика', 'Цветоведение', 'Моушн-дизайн']
  },
  {
    id: 'management',
    name: 'Менеджмент',
    description: 'Оценка управленческих навыков и методологий ведения проектов',
    icon_name: 'LayoutDashboard',
    topics: ['Agile/Scrum', 'Управление проектами', 'Управление продуктом', 'Стратегическое планирование', 'Риск-менеджмент']
  }
];

interface AppContextType {
  categories: Category[];
  customTests: CustomTest[];
  modal: ModalState;
  loading: boolean;
  showModal: (title: string, message: string, type?: 'confirm' | 'alert', onConfirm?: () => void) => void;
  closeModal: () => void;
  refreshCategories: () => Promise<void>;
  refreshCustomTests: () => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [customTests, setCustomTests] = useState<CustomTest[]>([]);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, title: '', message: '', type: 'alert' });
  const [loading, setLoading] = useState(true);

  const showModal = (title: string, message: string, type: 'confirm' | 'alert' = 'alert', onConfirm?: () => void) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (!error && data && data.length > 0) {
      setCategories(data);
    } else if (!error && (!data || data.length === 0)) {
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const fetchCustomTests = async () => {
    const { data, error } = await supabase.from('custom_tests').select('*');
    if (!error && data) {
      setCustomTests(data);
    }
  };

  const deleteCategory = async (id: string) => {
    showModal(
      "Подтверждение удаления",
      "Вы уверены, что хотите удалить эту категорию? Это может повлиять на связанные тестовые узлы.",
      'confirm',
      async () => {
        try {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) throw error;
          await fetchCategories();
        } catch (error) {
          console.error(error);
          showModal("Ошибка", "Не удалось удалить категорию.");
        }
      }
    );
  };

  const deleteTest = async (id: string) => {
    showModal(
      "Подтверждение удаления",
      "Вы уверены, что хотите удалить этот тестовый узел?",
      'confirm',
      async () => {
        try {
          const { error } = await supabase.from('custom_tests').delete().eq('id', id);
          if (error) throw error;
          await fetchCustomTests();
        } catch (error) {
          console.error(error);
          showModal("Ошибка", "Не удалось удалить тест.");
        }
      }
    );
  };

  useEffect(() => {
    let mounted = true;

    const initData = async () => {
      try {
        // Do not await these so the app can render immediately
        fetchCategories();
        fetchCustomTests();
      } catch (error) {
        console.error('Error initializing app data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initData();

    const categoriesChannel = supabase
      .channel('categories_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchCategories)
      .subscribe();

    const testsChannel = supabase
      .channel('custom_tests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'custom_tests' }, fetchCustomTests)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(testsChannel);
    };
  }, []);

  return (
    <AppContext.Provider value={{
      categories,
      customTests,
      modal,
      loading,
      showModal,
      closeModal,
      refreshCategories: fetchCategories,
      refreshCustomTests: fetchCustomTests,
      deleteCategory,
      deleteTest
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
