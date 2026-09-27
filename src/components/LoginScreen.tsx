import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { InspectorUser } from '../types';
import { DEMO_INSPECTORS } from '../data/mockData';

interface LoginScreenProps {
  onLogin: (user: InspectorUser) => void;
  onOpenForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onOpenForgotPassword
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim()) {
      setErrorMsg('Please enter your username');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Please enter your password');
      return;
    }

    setIsLoading(true);

    // Simulate authentication check against MoSJE portal directory
    setTimeout(() => {
      setIsLoading(false);
      const matched = DEMO_INSPECTORS.find(
        (insp) => insp.username.toLowerCase() === username.toLowerCase().trim()
      );

      if (matched) {
        onLogin(matched);
      } else {
        // Fallback for custom username
        const fallbackInspector: InspectorUser = {
          id: 'insp-custom',
          name: username.includes('.') 
            ? username.replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : `${username} (Field Officer)`,
          username: username.trim(),
          role: 'FIELD_INSPECTOR',
          designation: 'MoSJE Field Inspection Officer',
          zone: 'North Zone - Field Evaluation',
          badgeNumber: 'MoSJE-INSP-2026-95',
          phone: '+91 98000 12345',
          email: `${username.toLowerCase().replace(/\s+/g, '')}@gov.mosje.in`
        };
        onLogin(fallbackInspector);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F3F5F9] px-4 py-8">
      {/* Centered Login Card - Exactly matched to the screenshot */}
      <main className="w-full max-w-[450px]">
        <div className="bg-white rounded-[28px] p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.05)] border border-slate-100">
          
          {/* Top Shield Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] border border-indigo-100/80 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-[#4F46E5]" strokeWidth={2.2} />
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-[26px] font-bold text-slate-900 tracking-tight text-center">
            Welcome Back
          </h2>
          <p className="text-sm text-slate-500 text-center mt-1 mb-7">
            Log in to your account
          </p>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label 
                htmlFor="username-input"
                className="block text-sm font-medium text-slate-700 mb-1.5 text-left"
              >
                Username
              </label>
              <div className="relative rounded-xl border border-slate-200 bg-white transition-all focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-indigo-100">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none bg-transparent"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label 
                htmlFor="password-input"
                className="block text-sm font-medium text-slate-700 mb-1.5 text-left"
              >
                Password
              </label>
              <div className="relative rounded-xl border border-slate-200 bg-white transition-all focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-indigo-100">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-10 py-3 text-sm text-slate-900 placeholder:text-slate-400 rounded-xl focus:outline-none bg-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right pt-0.5 pb-2">
              <button
                type="button"
                onClick={onOpenForgotPassword}
                className="text-sm font-medium text-[#4F46E5] hover:text-indigo-700 hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Log In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.99] text-white font-medium py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/25 transition-all text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Log In</span>
              )}
            </button>
          </form>

          {/* Exact Footer from Screenshot */}
          <footer className="text-center text-xs text-slate-400 mt-7">
            Secure offline-capable inspection portal by{' '}
            <span className="font-semibold text-slate-700">Erudites</span>
          </footer>

        </div>
      </main>
    </div>
  );
};
