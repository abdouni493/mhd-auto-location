import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, UserIcon } from 'lucide-react';
import { supabase } from '../supabase';
import { Language, UserRole, User } from '../types';
import { TRANSLATIONS } from '../constants';
import { DatabaseService } from '../services/DatabaseService';
import { sessionService } from '../utils/sessionService';

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
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n[Login] ======= LOGIN/SIGNUP ATTEMPT STARTED at ${timestamp} =======`);
    
    // Prevent double submissions
    if (isSubmitting) {
      console.log('[Login] Form already submitting, ignoring duplicate submission');
      return;
    }
    
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      // SIGNUP FLOW - Always use Supabase Auth
      if (isSigningUp) {
        console.log('[Login] === SIGNUP MODE ===');
        console.log('[Login] Attempting Supabase signup...');
        // create new admin user and profile
        const { data: signData, error: signError } = await supabase.auth.signUp(
          { email, password }
        );
        if (signError) {
          console.log('[Login] Signup error:', signError.message);
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
          console.log('[Login] Auto-signin after signup error:', loginError.message);
          setErrorMessage(loginError.message);
          setIsSubmitting(false);
          return;
        }
        if (loginData.session) {
          const u = loginData.user;
          const role = (u.user_metadata?.role as UserRole) || 'admin';
          const name = (u.user_metadata?.username as string) || u.email || '';
          
          console.log('[Login] === SIGNUP SUCCESSFUL ===');
          console.log('[Login] Signup user:', { name, email: u.email, role });
          console.log('[Login] Session token length:', loginData.session.access_token.length);
          console.log('[Login] localStorage after signup:', {
            has_token: !!localStorage.getItem('supabase.auth.token'),
            has_signup_done: !!localStorage.getItem('signupDone')
          });
          
          // Save session
          await sessionService.createSession(
            loginData.session.access_token,
            loginData.session.refresh_token,
            loginData.session.expires_at || Math.floor(Date.now() / 1000) + 3600,
            u.id,
            u.email || '',
            role,
            name
          );
          
          // CRITICAL: Clear all SDK session data to prevent auto-refresh
          console.log('[Login] Clearing SDK session data to prevent auto-refresh...');
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
          
          // Clear form
          setEmail('');
          setPassword('');
          setUsername('');
          
          console.log('[Login] Calling onLogin callback...');
          onLogin({ name, email: u.email || '', role, avatar: '' });
        }
        setIsSubmitting(false);
        return;
      }

      // LOGIN FLOW - Determine auth method based on input format
      const credential = email.trim();
      const isEmailInput = credential.includes('@');

      if (!credential || !password) {
        console.log('[Login] Missing credentials - email:', !!credential, 'password:', !!password);
        setErrorMessage(lang === 'fr' 
          ? 'Veuillez entrer vos identifiants.' 
          : 'الرجاء إدخال بيانات الدخول.');
        setIsSubmitting(false);
        return;
      }

      // SEPARATED FLOW 1: EMAIL INPUT → SUPABASE AUTH ONLY
      if (isEmailInput) {
        console.log('[Login] === EMAIL LOGIN ===');
        console.log('[Login] Email detected, attempting Supabase auth only for:', credential);
        try {
          const result = await supabase.auth.signInWithPassword({
            email: credential,
            password
          });
          
          if (result.error) {
            console.log('[Login] Email auth failed:', result.error.message, 'Status:', result.error.status);
            setErrorMessage(lang === 'fr' 
              ? 'Email ou mot de passe incorrect.' 
              : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
            setIsSubmitting(false);
            return;
          }

          if (result.data?.session) {
            const u = result.data.user;
            const role = (u.user_metadata?.role as UserRole) || 'admin';
            const name = (u.user_metadata?.username as string) || u.email || '';
            
            console.log('[Login] === EMAIL AUTH SUCCESSFUL ===');
            console.log('[Login] Email login user:', { name, email: u.email, role });
            console.log('[Login] Session token length:', result.data.session.access_token.length);
            console.log('[Login] Session expires at:', result.data.session.expires_at);
            console.log('[Login] localStorage after login:', {
              has_token: !!localStorage.getItem('supabase.auth.token'),
              token_preview: localStorage.getItem('supabase.auth.token')?.substring(0, 50) + '...'
            });
            
            // Save session to database and localStorage using new session service
            console.log('[Login] Saving session to database via sessionService...');
            await sessionService.createSession(
              result.data.session.access_token,
              result.data.session.refresh_token,
              result.data.session.expires_at || Math.floor(Date.now() / 1000) + 3600,
              u.id,
              u.email || '',
              role,
              name
            );
            
            // CRITICAL: Clear all SDK session data to prevent auto-refresh
            console.log('[Login] Clearing SDK session data to prevent auto-refresh...');
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.clear();
            
            // Clear form
            setEmail('');
            setPassword('');
            setUsername('');
            
            console.log('[Login] Calling onLogin callback...');
            onLogin({ name, email: u.email || '', role, avatar: '' });
            return;
          }
        } catch (error) {
          console.log('[Login] Email auth exception:', error);
          setErrorMessage(lang === 'fr' 
            ? 'Une erreur est survenue lors de la connexion.' 
            : 'حدث خطأ أثناء تسجيل الدخول.');
          setIsSubmitting(false);
          return;
        }
      }

      // SEPARATED FLOW 2: NON-EMAIL INPUT → WORKER RPC AUTH ONLY
      console.log('[Login] === WORKER LOGIN ===');
      console.log('[Login] Username detected, attempting worker login via RPC for:', credential);
      try {
        const { data: loginResult, error: loginError } = await supabase.rpc('login_worker', {
          p_email_or_username: credential,
          p_password: password
        });

        console.log('[Login] Worker RPC response:', { loginResult, loginError });

        if (loginError) {
          console.log('[Login] Worker RPC error:', loginError);
          setErrorMessage(lang === 'fr' 
            ? 'Erreur de connexion. Veuillez réessayer.' 
            : 'خطأ في الاتصال. يرجى المحاولة مجددا.');
          setIsSubmitting(false);
          return;
        }

        // Check if response indicates success
        if (!loginResult) {
          console.log('[Login] Worker RPC returned empty result');
          setErrorMessage(lang === 'fr' 
            ? 'Identifiants invalides.' 
            : 'بيانات اعتماد غير صحيحة.');
          setIsSubmitting(false);
          return;
        }

        if (loginResult.success === false) {
          console.log('[Login] Worker authentication failed:', loginResult.error);
          setErrorMessage(lang === 'fr' 
            ? 'Identifiants invalides.' 
            : 'بيانات اعتماد غير صحيحة.');
          setIsSubmitting(false);
          return;
        }

        if (loginResult.success && loginResult.worker) {
          const worker = loginResult.worker;
          const workerRole = (worker.type as UserRole) || 'worker';
          
          console.log('[Login] === WORKER AUTH SUCCESSFUL ===');
          console.log('[Login] Worker login user:', { name: worker.full_name, email: worker.email, role: workerRole });
          console.log('[Login] Worker profile photo:', !!worker.profile_photo);
          
          // Clear form
          setEmail('');
          setPassword('');
          setUsername('');
          
          console.log('[Login] Calling onLogin callback...');
          onLogin({
            name: worker.full_name,
            email: worker.email || '',
            role: workerRole,
            avatar: worker.profile_photo || ''
          });
          return;
        } else {
          console.log('[Login] Worker login failed - unexpected response structure:', loginResult);
          setErrorMessage(lang === 'fr' 
            ? 'Identifiants invalides.' 
            : 'بيانات اعتماد غير صحيحة.');
          setIsSubmitting(false);
          return;
        }
      } catch (workerError) {
        console.log('[Login] Worker login exception:', workerError);
        setErrorMessage(lang === 'fr' 
          ? 'Une erreur est survenue lors de la connexion.' 
          : 'حدث خطأ أثناء تسجيل الدخول.');
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.log('[Login] === UNEXPECTED ERROR ===');
      console.log('[Login] Error:', error);
      setErrorMessage(lang === 'fr' 
        ? 'Une erreur est survenue lors de la connexion.' 
        : 'حدث خطأ أثناء تسجيل الدخول.');
      setIsSubmitting(false);
    }
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
      </motion.div>
    </div>
  );
};
