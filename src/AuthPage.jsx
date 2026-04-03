import { useState } from 'react'
import { supabase } from './supabase'

export default function AuthPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const first = firstName.trim()
    const last = lastName.trim()
    if (!first || !last) { setError('Please enter both your first and last name.'); return }
    setLoading(true)
    setError(null)

    const fullName = `${first} ${last}`
    const email = `${first.toLowerCase()}.${last.toLowerCase()}@ipra-standards.internal`
    const password = `ipra-${first.toLowerCase()}-${last.toLowerCase()}-2025`

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({
        email, password, options: { data: { full_name: fullName } }
      })
      if (signUpError) { setError('Something went wrong. Please try again.'); setLoading(false); return }
      await supabase.auth.signInWithPassword({ email, password })
    }
    setLoading(false)
  }

  const ready = firstName.trim().length > 0 && lastName.trim().length > 0

  return (
    <div style={{ minHeight: '100vh', background: '#f2f1ef', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: '#1D9E75', borderRadius: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <svg width="24" height="24" viewBox="0 0 16 16" fill="white">
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8.75-3.25a.75.75 0 00-1.5 0V8c0 .199.079.39.22.53l2.25 2.25a.75.75 0 101.06-1.06L8.75 7.69V4.75z"/>
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a' }}>IPRA Accreditation Standards</div>
          <div style={{ fontSize: 13, color: '#999992', marginTop: 6 }}>Joint Distinguished Agency Committee · 2025</div>
        </div>

        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 14, padding: 32 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>Sign in to view the standards</div>
          <div style={{ fontSize: 13, color: '#999992', marginBottom: 24, lineHeight: 1.5 }}>Enter your name to access the accreditation standards library.</div>

          {error && (
            <div style={{ background: '#fcebeb', color: '#791f1f', border: '0.5px solid #f7c1c1', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555550', marginBottom: 6 }}>First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Jane"
                  autoFocus
                  autoComplete="given-name"
                  style={{ width: '100%', fontSize: 14, padding: '9px 11px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#555550', marginBottom: 6 }}>Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Smith"
                  autoComplete="family-name"
                  style={{ width: '100%', fontSize: 14, padding: '9px 11px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !ready}
              style={{ width: '100%', padding: '10px 0', background: ready && !loading ? '#1D9E75' : '#9FE1CB', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: ready && !loading ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'background 0.15s' }}>
              {loading ? 'Signing in…' : 'View standards'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#999992' }}>
          Illinois Park and Recreation Association
        </div>
      </div>
    </div>
  )
}
