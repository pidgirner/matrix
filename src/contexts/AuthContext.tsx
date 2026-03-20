import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { UserProfile, TestResult } from '@/types';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: Session['user'] | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoaded: boolean;
  userResults: TestResult[];
  configError: boolean;
  refreshProfile: () => Promise<void>;
  refreshUserResults: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [userResults, setUserResults] = useState<TestResult[]>([]);

  const user = session?.user || null;

  const configError = !import.meta.env.VITE_SUPABASE_URL && !(typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL);

  const fetchProfile = async (userId: string) => {
    setProfileLoaded(false);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoaded(true);
    }
  };

  const fetchUserResults = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setUserResults(data);
      }
    } catch (err) {
      console.error('Error fetching user results:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      if (configError) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        if (!mounted) return;
        
        setSession(session);
        if (session) {
          // Do not await these so the app can render immediately
          fetchProfile(session.user.id);
          fetchUserResults(session.user.id);
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return; // Handled by getSession
      
      try {
        setSession(session);
        if (session) {
          // Do not await these
          fetchProfile(session.user.id);
          fetchUserResults(session.user.id);
        } else {
          setProfile(null);
          setUserResults([]);
        }
      } catch (error) {
        console.error('Error during auth state change:', error);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [configError]);

  const refreshProfile = async () => {
    if (session?.user.id) {
      await fetchProfile(session.user.id);
    }
  };

  const refreshUserResults = async () => {
    if (session?.user.id) {
      await fetchUserResults(session.user.id);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, profileLoaded, userResults, configError, refreshProfile, refreshUserResults }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
