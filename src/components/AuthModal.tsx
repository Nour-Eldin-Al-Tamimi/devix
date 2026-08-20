import React, { useState } from 'react';
import { X, Mail, Lock, Sparkles, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  auth,
} from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { AuthModalMode } from '../types';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, setAuthModalMode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleModeSwitch = (newMode: AuthModalMode) => {
    setError(null);
    setInfoMessage(null);
    setAuthModalMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (authModalMode === 'forgot-password') {
      setSubmitting(true);
      try {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setInfoMessage('Password reset link sent to your email. Please check your inbox.');
      } catch (err: any) {
        console.error('Password reset error:', err);
        if (err.code === 'auth/user-not-found') {
          setError('No account found with this email address.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Please provide a valid email address.');
        } else {
          setError(err.message || 'Failed to send password reset email.');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (authModalMode === 'signup') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setSubmitting(true);
      try {
        await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        closeAuthModal();
      } catch (err: any) {
        console.error('Sign up error:', err);
        if (err.code === 'auth/email-already-in-use') {
          setError('An account with this email already exists. Try signing in.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Please provide a valid email address.');
        } else if (err.code === 'auth/weak-password') {
          setError('Password should be at least 6 characters.');
        } else {
          setError(err.message || 'Failed to create account.');
        }
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (authModalMode === 'signin') {
      setSubmitting(true);
      try {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        closeAuthModal();
      } catch (err: any) {
        console.error('Sign in error:', err);
        if (
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/wrong-password' ||
          err.code === 'auth/invalid-credential'
        ) {
          setError('Invalid email or password. Please check your credentials.');
        } else if (err.code === 'auth/invalid-email') {
          setError('Please provide a valid email address.');
        } else if (err.code === 'auth/too-many-requests') {
          setError('Too many failed attempts. Please try again later or reset password.');
        } else {
          setError(err.message || 'Failed to sign in.');
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1B18]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="auth-modal"
        className="bg-[#FCF9F4] border border-[#E5DDD2] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#E5DDD2] bg-[#FFF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#7A5338]/10 border border-[#7A5338]/20 flex items-center justify-center text-[#7A5338]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1F1B18]">
                {authModalMode === 'signup' && 'Create Your Account'}
                {authModalMode === 'signin' && 'Sign in to DEVIX'}
                {authModalMode === 'forgot-password' && 'Reset Password'}
              </h2>
              <p className="text-xs text-[#7A6E65]">
                {authModalMode === 'signup' && 'Save and sync your engineering blueprints across devices'}
                {authModalMode === 'signin' && 'Access your saved blueprints and Pro entitlement'}
                {authModalMode === 'forgot-password' && 'Enter your email to receive a reset link'}
              </p>
            </div>
          </div>
          <button
            id="close-auth-modal-btn"
            onClick={closeAuthModal}
            className="p-2 text-[#7A6E65] hover:text-[#1F1B18] hover:bg-[#EAE1DC]/50 rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#50443D] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A8988C] absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5DDD2] rounded-xl text-sm text-[#1F1B18] placeholder-[#A8988C] focus:outline-none focus:border-[#7A5338] focus:ring-1 focus:ring-[#7A5338]"
              />
            </div>
          </div>

          {authModalMode !== 'forgot-password' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#50443D] uppercase tracking-wider">
                  Password
                </label>
                {authModalMode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('forgot-password')}
                    className="text-xs text-[#7A5338] hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A8988C] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5DDD2] rounded-xl text-sm text-[#1F1B18] placeholder-[#A8988C] focus:outline-none focus:border-[#7A5338] focus:ring-1 focus:ring-[#7A5338]"
                />
              </div>
            </div>
          )}

          {authModalMode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#50443D] uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A8988C] absolute left-3.5 top-3 pointer-events-none" />
                <input
                  id="auth-confirm-password-input"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#E5DDD2] rounded-xl text-sm text-[#1F1B18] placeholder-[#A8988C] focus:outline-none focus:border-[#7A5338] focus:ring-1 focus:ring-[#7A5338]"
                />
              </div>
            </div>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-[#7A5338] hover:bg-[#67432A] disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>
                  {authModalMode === 'signup' && 'Create Account'}
                  {authModalMode === 'signin' && 'Sign In'}
                  {authModalMode === 'forgot-password' && 'Send Reset Email'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch */}
        <div className="p-4 border-t border-[#E5DDD2] bg-[#FAF5EE] text-center text-xs text-[#7A6E65]">
          {authModalMode === 'signin' && (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('signup')}
                className="text-[#7A5338] font-bold hover:underline"
              >
                Sign up free
              </button>
            </p>
          )}
          {authModalMode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('signin')}
                className="text-[#7A5338] font-bold hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
          {authModalMode === 'forgot-password' && (
            <p>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('signin')}
                className="text-[#7A5338] font-bold hover:underline"
              >
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
