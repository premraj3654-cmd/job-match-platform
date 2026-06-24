import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) throw error

      setSubmitted(true)
      toast.success('Check your email for the magic link!')
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.message || 'Failed to send login link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-lg mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">JobMatch AI</h1>
          <p className="text-gray-600">Smart Resume Matching Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {submitted ? (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Check your email!
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent a magic link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Click the link in the email to log in. If you don't see it,
                check your spam folder.
              </p>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setEmail('')
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Try another email
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </button>

              <p className="text-center text-sm text-gray-600 mt-4">
                We'll send you a secure login link via email
              </p>
            </form>
          )}
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">100%</div>
            <p className="text-sm text-gray-600">Secure</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">Instant</div>
            <p className="text-sm text-gray-600">Processing</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">AI</div>
            <p className="text-sm text-gray-600">Powered</p>
          </div>
        </div>
      </div>
    </div>
  )
}