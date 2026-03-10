import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Shield, User as UserIcon, Truck } from 'lucide-react';
import { supabase } from '../supabase';
import { Language, UserRole, User } from '../types';
import { TRANSLATIONS } from '../constants';
import { DatabaseService } from '../services/DatabaseService';

interface LoginProps {
  lang: Language;
  // now emit full user object once authenticated
  onLogin: (user: User) => void;
}

interface AdminCount {
  count: number;
}

export const Login: React.FC<LoginProps> = ({ lang, onLogin }) => {
  const t = TRANSLATIONS[lang];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [adminExists, setAdminExists] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      // if we stored a flag locally, skip the network request
      if (localStorage.getItem('signupDone')) {
        setAdminExists(true);
        return;
      }
      const { data, error } = await supabase
        .from('admin_count')
        .select('count')
        .single();
      if (data && (data as any).count > 0) {
        setAdminExists(true);
      }
    };
    checkAdmin();
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (isSigningUp) {
        // create new admin user and profile
        const { data: signData, error: signError } = await supabase.auth.signUp(
          { email, password }
        );
        if (signError) {
          setErrorMessage(signError.message);
          setIsSubmitting(false);
          return;
        }

        // insert into profiles table for role tracking
        if (signData?.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: signData.user.id, username, role: 'admin' });
          if (profileError) {
            console.error('Profile insert error:', profileError);
          }
        }

        // mark signup done so form disappears permanently
        localStorage.setItem('signupDone', 'true');
        setAdminExists(true);

        // automatically sign in the user
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword(
          { email, password }
        );
        if (loginError) {
          setErrorMessage(loginError.message);
          setIsSubmitting(false);
          return;
        }
        if (loginData.session) {
          const u = loginData.user;
          const role = (u.user_metadata?.role as UserRole) || 'admin';
          const name = (u.user_metadata?.username as string) || u.email || '';
          onLogin({ name, email: u.email || '', role, avatar: '' });
        }
        setIsSubmitting(false);
        return;
      }

      // Step 1: Try to authenticate as a worker using database function
      const credential = email; // The input field accepts both email and username
      
      if (credential && password) {
        try {
          console.log('Attempting worker login with credential:', credential);
          
          // Call the database function for worker authentication
          const { data: loginResult, error: loginError } = await supabase
            .rpc('login_worker', {
              p_email_or_username: credential,
              p_password: password
            });

          console.log('Login result:', loginResult);

          if (loginError) {
            console.error('RPC error:', loginError);
          }

          if (loginResult?.success && loginResult?.worker) {
            const worker = loginResult.worker;
            console.log('Worker authenticated:', worker);
            
            // Create Supabase session for worker to enable database access
            try {
              // Check if worker already has a Supabase account
              const { data: existingUser } = await supabase.auth.signInWithPassword({
                email: worker.email,
                password: worker.password // Use the password from database
              });

              if (existingUser?.user) {
                console.log('Worker signed in with existing Supabase account');
              } else {
                // Create new Supabase account for worker
                console.log('Creating Supabase account for worker');
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                  email: worker.email,
                  password: worker.password,
                  options: {
                    data: {
                      username: worker.username,
                      role: worker.type
                    }
                  }
                });

                if (signUpError && !signUpError.message.includes('already registered')) {
                  console.error('Error creating Supabase account for worker:', signUpError);
                } else {
                  // Sign in the worker
                  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                    email: worker.email,
                    password: worker.password
                  });

                  if (signInError) {
                    console.error('Error signing in worker:', signInError);
                  } else {
                    console.log('Worker signed in successfully');
                  }
                }
              }
            } catch (authError) {
              console.error('Error setting up Supabase auth for worker:', authError);
              // Continue anyway - the app-level authentication will work
            }
            
            // Login successful - worker is authenticated with their type role
            const workerRole = (worker.type as UserRole) || 'worker';
            console.log('Worker authenticated with role:', workerRole);
            
            onLogin({ 
              name: worker.full_name, 
              email: worker.email || '', 
              role: workerRole,
              avatar: worker.profile_photo || '' 
            });
            setIsSubmitting(false);
            return;
          }
        } catch (workerError) {
          console.error('Worker login error:', workerError);
        }
      }

      // Step 2: Fallback to Supabase Auth for admin/users not in workers table
      let loginData = null;
      let loginError = null;

      if (email) {
        const result = await supabase.auth.signInWithPassword(
          { email, password }
        );
        loginData = result.data;
        loginError = result.error;
      } else if (username) {
        // If only username is provided, search for user by username
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (profileData) {
          // Try to get the user's email from auth
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(profileData.id);
            if (userData?.user?.email) {
              const result = await supabase.auth.signInWithPassword(
                { email: userData.user.email, password }
              );
              loginData = result.data;
              loginError = result.error;
            }
          } catch (err) {
            console.error('Auth lookup error:', err);
          }
        }
      }

      if (loginData?.session) {
        const u = loginData.user;
        const role = (u.user_metadata?.role as UserRole) || 'admin';
        const name = (u.user_metadata?.username as string) || u.email || '';
        onLogin({ name, email: u.email || '', role, avatar: '' });
        setIsSubmitting(false);
        return;
      }

      // If we reach here, authentication failed
      setErrorMessage(lang === 'fr' 
        ? 'Identifiants invalides. Vérifiez votre email/nom d\'utilisateur et mot de passe.' 
        : 'بيانات اعتماد غير صحيحة. تحقق من بريدك الإلكتروني واسم المستخدم وكلمة المرور.');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(lang === 'fr' 
        ? 'Une erreur est survenue lors de la connexion.' 
        : 'حدث خطأ أثناء تسجيل الدخول.');
    }

    setIsSubmitting(false);
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-saas-bg">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card p-10 space-y-10 bg-white shadow-2xl rounded-[2.5rem] border border-saas-border"
      >
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-black tracking-tighter bg-linear-to-r from-saas-primary-start via-saas-primary-via to-saas-primary-end bg-clip-text text-transparent uppercase">
            AutoFutur
          </h1>
          <p className="text-saas-text-muted font-bold uppercase tracking-[0.3em] text-[10px]">{t.login}</p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* when signing up we need a username */}
            {isSigningUp && (
              <div className="space-y-2">
                <label className="label-saas">{t.username}</label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-saas-text-muted group-focus-within:text-saas-primary-via transition-colors" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-saas pl-12"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>
            )}

            {/* Email/Username field */}
            <div className="space-y-2">
              <label className="label-saas">
                {isSigningUp 
                  ? t.email 
                  : (lang === 'fr' ? 'Email ou Nom d\'utilisateur' : 'البريد الإلكتروني أو اسم المستخدم')}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-saas-text-muted group-focus-within:text-saas-primary-via transition-colors" size={18} />
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-saas pl-12"
                  placeholder={isSigningUp ? "admin@autofutur.com" : "john.doe ou john@email.com"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="label-saas">{t.password}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-saas-text-muted group-focus-within:text-saas-primary-via transition-colors" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-saas pl-12"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-saas-primary text-sm py-5 shadow-xl shadow-saas-primary-start/20"
          >
            {isSigningUp ? t.signup : t.login}
          </button>
        </form>

        {/* one‑time sign‑up */}
        {!adminExists && !isSigningUp && (
          <div className="text-center">
            <button
              onClick={() => setIsSigningUp(true)}
              className="text-sm text-saas-primary-via underline"
            >
              {t.signup} ?
            </button>
            <p className="text-xs text-saas-text-muted mt-1">(première connexion uniquement)</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-saas-border" />
            <span className="text-[10px] text-saas-text-muted font-bold uppercase tracking-[0.2em]">{t.quickAccess}</span>
            <div className="h-[1px] flex-1 bg-saas-border" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <button 
              onClick={() => onLogin({ name: 'Admin', email: '', role: 'admin', avatar: '' })}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-saas-bg border border-saas-border hover:bg-white hover:border-saas-primary-via/30 hover:shadow-xl transition-all group"
            >
              <Shield size={24} className="text-saas-primary-via group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-saas-text-muted">{t.admin}</span>
            </button>
            <button 
              onClick={() => onLogin({ name: 'Worker', email: '', role: 'worker', avatar: '' })}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-saas-bg border border-saas-border hover:bg-white hover:border-saas-primary-via/30 hover:shadow-xl transition-all group"
            >
              <UserIcon size={24} className="text-saas-primary-via group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-saas-text-muted">{t.worker}</span>
            </button>
            <button 
              onClick={() => onLogin({ name: 'Driver', email: '', role: 'driver', avatar: '' })}
              className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-saas-bg border border-saas-border hover:bg-white hover:border-saas-primary-via/30 hover:shadow-xl transition-all group"
            >
              <Truck size={24} className="text-saas-primary-via group-hover:scale-110 transition-transform" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-saas-text-muted">{t.driver}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
