import { Clock, Mail, ArrowLeft, Shield } from 'lucide-react';
import { ScreenType } from '../types';
import LogoIcon from './LogoIcon';

interface PendingViewProps {
  onNavigate: (screen: ScreenType) => void;
  email?: string;
}

export default function PendingView({ onNavigate, email }: PendingViewProps) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col font-serif">
      <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 md:px-16 h-14 sm:h-16 bg-brand-bg/95 backdrop-blur-md border-b border-brand-border">
        <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <LogoIcon size={24} />
          <span className="font-serif text-base font-bold text-brand-gold tracking-wider uppercase">Beta Capital Investment</span>
        </button>
        <button onClick={() => onNavigate('landing')} className="flex items-center gap-1.5 text-brand-muted hover:text-brand-gold transition-colors text-xs font-sans">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pt-20 pb-8">
        <div className="w-full max-w-md text-center">
          <div className="bg-brand-surface border border-brand-border rounded-lg shadow-2xl overflow-hidden">
            <div className="h-[3px] bg-brand-gold" />
            <div className="p-8 md:p-12">

              {/* Icon */}
              <div className="w-20 h-20 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Clock className="w-10 h-10 text-brand-gold" />
              </div>

              <h1 className="text-2xl sm:text-3xl text-brand-text font-serif mb-3">Account Under Review</h1>
              <p className="text-brand-muted font-sans text-sm leading-relaxed mb-6">
                Your registration has been received. Our compliance team is reviewing your account and KYC documents. You will receive an email once your account is approved.
              </p>

              {/* Steps */}
              <div className="space-y-3 mb-8 text-left">
                {[
                  { icon: Shield, label: 'KYC documents submitted', done: true },
                  { icon: Clock, label: 'Admin review in progress (1–3 business days)', done: false },
                  { icon: Mail, label: 'Approval email sent to you', done: false },
                ].map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${step.done ? 'border-brand-gold/30 bg-brand-gold/5' : 'border-brand-border bg-brand-bg/40'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-brand-gold text-brand-bg' : 'bg-brand-border/30 text-brand-muted'}`}>
                      <step.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-xs font-sans ${step.done ? 'text-brand-gold' : 'text-brand-muted'}`}>{step.label}</span>
                  </div>
                ))}
              </div>

              {email && (
                <p className="text-[11px] text-brand-muted font-sans mb-6">
                  A confirmation email has been sent to <span className="text-brand-gold font-bold">{email}</span>
                </p>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => onNavigate('login')}
                  className="w-full bg-brand-gold text-brand-bg font-sans font-bold text-xs py-3 rounded-lg uppercase tracking-widest hover:brightness-110 transition-all"
                >
                  Sign In (after approval)
                </button>
                <button
                  onClick={() => onNavigate('landing')}
                  className="w-full border border-brand-border text-brand-muted font-sans text-xs py-3 rounded-lg hover:border-brand-gold/40 hover:text-brand-text transition-all"
                >
                  Back to Home
                </button>
              </div>

              <p className="mt-6 text-[10px] text-brand-muted/50 font-sans">
                Questions? Email us at{' '}
                <a href="mailto:support@betacapitalinvestment.com" className="text-brand-gold hover:underline">
                  support@betacapitalinvestment.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
