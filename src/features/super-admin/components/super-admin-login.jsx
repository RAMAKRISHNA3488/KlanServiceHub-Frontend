import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle2,
  Server,
  Terminal,
} from 'lucide-react';
import { platformAdminApi } from '@/lib/api-client';

export const SuperAdminLogin = () => {
  const navigate = useNavigate();

  // Auth flow states
  const [step, setStep] = useState('CREDENTIALS'); // 'CREDENTIALS' | 'MFA_CHALLENGE'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');

  // UI status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Step 1: Submit Master Credentials
  const handleSubmitCredentials = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide administrative email and password.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await platformAdminApi.login({ email, password });
      if (res.mfaRequired) {
        setStep('MFA_CHALLENGE');
        setMessage(res.message || `MFA challenge dispatched to ${res.email}`);
        if (res.simulatedOtp) {
          setSimulatedOtp(res.simulatedOtp);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit 6-digit MFA OTP Code
  const handleSubmitMfa = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the complete 6-digit MFA verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await platformAdminApi.verifyMfa({ email, otp });
      if (res.success) {
        navigate('/super-admin/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired MFA code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend MFA Code
  const handleResendMfa = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await platformAdminApi.login({ email, password });
      setMessage('A fresh verification code has been generated and dispatched.');
      if (res.simulatedOtp) {
        setSimulatedOtp(res.simulatedOtp);
      }
    } catch (err) {
      setError(err.message || 'Failed to resend MFA code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans text-slate-100 selection:bg-rose-500 selection:text-white">
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Terminal Frame */}
      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-600 p-0.5 shadow-xl shadow-rose-950/50 mb-3.5">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-rose-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            KlanServiceHub
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Master Plane
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Super Administrator Control & Governance Console
          </p>
        </div>

        {/* Security Advisory Pill */}
        <div className="mb-4 p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 flex items-start gap-2.5 text-xs text-rose-200">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="leading-tight">
            <span className="font-semibold text-rose-300">Restricted Access:</span> This portal is strictly for global platform administrators. All activity is logged and monitored.
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {message && !error && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {step === 'CREDENTIALS' ? (
            /* STEP 1: CREDENTIALS */
            <form onSubmit={handleSubmitCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Super Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="superadmin@klanservicehub.com"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Master Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying Master Authority...
                    </>
                  ) : (
                    <>
                      <span>Proceed to MFA Challenge</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800/80 text-center">
                <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  No public self-registration. Internal provision only.
                </span>
              </div>
            </form>
          ) : (
            /* STEP 2: MANDATORY MFA CHALLENGE */
            <form onSubmit={handleSubmitMfa} className="space-y-4">
              <div className="text-center pb-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-2">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white">Two-Factor Authentication (MFA)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enter the 6-digit verification code sent to <strong className="text-slate-200">{email}</strong>
                </p>
              </div>

              {simulatedOtp && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
                  <span>Dev/Testing Code:</span>
                  <span className="font-mono font-bold tracking-widest text-sm bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                    {simulatedOtp}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 text-center">
                  6-Digit Security Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] text-xl font-mono py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-rose-400 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 transition-all"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-medium text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-rose-950/60 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Validating MFA Token...
                    </>
                  ) : (
                    <>
                      <span>Confirm & Enter Master Control</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('CREDENTIALS');
                      setOtp('');
                      setError('');
                    }}
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    ← Back to credentials
                  </button>

                  <button
                    type="button"
                    onClick={handleResendMfa}
                    disabled={loading}
                    className="text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Resend Code
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Security Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Server className="w-3 h-3 text-slate-400" /> Cloudflare D1 Encrypted
          </span>
          <span>•</span>
          <span>Mandatory MFA Protected</span>
          <span>•</span>
          <span>Audited Sessions</span>
        </div>
      </div>
    </div>
  );
};

