import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, StudentProfileData } from '../types';
import { formatAuthError } from '../lib/authErrors';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  checkUsernameAvailable: (username: string) => Promise<boolean>;
  signUp: (
    studentData: StudentProfileData,
    password: string
  ) => Promise<{ error: Error | null; needsEmailVerification?: boolean }>;
  signIn: (identifier: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<StudentProfileData>) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUserAndDbToProfile(user: User, dbRow?: Record<string, unknown> | null): UserProfile {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: (dbRow?.email as string) || user.email || (meta.email as string) || '',
    fullName: (dbRow?.full_name as string) || (meta.full_name as string) || (meta.name as string) || 'Candidate',
    username: (dbRow?.username as string) || (meta.username as string) || (user.email ? user.email.split('@')[0] : 'candidate'),
    age: (dbRow?.age as number | string) || (meta.age as number | string) || '',
    educationLevel: (dbRow?.education_level as string) || (meta.education_level as string) || 'Undergraduate',
    courseDegree: (dbRow?.course_degree as string) || (meta.course_degree as string) || 'Engineering / CS',
    studyYear: (dbRow?.study_year as string) || (meta.study_year as string) || '1st Year',
    college: (dbRow?.college as string) || (meta.college as string) || '',
    targetRole: (dbRow?.target_role as string) || (meta.target_role as string) || 'Software Engineer',
    experienceLevel: (dbRow?.experience_level as UserProfile['experienceLevel']) || (meta.experience_level as UserProfile['experienceLevel']) || 'Fresher',
    skills: (dbRow?.skills as string) || (meta.skills as string) || '',
    createdAt: (dbRow?.created_at as string) || user.created_at,
    emailConfirmed: Boolean(user.email_confirmed_at),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch from database profiles table (with fallback to user_metadata)
  const fetchAndSetProfile = useCallback(async (currentUser: User) => {
    let dbRow: Record<string, unknown> | null = null;
    if (supabase && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (!error && data) {
          dbRow = data;
        }
      } catch {
        // Table might not exist yet before SQL migration; fallback to user_metadata
      }
    }
    setProfile(mapUserAndDbToProfile(currentUser, dbRow));
  }, []);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initial session restoration
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession }, error }) => {
        if (!isMounted) return;
        if (error) {
          console.warn('[EchoTutor Auth] Session restoration notice:', error.message);
        }
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          await fetchAndSetProfile(initialSession.user);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[EchoTutor Auth] Session fetch error:', err);
        setIsLoading(false);
      });

    // 2. Active auth-state change subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await fetchAndSetProfile(currentSession.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAndSetProfile]);

  const notConfiguredError = useMemo(
    () =>
      new Error(
        'Supabase authentication is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.'
      ),
    []
  );

  // Safe check if a username is available
  const checkUsernameAvailable = async (username: string): Promise<boolean> => {
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3) return false;
    if (!supabase || !isSupabaseConfigured) return true;

    try {
      // 1. Try RPC check_username_available
      const { data, error } = await supabase.rpc('check_username_available', {
        p_username: trimmed,
      });

      if (!error && typeof data === 'boolean') {
        return data;
      }

      // 2. Fallback direct select on profiles
      const { data: rows, error: selectErr } = await supabase
        .from('profiles')
        .select('id')
        .ilike('username', trimmed)
        .limit(1);

      if (selectErr) {
        // Table or RLS might not be set up; allow registration to continue
        return true;
      }

      return !rows || rows.length === 0;
    } catch {
      return true;
    }
  };

  // Sign up with student profile data
  const signUp = async (
    studentData: StudentProfileData,
    password: string
  ): Promise<{ error: Error | null; needsEmailVerification?: boolean }> => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: notConfiguredError };
    }

    try {
      const email = studentData.email.trim();
      const username = studentData.username.trim().toLowerCase();
      const fullName = studentData.fullName.trim();

      // Check username availability before attempting creation
      const isAvailable = await checkUsernameAvailable(username);
      if (!isAvailable) {
        return { error: new Error(`Username "${username}" is already taken. Please choose another.`) };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username,
            age: studentData.age ? Number(studentData.age) : null,
            education_level: studentData.educationLevel,
            course_degree: studentData.courseDegree,
            study_year: studentData.studyYear,
            college: studentData.college?.trim() || null,
            target_role: studentData.targetRole?.trim() || null,
            experience_level: studentData.experienceLevel || 'Fresher',
            skills: studentData.skills?.trim() || null,
          },
        },
      });

      if (error) {
        return { error: new Error(formatAuthError(error)) };
      }

      // Supabase Email Enumeration / Existing User Protection:
      // If email is already registered, Supabase returns a mock user with empty identities.
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return {
          error: new Error(
            'An account with this email address is already registered. If your verification email was delayed, please wait before requesting another or proceed to Sign In.'
          ),
        };
      }

      // Do not claim registration succeeded unless the Supabase response confirms the account was created.
      if (!data.user) {
        return {
          error: new Error(
            'Account creation could not be confirmed by the authentication service. Please check your credentials and try again.'
          ),
        };
      }

      // If session exists immediately, try upserting profile table
      if (data.user && data.session) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            username,
            full_name: fullName,
            email,
            age: studentData.age ? Number(studentData.age) : null,
            education_level: studentData.educationLevel,
            course_degree: studentData.courseDegree,
            study_year: studentData.studyYear,
            college: studentData.college?.trim() || null,
            target_role: studentData.targetRole?.trim() || null,
            experience_level: studentData.experienceLevel || 'Fresher',
            skills: studentData.skills?.trim() || null,
          });
        } catch {
          // Table trigger will handle on DB side if configured
        }
      }

      const needsEmailVerification = Boolean(data.user && !data.session);
      return { error: null, needsEmailVerification };
    } catch (err) {
      return {
        error: new Error(formatAuthError(err)),
      };
    }
  };

  // Sign in using email OR username
  const signIn = async (identifier: string, password: string): Promise<{ error: Error | null }> => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: notConfiguredError };
    }

    try {
      const trimmed = identifier.trim();
      let emailToAuth = trimmed;

      // If identifier does not have an '@', resolve username to email
      if (!trimmed.includes('@')) {
        const username = trimmed.toLowerCase();
        
        try {
          // Call secure RPC
          const { data: resolvedEmail, error: rpcErr } = await supabase.rpc('get_email_by_username', {
            p_username: username,
          });

          if (rpcErr) {
            // Function not deployed yet in Supabase SQL editor
            return {
              error: new Error(
                `Username login requires database configuration. Please sign in with your email address or run the setup in supabase_schema.sql.`
              ),
            };
          }

          if (!resolvedEmail) {
            return {
              error: new Error(`No account found matching username "${trimmed}". Please check your username or sign in with your email.`),
            };
          }

          emailToAuth = resolvedEmail;
        } catch {
          return {
            error: new Error(
              `Username login requires database configuration. Please sign in with your email address or run the setup in supabase_schema.sql.`
            ),
          };
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToAuth,
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('An unexpected error occurred during login.'),
      };
    }
  };

  // Update student profile
  const updateProfile = async (updates: Partial<StudentProfileData>): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Cannot update profile: No authenticated candidate session.') };
    }

    try {
      // 1. Update user_metadata in Supabase Auth
      if (supabase && isSupabaseConfigured) {
        const { error: metaErr } = await supabase.auth.updateUser({
          data: updates,
        });
        if (metaErr) {
          return { error: new Error(metaErr.message) };
        }

        // 2. Update profiles table if it exists
        try {
          const dbPayload: Record<string, unknown> = {};
          if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
          if (updates.username !== undefined) dbPayload.username = updates.username.toLowerCase();
          if (updates.age !== undefined) dbPayload.age = updates.age ? Number(updates.age) : null;
          if (updates.educationLevel !== undefined) dbPayload.education_level = updates.educationLevel;
          if (updates.courseDegree !== undefined) dbPayload.course_degree = updates.courseDegree;
          if (updates.studyYear !== undefined) dbPayload.study_year = updates.studyYear;
          if (updates.college !== undefined) dbPayload.college = updates.college;
          if (updates.targetRole !== undefined) dbPayload.target_role = updates.targetRole;
          if (updates.experienceLevel !== undefined) dbPayload.experience_level = updates.experienceLevel;
          if (updates.skills !== undefined) dbPayload.skills = updates.skills;
          dbPayload.updated_at = new Date().toISOString();

          await supabase.from('profiles').update(dbPayload).eq('id', user.id);
        } catch {
          // Non-blocking if table is not yet migrated
        }
      }

      // 3. Update local state
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));

      return { error: null };
    } catch (err) {
      return {
        error: err instanceof Error ? err : new Error('Failed to update candidate profile.'),
      };
    }
  };

  const signOut = async (): Promise<{ error: Error | null }> => {
    if (!supabase || !isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      if (error) {
        return { error: new Error(error.message) };
      }
      return { error: null };
    } catch (err) {
      setUser(null);
      setSession(null);
      setProfile(null);
      return {
        error: err instanceof Error ? err : new Error('An unexpected error occurred during logout.'),
      };
    }
  };

  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: notConfiguredError };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });

      if (error) {
        return { error: new Error(formatAuthError(error)) };
      }

      return { error: null };
    } catch (err) {
      return {
        error: new Error(formatAuthError(err)),
      };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ error: Error | null }> => {
    if (!supabase || !isSupabaseConfigured) {
      return { error: notConfiguredError };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (error) {
        return { error: new Error(formatAuthError(error)) };
      }

      return { error: null };
    } catch (err) {
      return {
        error: new Error(formatAuthError(err)),
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: isSupabaseConfigured,
        checkUsernameAvailable,
        signUp,
        signIn,
        signOut,
        updateProfile,
        resetPassword,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
