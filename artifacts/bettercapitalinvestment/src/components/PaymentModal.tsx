import { useState, useEffect, FormEvent, useRef } from 'react';
import { X, Loader2, Copy, CheckCircle2, ExternalLink, Bitcoin, CreditCard, Building2, AlertCircle, Upload, FileText, Image } from 'lucide-react';

interface CryptoAddresses {
  btc: string | null;
  usdtTrc20: string | null;
  usdtErc20: string | null;
  eth: string | null;
  sol: string | null;
}

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Tab = 'bank-transfer' | 'paystack' | 'flutterwave' | 'monnify' | 'crypto';
type CryptoNetwork = 'BTC' | 'ETH' | 'SOL' | 'USDT-ERC20' | 'USDT-TRC20' | 'USDT-BEP20' | 'BNB';

const NETWORK_MAP: Record<CryptoNetwork, keyof CryptoAddresses> = {
  'BTC': 'btc',
  'ETH': 'eth',
  'SOL': 'sol',
  'USDT-TRC20': 'usdtTrc20',
  'USDT-ERC20': 'usdtErc20',
  'USDT-BEP20': 'usdtErc20', // Same as ERC20 for now
  'BNB': 'btc', // Placeholder - add bnbAddress to backend if needed
};

const ALL_TABS: { id: Tab; label: string; icon: React.ReactNode; settingKey: string }[] = [
  { id: 'bank-transfer', label: 'Bank Transfer', icon: <Building2 className="w-3.5 h-3.5" />, settingKey: 'gateway_bank_transfer_enabled' },
  { id: 'paystack', label: 'Paystack', icon: <CreditCard className="w-3.5 h-3.5" />, settingKey: 'gateway_paystack_enabled' },
  { id: 'flutterwave', label: 'Flutterwave', icon: <CreditCard className="w-3.5 h-3.5" />, settingKey: 'gateway_flutterwave_enabled' },
  { id: 'monnify', label: 'Monnify', icon: <Building2 className="w-3.5 h-3.5" />, settingKey: 'gateway_monnify_enabled' },
  { id: 'crypto', label: 'Crypto', icon: <Bitcoin className="w-3.5 h-3.5" />, settingKey: 'gateway_crypto_enabled' },
];

export default function PaymentModal({ onClose, onSuccess }: PaymentModalProps) {
  const [gatewaySettings, setGatewaySettings] = useState<Record<string, string>>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [tab, setTab] = useState<Tab | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cryptoAddresses, setCryptoAddresses] = useState<CryptoAddresses>({ btc: null, usdtTrc20: null, usdtErc20: null, eth: null, sol: null });
  const [cryptoNetwork, setCryptoNetwork] = useState<CryptoNetwork>('BTC');
  const [txHash, setTxHash] = useState('');
  const [copied, setCopied] = useState('');
  const [cryptoSubmitted, setCryptoSubmitted] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofBase64, setProofBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bankTransferStatus, setBankTransferStatus] = useState<'form' | 'pending' | 'upload'>('form');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setGatewaySettings(d ?? {});
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));
    fetch('/api/payments/crypto/addresses', { credentials: 'include' })
      .then(r => r.json()).then(setCryptoAddresses).catch(() => {});
  }, []);

  // Global paste handler for receipt screenshots
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (tab !== 'crypto' && tab !== 'bank-transfer') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            if (file.size > 5 * 1024 * 1024) {
              setError('File must be under 5MB.');
              return;
            }
            setProofFile(file);
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              setProofBase64(base64);
            };
            reader.readAsDataURL(file);
            setError('');
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [tab]);

  const enabledTabs = ALL_TABS.filter(t => gatewaySettings[t.settingKey] !== 'false');

  useEffect(() => {
    if (settingsLoaded && enabledTabs.length > 0 && tab === null) {
      setTab(enabledTabs[0].id);
    }
  }, [settingsLoaded, enabledTabs.length]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const parseAmount = () => {
    const n = parseFloat(amount);
    return isNaN(n) || n <= 0 ? null : n;
  };

  const initGateway = async (provider: string) => {
    const amt = parseAmount();
    if (!amt) { setError('Enter a valid amount'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch(`/api/payments/${provider}/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
        credentials: 'include',
      });
      const data = await r.json();
      if (!r.ok) { setError(data.message ?? 'Failed to initialize'); setLoading(false); return; }
      
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
        
        // FIX 3: Start polling for Monnify payment completion
        if (provider === 'monnify' && data.reference) {
          startMonnifyPolling(data.reference);
        }
      }
      
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startMonnifyPolling = (reference: string) => {
    let pollCount = 0;
    const maxPolls = 60; // Poll for max 3 minutes (60 * 3 seconds)
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const r = await fetch(`/api/payments/monnify/verify?reference=${reference}`, {
          credentials: 'include',
        });
        
        if (r.ok) {
          const data = await r.json();
          
          if (data.status === 'success') {
            clearInterval(pollInterval);
            onSuccess();
          }
        }
      } catch (err) {
        // Continue polling on errors
      }
      
      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
      }
    }, 3000); // Poll every 3 seconds
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File must be under 5MB.'); return; }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setProofBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleBankTransferRequest = async () => {
    const amt = parseAmount();
    if (!amt) { setError('Enter a valid amount'); return; }
    
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/payments/bank-transfer/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
        credentials: 'include',
      });
      const data = await r.json();
      if (!r.ok) { 
        setError(data.message ?? 'Request failed'); 
        setLoading(false); 
        return; 
      }
      
      // Store payment ID for later proof upload
      sessionStorage.setItem('bankTransferPaymentId', data.paymentId);
      setBankTransferStatus('pending');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransferProofSubmit = async () => {
    if (!proofBase64) { setError('Please upload payment proof'); return; }
    
    const paymentId = sessionStorage.getItem('bankTransferPaymentId');
    if (!paymentId) { setError('Payment ID not found. Please start over.'); return; }
    
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/payments/bank-transfer/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          proofImageBase64: proofBase64,
          proofImageName: proofFile ? proofFile.name : null,
        }),
        credentials: 'include',
      });
      const data = await r.json();
      if (!r.ok) { 
        setError(data.message ?? 'Submission failed'); 
        setLoading(false); 
        return; 
      }
      
      sessionStorage.removeItem('bankTransferPaymentId');
      onSuccess();
      onClose();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = parseAmount();
    if (!amt) { setError('Enter a valid amount'); return; }
    if (!proofBase64 && !txHash.trim()) { setError('Please upload payment proof or paste transaction hash'); return; }
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/payments/crypto/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          network: cryptoNetwork,
          txHash: txHash.trim() || null,
          proofImageBase64: proofBase64 || null,
          proofImageName: proofFile ? proofFile.name : null
        }),
        credentials: 'include',
      });
      const data = await r.json();
      if (!r.ok) { setError(data.message ?? 'Submission failed'); setLoading(false); return; }
      setCryptoSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentAddress = cryptoAddresses[NETWORK_MAP[cryptoNetwork]];

  if (!settingsLoaded) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-brand-surface border border-brand-border rounded-xl w-full max-w-md shadow-2xl p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-brand-gold" />
        </div>
      </div>
    );
  }

  if (enabledTabs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-brand-surface border border-brand-border rounded-xl w-full max-w-md shadow-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
          <AlertCircle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
          <p className="text-brand-text font-serif font-bold text-lg mb-2">No Payment Methods Available</p>
          <p className="text-brand-muted font-sans text-sm mb-5">All payment gateways are currently disabled. Please contact support.</p>
          <button onClick={onClose} className="bg-brand-gold text-brand-bg font-sans font-bold text-xs px-6 py-2.5 rounded uppercase tracking-widest hover:brightness-110 transition-all">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-brand-surface border border-brand-border rounded-xl w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border">
          <div>
            <h2 className="text-brand-text font-serif font-bold text-lg">Fund Account</h2>
            <p className="text-brand-muted font-sans text-xs mt-0.5">Choose a deposit method below</p>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-brand-text transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs — only enabled gateways */}
        <div className="flex gap-1 p-3 border-b border-brand-border bg-brand-bg/40">
          {enabledTabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setError(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-sans font-medium transition-all flex-1 justify-center ${
                tab === t.id
                  ? 'bg-brand-gold text-black'
                  : 'text-brand-muted hover:text-brand-text hover:bg-brand-border/30'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {error && (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-500/40 rounded-lg p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-300 font-sans text-xs">{error}</p>
            </div>
          )}

          {/* Paystack / Flutterwave / Monnify tabs */}
          {tab && (tab === 'paystack' || tab === 'flutterwave' || tab === 'monnify') && (
            <form onSubmit={(e) => { e.preventDefault(); initGateway(tab); }} className="space-y-4">
              <div className="bg-brand-bg/60 border border-brand-border/60 rounded-lg p-3 text-xs font-sans text-brand-muted leading-relaxed">
                {tab === 'paystack' && '✓ Card, bank transfer, USSD via Paystack — USD & NGN accepted'}
                {tab === 'flutterwave' && '✓ Card, bank transfer, mobile money via Flutterwave — global currencies'}
                {tab === 'monnify' && '✓ Bank transfer and card via Monnify — NGN bank accounts'}
              </div>
              <div>
                <label className="block text-brand-muted font-sans text-xs mb-1.5">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gold font-bold font-sans text-sm">$</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-brand-bg border border-brand-border rounded-lg pl-7 pr-4 py-2.5 text-brand-text font-sans text-sm focus:outline-none focus:border-brand-gold/60"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-gold text-black font-sans font-bold py-2.5 rounded-lg hover:bg-brand-gold/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {loading ? 'Redirecting…' : `Pay with ${tab.charAt(0).toUpperCase() + tab.slice(1)}`}
              </button>
            </form>
          )}

          {/* Crypto tab */}
          {tab === 'crypto' && (
            <div className="space-y-4">
              {cryptoSubmitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <p className="text-brand-text font-serif font-bold text-lg">Submission Received</p>
                  <p className="text-brand-muted font-sans text-sm mt-1">Your deposit is under review. Funds will be credited within 1–3 hours after blockchain confirmation.</p>
                  <button onClick={onClose} className="mt-4 text-brand-gold font-sans text-sm hover:underline">Close</button>
                </div>
              ) : (
                <form onSubmit={handleCryptoSubmit} className="space-y-4">
                  {/* Instructions for Crypto */}
                  <div className="bg-brand-bg/60 border border-brand-border/60 rounded-lg p-4 text-xs font-sans text-brand-muted leading-relaxed">
                    <p className="font-bold text-brand-text mb-1 flex items-center gap-1.5">
                      <Bitcoin className="w-4 h-4 text-brand-gold" />
                      Deposit via Crypto
                    </p>
                    <p>
                      Please make your payment via <strong className="text-brand-text">Crypto.com</strong>, <strong className="text-brand-text">Kraken</strong>, or any other exchange.
                    </p>
                  </div>

                  {/* Crypto Selector */}
                  <div>
                    <label className="block text-brand-muted font-sans text-xs mb-1.5 font-semibold uppercase tracking-wider">Select Cryptocurrency</label>
                    <select
                      value={cryptoNetwork}
                      onChange={e => setCryptoNetwork(e.target.value as CryptoNetwork)}
                      className="w-full bg-brand-bg border border-brand-border rounded-lg px-3 py-2.5 text-brand-text font-sans text-sm focus:outline-none focus:border-brand-gold/60"
                    >
                      <option value="BTC">Bitcoin (BTC)</option>
                      <option value="ETH">Ethereum (ETH)</option>
                      <option value="SOL">Solana (SOL)</option>
                      <option value="USDT-ERC20">USDT (ERC-20)</option>
                      <option value="USDT-TRC20">USDT (TRC-20)</option>
                      <option value="USDT-BEP20">USDT (BEP-20)</option>
                      <option value="BNB">BNB (Binance Coin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-brand-muted font-sans text-xs mb-1.5">Amount in USD equivalent</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gold font-bold font-sans text-sm">$</span>
                      <input
                        type="number" min="1" step="any" value={amount} onChange={e => setAmount(e.target.value)}
                        placeholder="Enter USD value"
                        className="w-full bg-brand-bg border border-brand-border rounded-lg pl-7 pr-4 py-2.5 text-brand-text font-sans text-sm focus:outline-none focus:border-brand-gold/60"
                      />
                    </div>
                  </div>

                  {/* Proof of payment upload */}
                  <div>
                    <label className="block text-brand-muted font-sans text-xs mb-2 uppercase tracking-wider font-semibold">Proof of Payment / Receipt</label>
                    <p className="text-[10px] text-brand-muted font-sans mb-2">Upload or paste (Ctrl+V) a screenshot or photo of your transaction receipt.</p>

                    {proofFile ? (
                      <div className="flex items-center gap-3 bg-brand-bg border border-brand-gold/30 rounded-lg px-3 py-2.5">
                        {proofFile.type.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-brand-gold shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-brand-gold shrink-0" />
                        )}
                        <span className="text-xs font-sans text-brand-text flex-1 truncate">{proofFile.name}</span>
                        <button
                          type="button"
                          onClick={() => { setProofFile(null); setProofBase64(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="text-brand-muted hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border border-dashed border-brand-border rounded-lg py-6 flex flex-col items-center gap-2 hover:border-brand-gold/50 hover:bg-brand-gold/5 transition-all bg-brand-bg/20"
                      >
                        <Upload className="w-5 h-5 text-brand-muted" />
                        <span className="text-xs font-sans text-brand-muted">Click to upload or paste receipt screenshot</span>
                        <span className="text-[10px] font-sans text-brand-muted/60">JPG, PNG · Max 5MB</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !proofFile || !parseAmount()}
                    className="w-full bg-brand-gold text-brand-bg font-sans font-bold text-xs py-3 rounded uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</> : 'Submit Deposit'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Bank Transfer tab */}
          {tab === 'bank-transfer' && (
            <div className="space-y-4">
              {bankTransferStatus === 'form' && (
                <div className="space-y-4">
                  <div className="bg-brand-bg/60 border border-brand-border/60 rounded-lg p-4 text-xs font-sans text-brand-muted leading-relaxed">
                    <p className="font-bold text-brand-text mb-1 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-brand-gold" />
                      Bank Transfer Deposit
                    </p>
                    <p>
                      Submit a deposit request. Admin will send you bank account details via email. After payment, upload proof to complete.
                    </p>
                  </div>
                  <div>
                    <label className="block text-brand-muted font-sans text-xs mb-1.5">Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gold font-bold font-sans text-sm">$</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full bg-brand-bg border border-brand-border rounded-lg pl-7 pr-4 py-2.5 text-brand-text font-sans text-sm focus:outline-none focus:border-brand-gold/60"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleBankTransferRequest}
                    disabled={loading || !parseAmount()}
                    className="w-full bg-brand-gold text-brand-bg font-sans font-bold text-xs py-3 rounded uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</> : 'Send Request'}
                  </button>
                </div>
              )}

              {bankTransferStatus === 'pending' && (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-brand-gold mx-auto mb-3" />
                  <p className="text-brand-text font-serif font-bold text-lg mb-2">Request Sent!</p>
                  <p className="text-brand-muted font-sans text-sm mb-4">Admin will send bank account details to your email shortly. Once you make the payment, return here to upload proof.</p>
                  <button
                    onClick={() => setBankTransferStatus('upload')}
                    className="bg-brand-gold text-brand-bg font-sans font-bold text-xs py-2.5 px-6 rounded uppercase tracking-widest hover:brightness-110 transition-all"
                  >
                    Already Paid - Upload Proof
                  </button>
                </div>
              )}

              {bankTransferStatus === 'upload' && (
                <div className="space-y-4">
                  <div className="bg-brand-bg/60 border border-brand-border/60 rounded-lg p-4 text-xs font-sans text-brand-muted leading-relaxed">
                    <p className="font-bold text-brand-text mb-1">Upload Payment Proof</p>
                    <p>Upload a screenshot or photo of your bank transfer confirmation.</p>
                  </div>

                  <div>
                    <label className="block text-brand-muted font-sans text-xs mb-2 uppercase tracking-wider font-semibold">Proof of Payment</label>
                    <p className="text-[10px] text-brand-muted font-sans mb-2">Upload or paste (Ctrl+V) your payment receipt/confirmation.</p>

                    {proofFile ? (
                      <div className="flex items-center gap-3 bg-brand-bg border border-brand-gold/30 rounded-lg px-3 py-2.5">
                        {proofFile.type.startsWith('image/') ? (
                          <Image className="w-4 h-4 text-brand-gold shrink-0" />
                        ) : (
                          <FileText className="w-4 h-4 text-brand-gold shrink-0" />
                        )}
                        <span className="text-xs font-sans text-brand-text flex-1 truncate">{proofFile.name}</span>
                        <button
                          type="button"
                          onClick={() => { setProofFile(null); setProofBase64(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="text-brand-muted hover:text-red-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border border-dashed border-brand-border rounded-lg py-6 flex flex-col items-center gap-2 hover:border-brand-gold/50 hover:bg-brand-gold/5 transition-all bg-brand-bg/20"
                      >
                        <Upload className="w-5 h-5 text-brand-muted" />
                        <span className="text-xs font-sans text-brand-muted">Click to upload or paste receipt screenshot</span>
                        <span className="text-[10px] font-sans text-brand-muted/60">JPG, PNG · Max 5MB</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <button
                    onClick={handleBankTransferProofSubmit}
                    disabled={loading || !proofFile}
                    className="w-full bg-brand-gold text-brand-bg font-sans font-bold text-xs py-3 rounded uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</> : 'Submit Proof'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
