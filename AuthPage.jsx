import { useState } from 'react'
import { supabase } from './supabase'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
      })
      if (error) setError(error.message)
      else setMessage('Check your email to confirm your account, then log in.')
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset'
      })
      if (error) setError(error.message)
      else setMessage('Password reset email sent — check your inbox.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 44, height: 44, background: 'var(--green)', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="white"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8.75-3.25a.75.75 0 00-1.5 0V8c0 .199.079.39.22.53l2.25 2.25a.75.75 0 101.06-1.06L8.75 7.69V4.75z"/></svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>IPRA Accreditation Standards</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Joint Distinguished Agency Committee</div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 14, padding: 28 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 22, color: 'var(--text)' }}>
            {mode === 'login' ? 'Sign in to your account' : mode === 'signup' ? 'Create an account' : 'Reset your password'}
          </div>

          {error && (
            <div style={{ background: 'var(--red-l)', color: 'var(--red-t)', border: '0.5px solid var(--red-b)', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ background: 'var(--green-l)', color: 'var(--green-t)', border: '0.5px solid #9FE1CB', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Full name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            {mode !== 'forgot' && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 5, fontWeight: 500 }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
            )}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '9px 0', background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset email'}
            </button>
          </form>

          <div style={{ marginTop: 18, fontSize: 13, color: 'var(--text3)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {mode === 'login' && <>
              <span>Don't have an account? <button onClick={() => setMode('signup')} style={{ border: 'none', background: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 13, padding: 0 }}>Sign up</button></span>
              <button onClick={() => setMode('forgot')} style={{ border: 'none', background: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 13, padding: 0 }}>Forgot password?</button>
            </>}
            {mode !== 'login' && (
              <span><button onClick={() => setMode('login')} style={{ border: 'none', background: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 13, padding: 0 }}>← Back to sign in</button></span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
