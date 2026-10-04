'use client';
import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';
import { toast } from 'sonner';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Building,
  KeyRound,
  ArrowLeft,
  X,
} from 'lucide-react';

export const GoogleIcon = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export const MicrosoftIcon = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#f25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
    <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
    <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
  </svg>
);

export const GitHubIcon = ({ className = 'size-4' }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

export const EmailFirstAuth = ({ initialMode = 'SIGN_IN' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const inviteToken = searchParams.get('token');
  const urlResetToken = searchParams.get('token');
  const urlEmail = searchParams.get('email');

  // Determine initial tab based on route or prop
  const getInitialTab = () => {
    if (location.pathname.includes('reset-password') || (urlResetToken && urlEmail)) {
      return 'RESET_PASSWORD';
    }
    if (location.pathname.includes('forgot-password') || initialMode === 'FORGOT_PASSWORD') {
      return 'FORGOT_PASSWORD';
    }
    if (location.pathname.includes('sign-up') || initialMode === 'SIGN_UP') {
      return 'REGISTER';
    }
    return 'LOGIN';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  // Password reset state
  const [resetStep, setResetStep] = useState(urlResetToken ? 'VERIFY_AND_RESET' : 'REQUEST_EMAIL');
  const [resetToken, setResetToken] = useState(urlResetToken || '');

  // Secondary mode for OTP login
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpStep, setOtpStep] = useState('ENTER_EMAIL'); // 'ENTER_EMAIL' | 'VERIFY_OTP' | 'SET_PASSWORD'

  // Social Auth Modal & State
  const [socialModal, setSocialModal] = useState(null); // 'google' | 'microsoft' | 'github'
  const [socialCustomEmail, setSocialCustomEmail] = useState('');
  const [socialCustomName, setSocialCustomName] = useState('');

  // Form State
  const [email, setEmail] = useState(urlEmail ? decodeURIComponent(urlEmail) : '');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  // Countdown timer for OTP / Reset
  useEffect(() => {
    let timer;
    if ((isOtpMode || activeTab === 'RESET_PASSWORD') && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpMode, activeTab, countdown]);

  const handleRedirectAfterAuth = (workspaceId) => {
    queryClient.invalidateQueries({ queryKey: ['current'] });
    queryClient.invalidateQueries({ queryKey: ['workspaces'] });

    if (inviteToken) {
      window.location.href = `/invite/${inviteToken}`;
    } else if (workspaceId) {
      window.location.href = `/workspaces/${workspaceId}`;
    } else {
      window.location.href = '/';
    }
  };

  // Direct Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid work email.');
      return;
    }
    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.login({
        email: email.trim(),
        password,
      });

      toast.success('Signed in successfully! Opening klanservicehub...');
      handleRedirectAfterAuth(res.workspaceId);
    } catch (err) {
      toast.error(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Direct Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid work email.');
      return;
    }
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      toast.success('Account created successfully! Launching your workspace...');
      handleRedirectAfterAuth(res.workspaceId);
    } catch (err) {
      toast.error(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  // OTP: Send Verification Code (Only for existing users)
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid work email.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.sendOtp(email.trim(), 'LOGIN');
      setOtpStep('VERIFY_OTP');
      setCountdown(600);
      setOtp(['', '', '', '', '', '']);
      toast.success(`Verification code sent to ${email}`);
      if (res.simulatedOtp) {
        toast.info(`Development Backup Code: ${res.simulatedOtp}`, { duration: 10000 });
      }
    } catch (err) {
      toast.error(err.message || 'User does not exist. Please check your email or register a new account.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance focus to next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // OTP: Verify Code & Directly Log In Existing User
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      toast.error('Please enter all 6 digits of the code.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.loginWithOtp(email.trim(), fullOtp);
      toast.success('Signed in successfully! Launching your workspace...');
      handleRedirectAfterAuth(res.workspaceId);
    } catch (err) {
      toast.error(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // OTP: Complete Registration
  const handleCompleteOtpAuth = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!password || password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      toast.success('Account setup complete! Welcome to Jira.');
      handleRedirectAfterAuth(res.workspaceId);
    } catch (err) {
      toast.error(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------- FORGOT PASSWORD HANDLERS --------------------
  const handleRequestPasswordReset = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid registered work email.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.forgotPassword({ email: email.trim() });
      toast.success(`✉️ Verification OTP and reset link sent to ${email}!`);
      if (res?.simulatedOtp) {
        toast.info(`Development Backup OTP: ${res.simulatedOtp}`, { duration: 10000 });
      }
      setResetToken(res?.token || '');
      setActiveTab('RESET_PASSWORD');
      setResetStep('VERIFY_AND_RESET');
      setCountdown(900); // 15 mins
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      toast.error(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompletePasswordReset = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (!resetToken && fullOtp.length !== 6) {
      toast.error('Please enter the 6-digit verification OTP code from your email.');
      return;
    }
    if (!password || password.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.resetPassword({
        email: email.trim(),
        password,
        otp: fullOtp.length === 6 ? fullOtp : undefined,
        token: resetToken || undefined,
      });

      toast.success('🎉 Password reset successfully! Entering klanservicehub...');
      handleRedirectAfterAuth(res.workspaceId);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password. Please verify the code.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const executeSocialLogin = async (provider, chosenEmail, chosenName) => {
    if (!chosenEmail || !chosenEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.socialLogin({
        provider,
        email: chosenEmail.trim(),
        name: chosenName?.trim() || chosenEmail.split('@')[0],
      });
      const providerLabel = provider === 'microsoft' ? 'Microsoft 365' : provider.charAt(0).toUpperCase() + provider.slice(1);
      toast.success(`🎉 Authenticated with ${providerLabel} as ${chosenEmail.trim()}!`);
      setSocialModal(null);
      handleRedirectAfterAuth(res.workspaceId);
    } catch (err) {
      toast.error(err.message || `Failed to authenticate with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const onSocialButtonClick = (provider) => {
    if (email && email.includes('@')) {
      executeSocialLogin(provider, email, name);
    } else {
      setSocialCustomEmail('');
      setSocialCustomName('');
      setSocialModal(provider);
    }
  };

  const isResetMode = activeTab === 'FORGOT_PASSWORD' || activeTab === 'RESET_PASSWORD';

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl border border-neutral-200/80 bg-white p-7 shadow-xl space-y-5 select-none relative">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <div className="size-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
          {isResetMode ? <KeyRound className="size-5 text-white" /> : 'K'}
        </div>
        <h1 className="text-xl font-black text-neutral-900">
          {isResetMode
            ? activeTab === 'FORGOT_PASSWORD'
              ? 'Reset Your Password'
              : 'Set New Password'
            : isOtpMode
            ? 'Sign In with Verification Code'
            : activeTab === 'LOGIN'
            ? 'Welcome Back to klanservicehub'
            : 'Create Your klanservicehub Account'}
        </h1>
        <p className="text-xs text-neutral-500">
          {isResetMode
            ? activeTab === 'FORGOT_PASSWORD'
              ? 'Enter your registered email to receive an OTP verification code & direct reset link.'
              : `Enter the 6-digit OTP sent to ${email || 'your email'} and your new password.`
            : isOtpMode
            ? otpStep === 'ENTER_EMAIL'
              ? 'Enter your work email to receive a secure 6-digit one-time passcode.'
              : otpStep === 'VERIFY_OTP'
              ? `Enter the 6-digit verification code sent to ${email}`
              : 'Complete your profile setup to log in.'
            : activeTab === 'LOGIN'
            ? 'Enter your work credentials to access your klanservicehub workspace.'
            : 'Get started with klanservicehub for your entire team.'}
        </p>
      </div>

      {/* Mode Switcher Tabs (Login vs Register) */}
      {!isOtpMode && !isResetMode && (
        <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('LOGIN')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'LOGIN'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REGISTER')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'REGISTER'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Register
          </button>
        </div>
      )}

      {/* -------------------- TAB 1: DIRECT LOGIN -------------------- */}
      {!isOtpMode && !isResetMode && activeTab === 'LOGIN' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">Work Email *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 size-4 text-neutral-400" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-700">Password *</label>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('FORGOT_PASSWORD');
                  setResetStep('REQUEST_EMAIL');
                }}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 size-4 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="size-4 animate-spin" /> : <span>Log In</span>}
            {!loading && <ArrowRight className="size-4" />}
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOtpMode(true);
                setOtpStep('ENTER_EMAIL');
              }}
              className="text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              <KeyRound className="size-3.5" /> Sign in with One-Time Code (OTP)
            </button>
          </div>
        </form>
      )}

      {/* -------------------- TAB 2: DIRECT REGISTER -------------------- */}
      {!isOtpMode && !isResetMode && activeTab === 'REGISTER' && (
        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 size-4 text-neutral-400" />
              <input
                type="text"
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">Work Email *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 size-4 text-neutral-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">Create Password * (min 8 chars)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 size-4 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !name || !email || !password}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="size-4 animate-spin" /> : <span>Create Jira Account</span>}
            {!loading && <ArrowRight className="size-4" />}
          </button>
        </form>
      )}

      {/* Social Auth Providers (Google, Microsoft, GitHub) - Kept below the email option */}
      {!isOtpMode && !isResetMode && (
        <div className="space-y-3 pt-1">
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-white px-3 font-bold text-neutral-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => onSocialButtonClick('google')}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-neutral-300 bg-white py-2.5 px-4 text-xs font-bold text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400 shadow-xs transition active:scale-[0.99] disabled:opacity-50"
            >
              <GoogleIcon className="size-4" />
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => onSocialButtonClick('microsoft')}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-neutral-300 bg-white py-2.5 px-4 text-xs font-bold text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400 shadow-xs transition active:scale-[0.99] disabled:opacity-50"
            >
              <MicrosoftIcon className="size-4" />
              <span>Continue with Microsoft</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => onSocialButtonClick('github')}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-neutral-300 bg-white py-2.5 px-4 text-xs font-bold text-neutral-800 hover:bg-neutral-50 hover:border-neutral-400 shadow-xs transition active:scale-[0.99] disabled:opacity-50"
            >
              <GitHubIcon className="size-4 text-neutral-900" />
              <span>Continue with GitHub</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------- FORGOT PASSWORD: REQUEST EMAIL -------------------- */}
      {!isOtpMode && activeTab === 'FORGOT_PASSWORD' && (
        <form onSubmit={handleRequestPasswordReset} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">Registered Work Email *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 size-4 text-neutral-400" />
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              We'll send an OTP code and a password reset link to this email address.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="size-4 animate-spin" /> : <span>Send Reset Code & Link</span>}
            {!loading && <ArrowRight className="size-4" />}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('LOGIN')}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1"
            >
              <ArrowLeft className="size-3.5" /> Back to Sign In
            </button>
          </div>
        </form>
      )}

      {/* -------------------- RESET PASSWORD: VERIFY OTP & SET PASSWORD -------------------- */}
      {!isOtpMode && activeTab === 'RESET_PASSWORD' && (
        <form onSubmit={handleCompletePasswordReset} className="space-y-4">
          {/* OTP Code Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-700">Verification OTP Code *</label>
              <span className="text-[11px] font-bold text-blue-600">Expires in {formatTime(countdown)}</span>
            </div>

            <div className="flex justify-between gap-1.5">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !digit && idx > 0) {
                      document.getElementById(`otp-${idx - 1}`)?.focus();
                    }
                  }}
                  className="size-11 text-center font-bold text-lg rounded-xl border border-neutral-300 focus:border-blue-600 focus:outline-none shadow-xs"
                />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-neutral-400 text-center">
              Check your inbox or Spam folder for the 6-digit code.
            </p>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">New Password * (min 8 chars)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 size-4 text-neutral-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">Confirm New Password *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 size-4 text-neutral-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="size-4 animate-spin" /> : <span>Reset Password & Enter Jira</span>}
            {!loading && <ArrowRight className="size-4" />}
          </button>

          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={handleRequestPasswordReset}
              disabled={loading || countdown > 840}
              className="font-semibold text-blue-600 hover:underline disabled:opacity-50"
            >
              Resend Code
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('LOGIN')}
              className="font-semibold text-neutral-500 hover:text-neutral-900"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* -------------------- OTP LOGIN ALTERNATIVE FLOW -------------------- */}
      {isOtpMode && (
        <div className="space-y-4">
          {otpStep === 'ENTER_EMAIL' && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Work Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : <span>Send 6-Digit Code</span>}
                {!loading && <ArrowRight className="size-4" />}
              </button>
            </form>
          )}

          {otpStep === 'VERIFY_OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-neutral-700">Verification Code</label>
                  <span className="text-[11px] font-bold text-blue-600">Expires in {formatTime(countdown)}</span>
                </div>

                <div className="flex justify-between gap-1.5">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !digit && idx > 0) {
                          document.getElementById(`otp-${idx - 1}`)?.focus();
                        }
                      }}
                      className="size-11 text-center font-bold text-lg rounded-xl border border-neutral-300 focus:border-blue-600 focus:outline-none shadow-xs"
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : <span>Verify & Continue</span>}
                {!loading && <ArrowRight className="size-4" />}
              </button>

              <div className="flex items-center justify-between text-xs text-neutral-500">
                <button
                  type="button"
                  onClick={() => setOtpStep('ENTER_EMAIL')}
                  className="hover:underline text-neutral-600 font-medium"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={countdown > 540}
                  className="hover:underline text-blue-600 font-bold disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {otpStep === 'SET_PASSWORD' && (
            <form onSubmit={handleCompleteOtpAuth} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Your Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Set Password * (min 8 chars)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-neutral-300 pl-10 pr-3.5 py-2 text-sm font-medium focus:border-blue-600 focus:outline-none shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !name || !password || !confirmPassword}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="size-4 animate-spin" /> : <span>Complete & Log In</span>}
              </button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => {
                setIsOtpMode(false);
                setOtpStep('ENTER_EMAIL');
              }}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800"
            >
              ← Back to standard password login
            </button>
          </div>
        </div>
      )}

      {/* Social Auth / Demo Logins */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 font-bold text-neutral-400">Quick demo access</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            setEmail('owner@company.com');
            setPassword('Password@123');
            setActiveTab('LOGIN');
            setIsOtpMode(false);
            toast.info('Loaded demo Owner credentials');
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 shadow-xs transition"
        >
          <Sparkles className="size-4 text-blue-600" />
          Demo Owner
        </button>

        <button
          type="button"
          onClick={() => {
            setEmail('navithajune06@gmail.com');
            setPassword('Password@123');
            setActiveTab('LOGIN');
            setIsOtpMode(false);
            toast.info('Loaded Gmail credentials');
          }}
          className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 shadow-xs transition"
        >
          <Mail className="size-4 text-rose-500" />
          Gmail User
        </button>
      </div>

      <div className="pt-2 text-center text-[11px] text-neutral-400">
        By continuing, you agree to the Klanvision Cloud Terms of Service and Privacy Policy.
      </div>

      {/* Social Provider One-Click / Custom Account Dialog Modal */}
      {socialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4 text-neutral-800 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                {socialModal === 'google' && <GoogleIcon className="size-5" />}
                {socialModal === 'microsoft' && <MicrosoftIcon className="size-5" />}
                {socialModal === 'github' && <GitHubIcon className="size-5 text-neutral-900" />}
                <h3 className="text-sm font-bold text-neutral-900">
                  {socialModal === 'google'
                    ? 'Sign in with Google'
                    : socialModal === 'microsoft'
                    ? 'Sign in with Microsoft 365'
                    : 'Sign in with GitHub'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSocialModal(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              {socialModal === 'google'
                ? 'Choose an account or enter your Google email to continue to klanservicehub:'
                : socialModal === 'microsoft'
                ? 'Use your Microsoft work, school, or personal account to continue:'
                : 'Authorize with your GitHub developer account:'}
            </p>

            {/* Quick Demo Accounts for single-click auth */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                Quick Single-Click Profiles:
              </label>

              {socialModal === 'google' && (
                <>
                  <button
                    type="button"
                    onClick={() => executeSocialLogin('google', 'alex.morgan@gmail.com', 'Alex Morgan')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        AM
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900">Alex Morgan</p>
                        <p className="text-[11px] text-neutral-500">alex.morgan@gmail.com</p>
                      </div>
                    </div>
                    <ArrowRight className="size-3.5 text-neutral-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => executeSocialLogin('google', 'navithajune06@gmail.com', 'Navitha G')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                        NG
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900">Navitha G</p>
                        <p className="text-[11px] text-neutral-500">navithajune06@gmail.com</p>
                      </div>
                    </div>
                    <ArrowRight className="size-3.5 text-neutral-400" />
                  </button>
                </>
              )}

              {socialModal === 'microsoft' && (
                <>
                  <button
                    type="button"
                    onClick={() => executeSocialLogin('microsoft', 'sarah.chen@microsoft.com', 'Sarah Chen')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                        SC
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900">Sarah Chen (M365)</p>
                        <p className="text-[11px] text-neutral-500">sarah.chen@microsoft.com</p>
                      </div>
                    </div>
                    <ArrowRight className="size-3.5 text-neutral-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => executeSocialLogin('microsoft', 'developer@outlook.com', 'Dev Lead')}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                        DL
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900">Dev Lead (Outlook)</p>
                        <p className="text-[11px] text-neutral-500">developer@outlook.com</p>
                      </div>
                    </div>
                    <ArrowRight className="size-3.5 text-neutral-400" />
                  </button>
                </>
              )}

              {socialModal === 'github' && (
                <button
                  type="button"
                  onClick={() => executeSocialLogin('github', 'dev.alex@github.com', 'Alex Developer')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-50 text-left transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                      GH
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">Alex Developer</p>
                      <p className="text-[11px] text-neutral-500">dev.alex@github.com</p>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-neutral-400" />
                </button>
              )}
            </div>

            {/* Or custom email input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                executeSocialLogin(socialModal, socialCustomEmail, socialCustomName);
              }}
              className="space-y-3 pt-2 border-t border-neutral-100"
            >
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                  Or enter your {socialModal === 'google' ? 'Google' : socialModal === 'microsoft' ? 'Microsoft' : 'GitHub'} email:
                </label>
                <input
                  type="email"
                  required
                  value={socialCustomEmail}
                  onChange={(e) => setSocialCustomEmail(e.target.value)}
                  placeholder={
                    socialModal === 'google'
                      ? 'your.name@gmail.com'
                      : socialModal === 'microsoft'
                      ? 'user@company.com or @outlook.com'
                      : 'username@users.noreply.github.com'
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={socialCustomName}
                  onChange={(e) => setSocialCustomName(e.target.value)}
                  placeholder="Your display name (optional)"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSocialModal(null)}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !socialCustomEmail}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? <RefreshCw className="size-3.5 animate-spin" /> : null}
                  <span>Sign In</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailFirstAuth;
