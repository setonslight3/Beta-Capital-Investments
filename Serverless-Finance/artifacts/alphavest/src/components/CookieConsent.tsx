import { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';

const COOKIE_KEY = 'alphavest_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    try { localStorage.setItem(COOKIE_KEY, 'accepted'); } catch { /* */ }
    setVisible(false);
  };

  const decline = () => {
    try { localStorage.setItem(COOKIE_KEY, 'declined'); } catch { /* */ }
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9998] flex justify-center pointer-events-none">
      <div className="bg-brand-surface border border-brand-border/80 rounded-xl shadow-2xl p-4 max-w-lg w-full pointer-events-auto slide-up flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="shrink-0 w-8 h-8 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mt-0.5">
            <Cookie className="w-4 h-4 text-brand-gold" />
          </div>
          <div className="min-w-0">
            <p className="text-brand-text font-sans text-xs font-semibold mb-0.5">We use cookies</p>
            <p className="text-brand-muted font-sans text-[11px] leading-relaxed">
              AlphaVest uses essential cookies to keep your session secure and remember your preferences. No tracking or advertising cookies are used.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={accept}
            className="flex-1 sm:flex-none bg-brand-gold text-brand-bg font-sans font-bold text-[11px] px-4 py-2 rounded-lg hover:brightness-110 transition-all uppercase tracking-wider"
          >
            Accept
          </button>
          <button
            onClick={decline}
            className="text-brand-muted hover:text-brand-text transition-colors p-1.5"
            title="Decline"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
