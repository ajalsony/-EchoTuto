-- ==============================================================================
-- EchoTutor® — Student Profile & Authentication Database Schema
-- Run this in the Supabase Dashboard -> SQL Editor (or via Supabase CLI migrations)
-- ==============================================================================

-- 1. Create public.profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  age INTEGER CHECK (age >= 13 AND age <= 120),
  education_level TEXT NOT NULL,
  course_degree TEXT NOT NULL,
  study_year TEXT NOT NULL,
  college TEXT,
  target_role TEXT,
  experience_level TEXT CHECK (experience_level IN ('Fresher', 'Internship', 'Experienced')),
  skills TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Case-insensitive unique constraint for username
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_idx ON public.profiles (LOWER(username));

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Users can read only their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update only their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 5. Automatic Profile Synchronization Trigger (Supabase Best Practice)
-- Automatically inserts/updates public.profiles whenever a user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    email,
    age,
    education_level,
    course_degree,
    study_year,
    college,
    target_role,
    experience_level,
    skills
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'username', ''), 'user_' || SUBSTRING(NEW.id::text, 1, 8)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), 'Candidate'),
    COALESCE(NEW.email, ''),
    CASE 
      WHEN NEW.raw_user_meta_data->>'age' ~ '^[0-9]+$' THEN (NEW.raw_user_meta_data->>'age')::INTEGER
      ELSE NULL
    END,
    COALESCE(NEW.raw_user_meta_data->>'education_level', 'Undergraduate'),
    COALESCE(NEW.raw_user_meta_data->>'course_degree', 'Computer Science'),
    COALESCE(NEW.raw_user_meta_data->>'study_year', '1st Year'),
    NEW.raw_user_meta_data->>'college',
    NEW.raw_user_meta_data->>'target_role',
    NEW.raw_user_meta_data->>'experience_level',
    NEW.raw_user_meta_data->>'skills'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    age = COALESCE(EXCLUDED.age, public.profiles.age),
    education_level = COALESCE(EXCLUDED.education_level, public.profiles.education_level),
    course_degree = COALESCE(EXCLUDED.course_degree, public.profiles.course_degree),
    study_year = COALESCE(EXCLUDED.study_year, public.profiles.study_year),
    college = COALESCE(EXCLUDED.college, public.profiles.college),
    target_role = COALESCE(EXCLUDED.target_role, public.profiles.target_role),
    experience_level = COALESCE(EXCLUDED.experience_level, public.profiles.experience_level),
    skills = COALESCE(EXCLUDED.skills, public.profiles.skills),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Safe Username Availability Check RPC
-- Returns true if username is available (does not reveal any profile data)
CREATE OR REPLACE FUNCTION public.check_username_available(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_username IS NULL OR LENGTH(TRIM(p_username)) < 3 THEN
    RETURN FALSE;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE LOWER(username) = LOWER(TRIM(p_username))
  );
END;
$$;

-- 7. Secure Authentication Policy: Native Email Authentication
-- Username-to-email resolution has been deprecated to eliminate email-enumeration vulnerabilities.
-- Candidate logins are processed securely via native Supabase email authentication (auth.signInWithPassword).
DROP FUNCTION IF EXISTS public.get_email_by_username(TEXT);

-- 8. Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.check_username_available(TEXT) TO anon, authenticated;
