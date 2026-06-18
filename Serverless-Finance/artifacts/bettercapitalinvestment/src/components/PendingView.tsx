import { ArrowLeft, Clock, CheckCircle2, Mail } from 'lucide-react';
import { ScreenType } from '../types';
import LogoIcon from './LogoIcon';

interface PendingViewProps {
  onNavigate: (screen: ScreenType) => void;
}

export default function PendingView({ onNavigate }: PendingViewProps) {
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
        <div className="w-full max-w-sm sm:max-w-[480px] text-center">
          <div className="bg-brand-surface border border-brand-border rounded-lg shadow-2xl overflow-hidden p-6 sm:p-8 md:p-10">
            <div className="h-[3px] bg-yellow-500 mb-6" />
            
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>

            <h1 className="text-2xl sm:text-3xl text-brand-text font-serif mb-3">Account Under Review</h1>
            <p className="text-xs text-brand-muted font-sans tracking-wide uppercase mb-6">
              Thank you for signing up
            </p>

            <div className="bg-brand-bg border border-brand-border rounded-lg p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-brand-text font-sans mb-1">
                    We've sent a confirmation email
                  </p>
                  <p className="text-[11px] text-brand-muted font-sans">
                    We'll review your account and notify you via email once it's approved. This usually takes 1-3 business days.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => onNavigate('login')}
                className="w-full bg-brand-gold text-brand-bg font-sans font-bold text-xs py-3.5 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-brand-gold/10"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Check Status Later
              </button>

              <button
                onClick={() => onNavigate('landing')}
                className="text-xs text-brand-muted font-sans hover:text-brand-gold transition-colors"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
