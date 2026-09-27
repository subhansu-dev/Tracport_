import React, { useState } from 'react';
import { X, ShieldCheck, Mail, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [govEmail, setGovEmail] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!govEmail) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('otp');
    }, 700);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('success');
    }, 800);
  };

  const handleOtpChange = (val: string, index: number) => {
    if (val.length > 1) val = val[0];
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6 text-indigo-600" />
        </div>

        <h3 className="text-xl font-bold text-slate-900">
          Reset Portal Credentials
        </h3>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          MoSJE Verified Inspector Identity Recovery
        </p>

        {step === 'input' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Official MoSJE Email / Mobile ID
              </label>
              <div className="relative rounded-xl border border-slate-200 bg-white focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={govEmail}
                  onChange={(e) => setGovEmail(e.target.value)}
                  placeholder="e.g. anand.verma@gov.mosje.in"
                  className="w-full pl-10 pr-3.5 py-3 text-sm rounded-xl focus:outline-none bg-transparent"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Requires official NIC (.nic.in / .gov.in) or registered inspector phone number.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium py-3 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              <span>{isSubmitting ? 'Dispatching OTP...' : 'Send Security OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <p className="text-xs text-slate-600">
              An Aadhaar-linked OTP was sent to inspector credentials linked with <span className="font-semibold text-slate-900">{govEmail}</span>.
            </p>

            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  className="w-11 h-12 text-center text-lg font-bold text-slate-800 border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer"
            >
              {isSubmitting ? 'Validating Token...' : 'Verify & Generate Password Reset Link'}
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900">Verification Successful</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              A temporary password bypass link has been dispatched to your official Gov email. You can also log in directly with your demo inspector account.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
