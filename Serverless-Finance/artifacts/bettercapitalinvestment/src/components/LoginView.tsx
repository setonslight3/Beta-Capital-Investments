import { useState, FormEvent } from 'react';
import { Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { ScreenType } from '../types';
import LogoIcon from './LogoIcon';
import { useLogin } from '@workspace/api-client-react';
import LegalModal from './LegalModal';

interface LoginViewProps {
  onNavigate: (screen: ScreenType) => void;
  onLoginSuccess: (user: { email: string; fullName: string; tier: string; theme: string; biometricEnabled: boolean; isAdmin?: boolean }) => void;
}

export default function LoginView({ onNavigate, onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const loginMutation = useLogin();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErrorText('');
    if (!email.trim()) { setErrorText('Please enter your email address.'); return; }
    if (!password) { setErrorText('Please enter your password.'); return; }

    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          onLoginSuccess({
            email: data.email,
            fullName: data.fullName,
            tier: data.tier,
            theme: data.theme,
            biometricEnabled: data.biometricEnabled,
            isAdmin: (data as { isAdmin?: boolean }).isAdmin,
          });
        },
        onError: () => {
          setErrorText('Invalid email or password. Please try again.');
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-serif">
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 md:px-16 h-14 sm:h-16 bg-brand-bg/95 backdrop-blur-md border-b border-brand-border">
        <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <LogoIcon size={24} />
          <span className="font-serif text-base font-bold text-brand-gold tracking-wider uppercase">BetterCapitalInvestment</span>
        </button>
        <button onClick={() => onNavigate('landing')} className="flex items-center gap-1.5 text-brand-muted hover:text-brand-gold transition-colors text-xs font-sans">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back to Home</span>
          <span className="sm:hidden">Back</span>
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-8">
        <div className="w-full max-w-sm sm:max-w-[440px]">
          <div className="bg-brand-surface border border-brand-border rounded-lg shadow-2xl overflow-hidden">
            <div className="h-[3px] bg-brand-gold w-full" />
            <div className="p-6 sm:p-8 md:p-10">
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl text-brand-text font-serif mb-1">Welcome Back</h1>
                <p className="text-xs text-brand-muted font-sans tracking-wide uppercase">Sign in to your investment account</p>
              </div>

              {errorText && (
                <div className="mb-4 bg-red-950/40 border border-red-500/30 text-red-300 text-xs py-2.5 px-3 rounded font-sans leading-relaxed">
                  {errorText}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="block text-[11px] font-sans font-semibold text-brand-muted uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full bg-brand-bg border border-brand-border py-3 px-4 text-brand-text placeholder-brand-muted/30 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/20 rounded-lg transition-all font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-sans font-semibold text-brand-muted uppercase tracking-wider">Password</label>
                    <button type="button" onClick={() => onNavigate('forgot-password')} className="text-[11px] font-sans text-brand-gold hover:opacity-70 transition-opacity">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full bg-brand-bg border border-brand-border py-3 px-4 pr-11 text-brand-text placeholder-brand-muted/30 focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold/20 rounded-lg transition-all font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-gold transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-brand-gold text-brand-bg font-sans font-bold text-xs py-3.5 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all tracking-widest uppercase flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-brand-gold/10"
                >
                  {loginMutation.isPending ? <><Loader2 className="animate-spin w-4 h-4" /><span>Signing In...</span></> : <><Lock className="w-3.5 h-3.5" /><span>Sign In</span></>}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-brand-border/40 text-center">
                <p className="text-[11px] text-brand-muted font-sans mb-3">Don't have an account?</p>
                <button onClick={() => onNavigate('signup')} className="w-full border border-brand-border text-brand-text font-sans font-semibold text-xs py-3 rounded-lg hover:border-brand-gold hover:text-brand-gold transition-all tracking-widest uppercase">
                  Create Account
                </button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[10px] text-brand-muted/60 font-sans">
                  By signing in you agree to our{' '}
                  <button onClick={() => setLegalModal('terms')} className="text-brand-muted hover:text-brand-gold underline-offset-2 hover:underline transition-all">Terms</button>
                  {' & '}
                  <button onClick={() => setLegalModal('privacy')} className="text-brand-muted hover:text-brand-gold underline-offset-2 hover:underline transition-all">Privacy Policy</button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {legalModal && (
        <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
      )}
    </div>
  );
}
