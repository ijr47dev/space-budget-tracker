import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { Rocket, Mail, Lock, AlertCircle } from 'lucide-react';

/**
 * Login Component
 * Retro NES-themed authentication screen
 */
export default function Login() {
  const { signInWithGoogle, signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handles Google sign-in
   */
  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
    } catch (err) {
      setError('Failed to sign in with Google');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles email/password authentication
   */
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError('');
      setLoading(true);
      
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else {
        setError('Authentication failed');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-black text-white p-4 font-mono flex items-center justify-center">
      {/* Starfield Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 3 + 2 + 's'
            }}
          />
        ))}
      </div>

      {/* Login Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-black border-4 border-white p-6 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)]">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Rocket size={32} className="animate-bounce" />
              <h1 className="text-4xl font-bold">SPACE BUDGET</h1>
            </div>
            <p className="text-sm text-gray-400">NES EDITION v1.0</p>
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-gray-800 border-4 border-gray-900 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isSignUp ? '🚀 CREATE ACCOUNT' : '🎮 PLAYER LOGIN'}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900 border-2 border-red-500 p-3 mb-4 flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-black border-4 border-gray-300 p-3 font-bold mb-4 hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            {loading ? 'LOADING...' : '🌐 SIGN IN WITH GOOGLE'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-1 bg-gray-700"></div>
            <span className="text-gray-400 text-sm">OR</span>
            <div className="flex-1 h-1 bg-gray-700"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-bold mb-2">
                <Mail size={16} className="inline mr-2" />
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-900 border-4 border-gray-700 p-3 text-white font-bold focus:border-white outline-none"
                placeholder="player@space.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-bold mb-2">
                <Lock size={16} className="inline mr-2" />
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-gray-900 border-4 border-gray-700 p-3 text-white font-bold focus:border-white outline-none"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 border-4 border-green-800 p-3 font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              {loading ? 'LOADING...' : isSignUp ? '🚀 CREATE ACCOUNT' : '▶️ START GAME'}
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              className="text-blue-400 hover:text-blue-300 text-sm font-bold"
            >
              {isSignUp ? '◀️ BACK TO LOGIN' : '🆕 NEW PLAYER? CREATE ACCOUNT'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>PRESS START TO BEGIN YOUR FINANCIAL JOURNEY 🚀</p>
        </div>
      </div>
    </div>
  );
}