import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import AuthPage from './AuthPage'

// ─── Constants ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  active:       { label: 'Active',       bg: '#f8f8f7', color: '#555550', border: 'rgba(0,0,0,0.15)' },
  needs_review: { label: 'Needs review', bg: '#faeeda', color: '#633806', border: '#FAC775' },
  in_progress:  { label: 'In progress',  bg: '#e6f1fb', color: '#0c447c', border: '#B5D4F4' },
  approved:     { label: 'Approved',     bg: '#e1f5ee', color: '#085041', border: '#9FE1CB' },
}

function renumber(standards, sectionKey) {
  return standards.map((s, i) => ({ ...s, std_key: `${sectionKey}.${i + 1}`, sort_order: i }))
}

// ─── Small components ────────────────────────────────────────────────
function Badge({ type }) {
  return <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 500, flexShrink: 0, background: type === 'M' ? '#fcebeb' : '#e1f5ee', color: type === 'M' ? '#791f1f' : '#085041', border: `0.5px solid ${type === 'M' ? '#f7c1c1' : '#9FE1CB'}` }}>{type === 'M' ? 'Mandatory' : 'Optional'}</span>
}

function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.active
  return <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 500, background: c.bg, color: c.color, border: `0.5px solid ${c.border}` }}>{c.label}</span>
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [onDone])
  return <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 9999, background: type === 'error' ? '#fcebeb' : '#e1f5ee', color: type === 'error' ? '#791f1f' : '#085041', border: `0.5px solid ${type === 'error' ? '#f7c1c1' : '#9FE1CB'}`, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>{msg}</div>
}

function Modal({ children, onClose, wide, extraWide }) {
  const w = extraWide ? 780 : wide ? 660 : 500
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40, zIndex: 1000, overflowY: 'auto' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 12, padding: 26, width: w, maxWidth: '96vw', marginBottom: 40 }}>{children}</div>
    </div>
  )
}

function SectionHead({ children }) {
  return <div style={{ fontSize: 11, color: '#999992', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 6 }}>{children}</div>
}

// ─── Dashboard ────────────────────────────────────────────────────────
function Dashboard({ cats, year, allYears, onNavigate, profile }) {
  const allStds = cats.flatMap(c => c.sections.flatMap(s => s.standards))
  const total = allStds.length
  const mandatory = allStds.filter(s => s.type === 'M').length
  const approved = allStds.filter(s => s.status === 'approved').length
  const needsReview = allStds.filter(s => s.status === 'needs_review').length
  const inProgress = allStds.filter(s => s.status === 'in_progress').length
  const pct = total ? Math.round((approved / total) * 100) : 0

  const recentEdits = [...allStds]
    .filter(s => s.updated_at)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 6)

  const statCard = (label, value, sub, bg, color) => (
    <div style={{ background: bg || '#f8f8f7', borderRadius: 10, padding: '14px 16px', flex: 1 }}>
      <div style={{ fontSize: 11, color: color || '#999992', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 600, color: color || '#1a1a1a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: color || '#999992', marginTop: 4 }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a' }}>
          {year} Standards — Overview
        </div>
        <div style={{ fontSize: 13, color: '#999992', marginTop: 3 }}>
          Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}. Here's where things stand.
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {statCard('Total standards', total, `${mandatory} mandatory · ${total - mandatory} optional`)}
        {statCard('Approved', approved, `${pct}% of all standards`, '#e1f5ee', '#085041')}
        {statCard('Needs review', needsReview, 'flagged for attention', needsReview > 0 ? '#faeeda' : '#f8f8f7', needsReview > 0 ? '#633806' : '#999992')}
        {statCard('In progress', inProgress, 'being worked on', inProgress > 0 ? '#e6f1fb' : '#f8f8f7', inProgress > 0 ? '#0c447c' : '#999992')}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>Approval progress</span>
          <span style={{ fontSize: 12, color: '#999992' }}>{approved} / {total}</span>
        </div>
        <div style={{ height: 8, background: '#f2f1ef', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#1D9E75' : pct > 60 ? '#378ADD' : '#FAC775', borderRadius: 99, transition: 'width 0.4s' }} />
        </div>
      </div>

      {/* By category */}
      <div style={{ marginBottom: 24 }}>
        <SectionHead>By category</SectionHead>
        <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden' }}>
          {cats.map((cat, i) => {
            const stds = cat.sections.flatMap(s => s.standards)
            const catApproved = stds.filter(s => s.status === 'approved').length
            const catPct = stds.length ? Math.round((catApproved / stds.length) * 100) : 0
            const catNeedsReview = stds.filter(s => s.status === 'needs_review').length
            return (
              <div key={cat.key} onClick={() => onNavigate(cat.key)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i < cats.length - 1 ? '0.5px solid rgba(0,0,0,0.07)' : 'none', cursor: 'pointer', background: '#fff' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f8f7'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.dot_color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#1a1a1a', flex: 1 }}>{cat.label}</span>
                <span style={{ fontSize: 11, color: '#999992' }}>{stds.length} standards</span>
                {catNeedsReview > 0 && <span style={{ fontSize: 11, padding: '1px 7px', borderRadius: 4, background: '#faeeda', color: '#633806', border: '0.5px solid #FAC775' }}>{catNeedsReview} to review</span>}
                <div style={{ width: 80, height: 5, background: '#f2f1ef', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${catPct}%`, background: cat.dot_color, borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 11, color: '#999992', minWidth: 30, textAlign: 'right' }}>{catPct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent edits */}
      {recentEdits.length > 0 && (
        <div>
          <SectionHead>Recently edited</SectionHead>
          <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden' }}>
            {recentEdits.map((s, i) => (
              <div key={s.id} onClick={() => onNavigate(s.category_key, s.section_key)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < recentEdits.length - 1 ? '0.5px solid rgba(0,0,0,0.07)' : 'none', cursor: 'pointer', background: '#fff' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f8f7'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#999992', minWidth: 44 }}>{s.std_key}</span>
                <span style={{ fontSize: 13, color: '#1a1a1a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                <StatusBadge status={s.status} />
                <span style={{ fontSize: 11, color: '#999992', flexShrink: 0 }}>
                  {s.updated_by_name && `${s.updated_by_name} · `}
                  {new Date(s.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Edit Standard Modal ──────────────────────────────────────────────
function EditModal({ std, mode, sectionKey, totalInSection, onSave, onClose }) {
  const maxPos = mode === 'add' ? totalInSection + 1 : totalInSection
  const currentPos = mode === 'edit' ? (std.sort_order + 1) : maxPos
  const [form, setForm] = useState({
    title: std?.title || '',
    type: std?.type || 'O',
    status: std?.status || 'active',
    commentary: std?.commentary || '',
    evidence: Array.isArray(std?.evidence) ? std.evidence.join('\n') : '',
    position: currentPos,
    save_note: ''
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <Modal onClose={onClose} wide>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#1a1a1a' }}>{mode === 'add' ? 'Add standard' : `Edit ${std?.std_key}`}</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <SectionHead>Title</SectionHead>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Standard title..." autoFocus
            style={{ width: '100%', fontSize: 14, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div>
          <SectionHead>Position in section</SectionHead>
          <select value={form.position} onChange={e => set('position', parseInt(e.target.value))}
            style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' }}>
            {Array.from({ length: maxPos }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{mode === 'add' ? (n === maxPos ? `${n} — end of section` : `${n} — insert before ${sectionKey}.${n}`) : (n === currentPos ? `${n} — current` : `${n}`)}</option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: '#999992', marginTop: 3 }}>Others renumber automatically</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <SectionHead>Type</SectionHead>
          <div style={{ display: 'flex', gap: 6 }}>
            {['M', 'O'].map(t => (
              <button key={t} onClick={() => set('type', t)} style={{ flex: 1, padding: '7px 0', fontSize: 13, fontWeight: form.type === t ? 500 : 400, background: form.type === t ? (t === 'M' ? '#fcebeb' : '#e1f5ee') : '#f8f8f7', color: form.type === t ? (t === 'M' ? '#791f1f' : '#085041') : '#555550', border: `0.5px solid ${form.type === t ? (t === 'M' ? '#f7c1c1' : '#9FE1CB') : 'rgba(0,0,0,0.12)'}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t === 'M' ? 'Mandatory' : 'Optional'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <SectionHead>Status</SectionHead>
          <select value={form.status} onChange={e => set('status', e.target.value)}
            style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: `0.5px solid ${STATUS_CONFIG[form.status]?.border || 'rgba(0,0,0,0.18)'}`, borderRadius: 8, outline: 'none', fontFamily: 'inherit', background: STATUS_CONFIG[form.status]?.bg || '#fff', color: STATUS_CONFIG[form.status]?.color || '#1a1a1a', boxSizing: 'border-box' }}>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <SectionHead>Commentary</SectionHead>
        <textarea rows={3} value={form.commentary} onChange={e => set('commentary', e.target.value)} placeholder="Describe the intent of this standard..."
          style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <SectionHead>Evidence of compliance <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(one item per line)</span></SectionHead>
        <textarea rows={6} value={form.evidence} onChange={e => set('evidence', e.target.value)}
          style={{ width: '100%', fontSize: 12, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: "'JetBrains Mono', monospace", resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
          placeholder="a. Evidence item one&#10;b. Evidence item two" />
      </div>

      <div style={{ marginBottom: 22 }}>
        <SectionHead>Save note <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(optional — explain why this changed)</span></SectionHead>
        <input value={form.save_note} onChange={e => set('save_note', e.target.value)} placeholder="e.g. Updated per board meeting 3/15, reflects new state law..."
          style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '7px 16px', fontFamily: 'inherit' }}>Cancel</button>
        <button disabled={saving || !form.title.trim()}
          onClick={async () => { setSaving(true); await onSave({ ...form, evidence: form.evidence.split('\n').map(e => e.trim()).filter(Boolean) }); setSaving(false) }}
          style={{ padding: '7px 20px', background: form.title.trim() && !saving ? '#1D9E75' : '#9FE1CB', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: form.title.trim() && !saving ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          {saving ? 'Saving…' : mode === 'add' ? 'Add standard' : 'Save changes'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Comments + History Modal ─────────────────────────────────────────
function DetailModal({ std, onClose, profile }) {
  const [tab, setTab] = useState('history')
  const [versions, setVersions] = useState([])
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    Promise.all([
      supabase.from('standard_versions').select('*').eq('standard_id', std.id).order('changed_at', { ascending: false }),
      supabase.from('standard_comments').select('*').eq('standard_id', std.id).order('created_at', { ascending: true })
    ]).then(([{ data: v }, { data: c }]) => {
      setVersions(v || [])
      setComments(c || [])
      setLoading(false)
    })
  }, [std.id])

  const postComment = async () => {
    if (!newComment.trim()) return
    setPosting(true)
    const { data } = await supabase.from('standard_comments').insert({ standard_id: std.id, user_id: profile?.id, user_name: profile?.full_name || 'Unknown', body: newComment.trim() }).select().single()
    if (data) setComments(c => [...c, data])
    setNewComment('')
    setPosting(false)
  }

  const deleteComment = async (id) => {
    await supabase.from('standard_comments').delete().eq('id', id)
    setComments(c => c.filter(x => x.id !== id))
  }

  const changeBadge = (type) => {
    const s = { created: { bg: '#e1f5ee', color: '#085041', border: '#9FE1CB' }, updated: { bg: '#e6f1fb', color: '#0c447c', border: '#B5D4F4' }, deleted: { bg: '#fcebeb', color: '#791f1f', border: '#f7c1c1' } }[type]
    return <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 500, background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>{type}</span>
  }

  const tabBtn = (key, label, count) => (
    <button onClick={() => setTab(key)} style={{ padding: '6px 14px', fontSize: 13, fontWeight: tab === key ? 500 : 400, background: tab === key ? '#1a1a1a' : 'transparent', color: tab === key ? '#fff' : '#555550', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit' }}>
      {label} {count > 0 && <span style={{ fontSize: 11, opacity: 0.7 }}>({count})</span>}
    </button>
  )

  return (
    <Modal onClose={onClose} wide>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{std.std_key} — {std.title}</div>
      <div style={{ fontSize: 12, color: '#999992', marginBottom: 16 }}>{std.category_label} › {std.section_title}</div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {tabBtn('history', 'Version history', versions.length)}
        {tabBtn('comments', 'Comments', comments.length)}
      </div>

      {loading ? <div style={{ padding: '30px 0', textAlign: 'center', color: '#999992', fontSize: 13 }}>Loading…</div> : (
        <>
          {tab === 'history' && (
            versions.length === 0
              ? <div style={{ padding: '30px 0', textAlign: 'center', color: '#999992', fontSize: 13 }}>No history yet.</div>
              : <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden', maxHeight: 420, overflowY: 'auto' }}>
                {versions.map((v, i) => (
                  <div key={v.id} style={{ borderBottom: i < versions.length - 1 ? '0.5px solid rgba(0,0,0,0.07)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: '#f8f8f7' }}>
                      {changeBadge(v.change_type)}
                      <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>{v.changed_by_name || 'Unknown'}</span>
                      {v.save_note && <span style={{ fontSize: 11, color: '#555550', fontStyle: 'italic', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{v.save_note}"</span>}
                      <span style={{ fontSize: 11, color: '#999992', flexShrink: 0 }}>{new Date(v.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ padding: '8px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#999992' }}>{v.std_key}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{v.title}</span>
                        <Badge type={v.type} />
                        <StatusBadge status={v.status || 'active'} />
                      </div>
                      {v.commentary && <div style={{ fontSize: 12, color: '#555550', fontStyle: 'italic', marginBottom: 3 }}>{v.commentary}</div>}
                      {v.evidence?.map((e, j) => <div key={j} style={{ fontSize: 12, color: '#555550', padding: '1px 0 1px 12px', position: 'relative' }}><span style={{ position: 'absolute', left: 3, top: 6, width: 3, height: 3, borderRadius: '50%', background: '#aaa', display: 'inline-block' }} />{e}</div>)}
                    </div>
                  </div>
                ))}
              </div>
          )}

          {tab === 'comments' && (
            <div>
              {comments.length === 0
                ? <div style={{ padding: '20px 0 16px', textAlign: 'center', color: '#999992', fontSize: 13 }}>No comments yet. Add the first one below.</div>
                : <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden', marginBottom: 14, maxHeight: 320, overflowY: 'auto' }}>
                  {comments.map((c, i) => (
                    <div key={c.id} style={{ padding: '11px 14px', borderBottom: i < comments.length - 1 ? '0.5px solid rgba(0,0,0,0.07)' : 'none', background: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#e6f1fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#0c447c', flexShrink: 0 }}>{(c.user_name || '?').charAt(0).toUpperCase()}</div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>{c.user_name}</span>
                        <span style={{ fontSize: 11, color: '#999992' }}>{new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {c.user_id === profile?.id && <button onClick={() => deleteComment(c.id)} style={{ marginLeft: 'auto', fontSize: 11, padding: '1px 8px', color: '#791f1f', border: '0.5px solid #f7c1c1', background: 'transparent', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>}
                      </div>
                      <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.6, paddingLeft: 34 }}>{c.body}</div>
                    </div>
                  ))}
                </div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment…" rows={2}
                  style={{ flex: 1, fontSize: 13, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', resize: 'none', lineHeight: 1.5, boxSizing: 'border-box' }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment() } }} />
                <button disabled={posting || !newComment.trim()} onClick={postComment} style={{ padding: '0 16px', background: newComment.trim() ? '#1D9E75' : '#9FE1CB', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: newComment.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', alignSelf: 'stretch' }}>
                  {posting ? '…' : 'Post'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
        <button onClick={onClose} style={{ padding: '7px 16px', fontFamily: 'inherit' }}>Close</button>
      </div>
    </Modal>
  )
}

// ─── Archive Summary Modal ────────────────────────────────────────────
function ArchiveSummaryModal({ cats, year, activeYear, onConfirm, onClose, saving }) {
  const allStds = cats.flatMap(c => c.sections.flatMap(s => s.standards))
  const edited = allStds.filter(s => s.updated_at && new Date(s.updated_at) > new Date(`${year}-01-01`))
  const approved = allStds.filter(s => s.status === 'approved').length
  const needsReview = allStds.filter(s => s.status === 'needs_review').length

  return (
    <Modal onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#1a1a1a' }}>Archive {year}?</div>
      <div style={{ fontSize: 13, color: '#999992', marginBottom: 20 }}>Review the {year} summary before archiving.</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {[
          ['Total standards', allStds.length],
          ['Approved', approved],
          ['Edited this year', edited.length],
          ['Still needs review', needsReview],
        ].map(([label, val]) => (
          <div key={label} style={{ background: '#f8f8f7', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: '#999992', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a' }}>{val}</div>
          </div>
        ))}
      </div>

      {needsReview > 0 && (
        <div style={{ background: '#faeeda', border: '0.5px solid #FAC775', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#633806', marginBottom: 18 }}>
          <strong>{needsReview} standard{needsReview !== 1 ? 's' : ''}</strong> still flagged as "Needs review." You can still archive, but you may want to address these first.
        </div>
      )}

      <div style={{ fontSize: 13, color: '#555550', lineHeight: 1.7, marginBottom: 22 }}>
        This saves {year} as a read-only archive and creates {activeYear.year + 1} with all standards copied forward as a starting point.
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '7px 16px', fontFamily: 'inherit' }}>Cancel</button>
        <button disabled={saving} onClick={onConfirm} style={{ padding: '7px 18px', background: '#faeeda', color: '#633806', border: '0.5px solid #FAC775', borderRadius: 8, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          {saving ? 'Archiving…' : `Archive & advance to ${activeYear.year + 1}`}
        </button>
      </div>
    </Modal>
  )
}

// ─── Change Log Export ────────────────────────────────────────────────
async function exportChangeLog(year) {
  const { data: versions } = await supabase
    .from('standard_versions')
    .select('*, sections(key, title), categories:sections(category_id(label))')
    .order('changed_at', { ascending: false })

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Change Log ${year}</title>
<style>body{font-family:Georgia,serif;max-width:820px;margin:30px auto;padding:0 24px;color:#1a1a1a;font-size:13px;line-height:1.6}
h1{font-size:20px;border-bottom:2px solid #1D9E75;padding-bottom:10px;margin-bottom:20px}
.entry{border:1px solid #ddd;border-radius:5px;padding:12px;margin:10px 0;page-break-inside:avoid}
.meta{display:flex;gap:12px;margin-bottom:6px;font-size:12px;color:#555}
.badge{display:inline-block;padding:1px 7px;border-radius:3px;font-size:11px;font-weight:700}
.created{background:#dcfce7;color:#166534}.updated{background:#dbeafe;color:#1e40af}.deleted{background:#fee2e2;color:#991b1b}
.note{font-style:italic;color:#555;margin-top:4px;font-size:12px}
@media print{button{display:none}}
.btn{position:fixed;top:16px;right:16px;padding:8px 20px;background:#1D9E75;color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer}
</style></head><body>
<button class="btn" onclick="window.print()">Print / Save as PDF</button>
<h1>IPRA Accreditation Standards — Change Log ${year}</h1>
<p style="color:#555;margin-bottom:20px">Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>\n`

  if (!versions || versions.length === 0) {
    html += `<p style="color:#999">No changes recorded.</p>`
  } else {
    versions.forEach(v => {
      html += `<div class="entry">
<div class="meta">
  <span class="badge ${v.change_type}">${v.change_type.toUpperCase()}</span>
  <strong>${v.std_key}</strong>
  <span>${v.title}</span>
  <span style="margin-left:auto">${v.changed_by_name || 'Unknown'} · ${new Date(v.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
</div>
${v.save_note ? `<div class="note">Note: ${v.save_note}</div>` : ''}
</div>\n`
    })
  }

  html += `</body></html>`
  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  setTimeout(() => w.print(), 600)
}

// ─── Export Modal ─────────────────────────────────────────────────────
function ExportModal({ onClose, cats, year }) {
  const [selected, setSelected] = useState(() => { const s = {}; cats.forEach(c => { s[c.key] = true }); return s })
  const [format, setFormat] = useState(null)
  const [exporting, setExporting] = useState(false)
  const selectedCats = cats.filter(c => selected[c.key])
  const allSelected = cats.every(c => selected[c.key])
  const noneSelected = cats.every(c => !selected[c.key])
  const toggleAll = (val) => { const s = {}; cats.forEach(c => { s[c.key] = val }); setSelected(s) }

  const exportPDF = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>IPRA Standards ${year}</title>
<style>body{font-family:Georgia,serif;max-width:820px;margin:30px auto;padding:0 24px;color:#1a1a1a;line-height:1.75;font-size:13px}h1{font-size:22px;font-weight:600;border-bottom:2px solid #1D9E75;padding-bottom:10px;margin-bottom:24px}h2{font-size:17px;font-weight:600;margin-top:42px;padding:7px 14px;background:#f5f5f3;border-left:4px solid #888}h3{font-size:14px;font-weight:600;margin-top:22px;color:#444}.std{border:1px solid #ddd;border-radius:5px;padding:14px;margin:12px 0;page-break-inside:avoid}.badge{font-size:10px;padding:2px 6px;border-radius:3px;font-weight:700;margin-left:6px}.M{background:#fee2e2;color:#991b1b}.O{background:#dcfce7;color:#166534}.commentary{font-size:12px;color:#555;font-style:italic;margin:6px 0 8px}.ev-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#888;margin-bottom:5px}.ev{font-size:12px;padding:2px 0 2px 14px;position:relative}.ev:before{content:"•";position:absolute;left:3px;color:#888}@media print{h2{page-break-before:always}h2:first-of-type{page-break-before:avoid}.std{page-break-inside:avoid}button{display:none}}.btn{position:fixed;top:16px;right:16px;padding:8px 20px;background:#1D9E75;color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer}</style></head><body>
<button class="btn" onclick="window.print()">Print / Save as PDF</button>
<h1>IPRA — Joint Distinguished Agency<br>Accreditation Standards ${year}</h1>\n`
    selectedCats.forEach(cat => {
      html += `<h2>${cat.label}</h2>\n`
      cat.sections.forEach(sec => {
        html += `<h3>${sec.key} — ${sec.title}</h3>\n`
        sec.standards.forEach(s => {
          html += `<div class="std"><strong>${s.std_key} ${s.title}</strong><span class="badge ${s.type}">${s.type === 'M' ? 'MANDATORY' : 'OPTIONAL'}</span>${s.commentary ? `<div class="commentary"><strong style="font-style:normal">Commentary:</strong> ${s.commentary}</div>` : ''}<div class="ev-label">Evidence of compliance</div>${s.evidence.map(e => `<div class="ev">${e}</div>`).join('')}</div>\n`
        })
      })
    })
    html += `</body></html>`
    const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 800); onClose()
  }

  const exportWord = async () => {
    setExporting(true)
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = await import('docx')
      const children = []
      children.push(new Paragraph({ children: [new TextRun({ text: `IPRA — Joint Distinguished Agency`, bold: true, size: 32, color: '1D9E75' })], spacing: { after: 120 } }))
      children.push(new Paragraph({ children: [new TextRun({ text: `Accreditation Standards — ${year}`, bold: true, size: 26 })], spacing: { after: 400 } }))
      selectedCats.forEach(cat => {
        children.push(new Paragraph({ children: [new TextRun({ text: cat.label, bold: true, size: 26 })], heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '888780', space: 4 } } }))
        cat.sections.forEach(sec => {
          children.push(new Paragraph({ children: [new TextRun({ text: `${sec.key}  ${sec.title}`, bold: true, size: 22 })], heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120 } }))
          sec.standards.forEach(s => {
            children.push(new Paragraph({ children: [new TextRun({ text: `${s.std_key}  `, bold: true, size: 20, font: 'Courier New', color: '888780' }), new TextRun({ text: s.title, bold: true, size: 20 }), new TextRun({ text: `  [${s.type === 'M' ? 'MANDATORY' : 'OPTIONAL'}]`, bold: true, size: 17, color: s.type === 'M' ? '991b1b' : '166534' })], spacing: { before: 200, after: 60 } }))
            if (s.commentary) children.push(new Paragraph({ children: [new TextRun({ text: 'Commentary: ', bold: true, size: 17, italics: true, color: '555550' }), new TextRun({ text: s.commentary, size: 17, italics: true, color: '555550' })], spacing: { after: 60 }, indent: { left: 300 } }))
            children.push(new Paragraph({ children: [new TextRun({ text: 'Evidence of compliance:', bold: true, size: 17 })], spacing: { before: 60, after: 40 }, indent: { left: 300 } }))
            s.evidence.forEach(ev => children.push(new Paragraph({ children: [new TextRun({ text: ev, size: 17 })], bullet: { level: 0 }, spacing: { before: 20, after: 20 }, indent: { left: 600 } })))
            children.push(new Paragraph({ text: '', spacing: { after: 100 } }))
          })
        })
      })
      const doc = new Document({ sections: [{ properties: {}, children }] })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `IPRA_Standards_${year}.docx`; a.click()
      onClose()
    } catch (e) { console.error(e); setExporting(false) }
  }

  const canExport = !noneSelected && format !== null
  return (
    <Modal onClose={onClose} wide>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: '#1a1a1a' }}>Export standards</div>
      <div style={{ fontSize: 13, color: '#999992', marginBottom: 20 }}>Comments and status flags are not included in exports.</div>
      <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#f8f8f7', borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
          <button onClick={() => toggleAll(true)} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', background: allSelected ? '#e1f5ee' : 'transparent', color: allSelected ? '#085041' : '#555550', border: `0.5px solid ${allSelected ? '#9FE1CB' : 'rgba(0,0,0,0.15)'}` }}>Select all</button>
          <button onClick={() => toggleAll(false)} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', background: 'transparent', color: '#555550', border: '0.5px solid rgba(0,0,0,0.15)' }}>Clear all</button>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#999992' }}>{selectedCats.length} of {cats.length} selected</span>
        </div>
        {cats.map((cat, i) => (
          <label key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer', borderBottom: i < cats.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none', background: selected[cat.key] ? '#fafafa' : '#fff' }}>
            <input type="checkbox" checked={!!selected[cat.key]} onChange={e => setSelected(s => ({ ...s, [cat.key]: e.target.checked }))} style={{ width: 15, height: 15, accentColor: '#1D9E75', cursor: 'pointer', flexShrink: 0 }} />
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.dot_color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: selected[cat.key] ? 500 : 400 }}>{cat.label}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#999992' }}>{cat.sections.reduce((n, s) => n + s.standards.length, 0)} standards</span>
          </label>
        ))}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 10 }}>Format</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[{ key: 'word', icon: '📄', title: 'Word document', desc: 'Downloads a .docx file.' }, { key: 'pdf', icon: '🖨️', title: 'PDF', desc: 'Print-ready page — use Print → Save as PDF.' }].map(({ key, icon, title, desc }) => (
          <div key={key} onClick={() => setFormat(key)} style={{ border: `${format === key ? '2px solid #1D9E75' : '0.5px solid rgba(0,0,0,0.12)'}`, borderRadius: 10, padding: '13px 12px', cursor: 'pointer', background: format === key ? '#f0faf6' : '#fff' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#555550' }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '7px 16px', fontFamily: 'inherit' }}>Cancel</button>
        <button disabled={!canExport || exporting} onClick={() => format === 'word' ? exportWord() : exportPDF()}
          style={{ padding: '7px 20px', background: canExport && !exporting ? '#1D9E75' : '#9FE1CB', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: canExport && !exporting ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          {exporting ? 'Generating…' : `Export${selectedCats.length > 0 && format ? ` ${selectedCats.length} categor${selectedCats.length === 1 ? 'y' : 'ies'}` : ''}`}
        </button>
      </div>
    </Modal>
  )
}

// ─── Users Modal ──────────────────────────────────────────────────────
function UsersModal({ onClose, currentUserId, showToast }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const roleInfo = {
    admin:  { label: 'Admin',  bg: '#EEEDFE', color: '#3C3489', border: '#AFA9EC' },
    editor: { label: 'Editor', bg: '#e6f1fb', color: '#0c447c', border: '#B5D4F4' },
    viewer: { label: 'Viewer', bg: '#f8f8f7', color: '#555550', border: 'rgba(0,0,0,0.15)' },
  }
  useEffect(() => { supabase.from('profiles').select('*').order('full_name').then(({ data }) => { setUsers(data || []); setLoading(false) }) }, [])
  const setRole = async (userId, newRole) => {
    setUpdating(userId)
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) showToast('Failed to update role', 'error')
    else { setUsers(u => u.map(x => x.id === userId ? { ...x, role: newRole } : x)); showToast(`Role updated to ${newRole}`) }
    setUpdating(null)
  }
  return (
    <Modal onClose={onClose} wide>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: '#1a1a1a' }}>User management</div>
      <div style={{ fontSize: 13, color: '#999992', marginBottom: 20 }}>Click a role to change it. New users start as Viewer.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {Object.entries(roleInfo).map(([k, r]) => (
          <div key={k} style={{ border: `0.5px solid ${r.border}`, borderRadius: 8, padding: '10px 12px', background: r.bg }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: r.color, marginBottom: 2 }}>{r.label}</div>
            <div style={{ fontSize: 11, color: r.color, opacity: 0.8, lineHeight: 1.4 }}>{k === 'admin' ? 'Full access + user management' : k === 'editor' ? 'Can edit and add standards' : 'Browse and export only'}</div>
          </div>
        ))}
      </div>
      {loading ? <div style={{ padding: '20px 0', textAlign: 'center', color: '#999992' }}>Loading…</div> : (
        <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden' }}>
          {users.map((user, i) => {
            const r = roleInfo[user.role] || roleInfo.viewer
            const isMe = user.id === currentUserId
            return (
              <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < users.length - 1 ? '0.5px solid rgba(0,0,0,0.07)' : 'none', background: '#fff' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#e6f1fb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#0c447c', flexShrink: 0 }}>{(user.full_name || '?').charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{user.full_name || 'Unknown'}{isMe && <span style={{ fontSize: 11, color: '#999992', fontWeight: 400, marginLeft: 6 }}>(you)</span>}</div>
                  <div style={{ fontSize: 11, color: '#999992', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email?.replace('@ipra-standards.internal', '')}</div>
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {Object.entries(roleInfo).map(([key, ri]) => (
                    <button key={key} disabled={updating === user.id} onClick={() => user.role !== key && setRole(user.id, key)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: user.role === key ? 'default' : 'pointer', fontFamily: 'inherit', background: user.role === key ? ri.bg : 'transparent', color: user.role === key ? ri.color : '#999992', border: `0.5px solid ${user.role === key ? ri.border : 'rgba(0,0,0,0.1)'}`, fontWeight: user.role === key ? 500 : 400, opacity: updating === user.id ? 0.5 : 1 }}>
                      {ri.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={{ padding: '7px 16px', fontFamily: 'inherit' }}>Close</button>
      </div>
    </Modal>
  )
}

// ─── Standard Card ─────────────────────────────────────────────────────
function StdCard({ std, onEdit, onDelete, onDetail, showMeta, canEdit }) {
  return (
    <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: '11px 14px', background: '#f8f8f7', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#999992', marginBottom: 2 }}>
            {std.std_key}{showMeta && <span style={{ fontFamily: 'Inter, sans-serif', marginLeft: 8 }}>· {std.category_label} › {std.section_title}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{std.title}</span>
            <Badge type={std.type} />
            {std.status !== 'active' && <StatusBadge status={std.status} />}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0, marginTop: 1 }}>
          <button onClick={() => onDetail(std)} style={{ fontSize: 11, padding: '3px 9px', color: '#555550', border: '0.5px solid rgba(0,0,0,0.15)', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>History</button>
          {canEdit && <>
            <button onClick={() => onEdit(std)} style={{ fontSize: 11, padding: '3px 9px', color: '#0c447c', border: '0.5px solid #B5D4F4', background: '#e6f1fb', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
            <button onClick={() => onDelete(std)} style={{ fontSize: 11, padding: '3px 9px', color: '#791f1f', border: '0.5px solid #f7c1c1', background: '#fcebeb', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
          </>}
        </div>
      </div>
      {std.commentary && (
        <div style={{ padding: '8px 14px', fontSize: 13, color: '#555550', lineHeight: 1.65, borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontStyle: 'italic' }}>
          <span style={{ fontStyle: 'normal', fontWeight: 500 }}>Commentary: </span>{std.commentary}
        </div>
      )}
      <div style={{ padding: '8px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#999992', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Evidence of compliance</div>
        {std.evidence?.map((ev, i) => (
          <div key={i} style={{ fontSize: 13, color: '#1a1a1a', padding: '2px 0 2px 13px', position: 'relative', lineHeight: 1.5 }}>
            <span style={{ position: 'absolute', left: 3, top: 8, width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.18)', display: 'inline-block' }} />{ev}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cats, setCats] = useState([])
  const [allYears, setAllYears] = useState([])
  const [activeYear, setActiveYear] = useState(null)
  const [selectedYear, setSelectedYear] = useState(null)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'standards'
  const [catKey, setCatKey] = useState(null)
  const [secKey, setSecKey] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => setToast({ msg, type })
  const closeModal = () => setModal(null)
  const isAdmin = profile?.role === 'admin'
  const canEdit = (profile?.role === 'admin' || profile?.role === 'editor')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setLoading(false); return }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { setProfile(data); loadAll() })
  }, [session])

  const buildCats = (yearNum, catsData, secs, stds) => {
    const displayStds = stds?.filter(s => s.year === yearNum) || []
    return catsData?.map(cat => ({
      ...cat,
      sections: secs?.filter(s => s.category_id === cat.id).map(sec => ({
        ...sec,
        standards: displayStds.filter(s => s.section_key === sec.key).sort((a, b) => a.sort_order - b.sort_order)
      })) || []
    })) || []
  }

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [{ data: years }, { data: catsData }, { data: secs }, { data: stds }] = await Promise.all([
      supabase.from('years').select('*').order('year', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('sections').select('*').order('sort_order'),
      supabase.from('standards_full').select('*').order('sort_order')
    ])
    const activeYearRow = years?.find(y => y.is_active) || years?.[0]
    setAllYears(years || [])
    setActiveYear(activeYearRow)
    setSelectedYear(activeYearRow)
    setCats(buildCats(activeYearRow?.year, catsData, secs, stds))
    setLoading(false)
  }, [])

  // Reload standards only — preserves catKey/secKey
  const reloadStandards = useCallback(async (yearNum) => {
    const yr = yearNum || selectedYear?.year
    const [{ data: catsData }, { data: secs }, { data: stds }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('sections').select('*').order('sort_order'),
      supabase.from('standards_full').select('*').order('sort_order')
    ])
    setCats(buildCats(yr, catsData, secs, stds))
  }, [selectedYear])

  const switchYear = useCallback(async (year) => {
    setCatKey(null); setSecKey(null); setSearch(''); setLoading(true)
    const [{ data: catsData }, { data: secs }, { data: stds }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('sections').select('*').order('sort_order'),
      supabase.from('standards_full').select('*').order('sort_order')
    ])
    setCats(buildCats(year.year, catsData, secs, stds))
    setSelectedYear(year)
    setView('dashboard')
    setLoading(false)
  }, [])

  // ── Save edit/add ────────────────────────────────────────────────────
  const handleSaveEdit = async (form) => {
    setSaving(true)
    const savedCatKey = modal.catKey
    const savedSecKey = modal.secKey
    const cat = cats.find(c => c.key === modal.catKey)
    const sec = cat?.sections.find(s => s.key === modal.secKey)
    if (!sec) return
    const pos = form.position - 1
    let stds = [...sec.standards]
    if (modal.mode === 'edit') {
      const oldIdx = stds.findIndex(s => s.id === modal.std.id)
      stds.splice(oldIdx, 1)
      stds.splice(pos, 0, { ...modal.std, title: form.title, type: form.type, status: form.status, commentary: form.commentary, evidence: form.evidence, save_note: form.save_note })
    } else {
      stds.splice(pos, 0, { title: form.title, type: form.type, status: form.status, commentary: form.commentary, evidence: form.evidence, save_note: form.save_note, section_id: sec.id, year_id: selectedYear.id })
    }
    stds = renumber(stds, sec.key)
    const upserts = stds.map(s => ({ ...(s.id ? { id: s.id } : {}), section_id: sec.id, year_id: selectedYear.id, std_key: s.std_key, title: s.title, type: s.type, status: s.status || 'active', commentary: s.commentary || '', evidence: s.evidence || [], sort_order: s.sort_order, save_note: s.save_note || '' }))
    const { error } = await supabase.from('standards').upsert(upserts, { onConflict: 'id' })
    if (error) { showToast('Save failed: ' + error.message, 'error'); setSaving(false); return }
    await reloadStandards()
    setCatKey(savedCatKey)
    setSecKey(savedSecKey)
    closeModal()
    showToast(modal.mode === 'edit' ? 'Saved — history recorded' : 'Standard added')
    setSaving(false)
  }

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setSaving(true)
    const savedCatKey = modal.catKey
    const savedSecKey = modal.secKey
    const { std } = modal
    const cat = cats.find(c => c.key === modal.catKey)
    const sec = cat?.sections.find(s => s.key === modal.secKey)
    await supabase.from('standards').delete().eq('id', std.id)
    const remaining = renumber(sec.standards.filter(s => s.id !== std.id), modal.secKey)
    if (remaining.length > 0) {
      await supabase.from('standards').upsert(remaining.map(s => ({ id: s.id, std_key: s.std_key, sort_order: s.sort_order, section_id: sec.id, year_id: selectedYear.id, title: s.title, type: s.type, status: s.status || 'active', commentary: s.commentary || '', evidence: s.evidence || [], save_note: '' })))
    }
    await reloadStandards()
    setCatKey(savedCatKey)
    setSecKey(savedSecKey)
    closeModal()
    showToast('Deleted — history recorded')
    setSaving(false)
  }

  // ── Archive ───────────────────────────────────────────────────────────
  const handleArchive = async () => {
    setSaving(true)
    await supabase.from('years').update({ is_active: false, is_archived: true, archived_at: new Date().toISOString() }).eq('id', activeYear.id)
    const newYearNum = activeYear.year + 1
    const { data: newYearRow } = await supabase.from('years').insert({ year: newYearNum, is_active: true }).select().single()
    const allStds = cats.flatMap(c => c.sections.flatMap(s => s.standards))
    if (allStds.length > 0) {
      await supabase.from('standards').insert(allStds.map(s => ({ section_id: s.section_id, year_id: newYearRow.id, std_key: s.std_key, title: s.title, type: s.type, status: 'active', commentary: s.commentary || '', evidence: s.evidence || [], sort_order: s.sort_order, save_note: '' })))
    }
    await loadAll()
    closeModal()
    showToast(`${activeYear.year} archived. Now editing ${newYearNum}`)
    setSaving(false)
  }

  // ── Computed ──────────────────────────────────────────────────────────
  const allStds = cats.flatMap(c => c.sections.flatMap(s => s.standards))
  const totalStds = allStds.length
  const mandatoryStds = allStds.filter(s => s.type === 'M').length
  const isArchived = selectedYear && activeYear && selectedYear.year !== activeYear.year
  const showEdit = canEdit && !isArchived

  const currentCat = cats.find(c => c.key === catKey)
  const currentSec = currentCat?.sections.find(s => s.key === secKey)

  const applyFilters = (stds) => stds
    .filter(s => filterStatus === 'all' || s.status === filterStatus)
    .filter(s => filterType === 'all' || s.type === filterType)

  const searchResults = search.trim().length > 1
    ? applyFilters(allStds.filter(s =>
        s.std_key?.toLowerCase().includes(search.toLowerCase()) ||
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.commentary?.toLowerCase().includes(search.toLowerCase()) ||
        s.evidence?.some(e => e.toLowerCase().includes(search.toLowerCase()))
      )) : []

  const sectionStds = currentSec ? applyFilters(currentSec.standards) : []

  if (!session) return <AuthPage />
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999992', fontSize: 14, background: '#f2f1ef' }}>Loading standards…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f2f1ef' }}>

      {isArchived && (
        <div style={{ background: '#faeeda', borderBottom: '0.5px solid #FAC775', padding: '7px 20px', fontSize: 12, color: '#633806', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span>Viewing archived <strong>{selectedYear.year}</strong> standards — editing disabled.</span>
          <button onClick={() => switchYear(activeYear)} style={{ fontSize: 11, padding: '2px 10px', background: '#fff', border: '0.5px solid #FAC775', borderRadius: 6, color: '#633806', cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>Return to {activeYear.year}</button>
        </div>
      )}

      {/* Top bar */}
      <div style={{ height: 54, background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 28, height: 28, background: '#1D9E75', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => setView('dashboard')}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="white"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8.75-3.25a.75.75 0 00-1.5 0V8c0 .199.079.39.22.53l2.25 2.25a.75.75 0 101.06-1.06L8.75 7.69V4.75z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.2 }}>IPRA Accreditation Standards</div>
            <div style={{ fontSize: 11, color: '#999992' }}>Joint Distinguished Agency Committee</div>
          </div>
          {/* Nav tabs */}
          <div style={{ display: 'flex', gap: 2, marginLeft: 16 }}>
            {[['dashboard', 'Dashboard'], ['standards', 'Standards']].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{ fontSize: 12, padding: '4px 12px', background: view === v ? '#f8f8f7' : 'transparent', color: view === v ? '#1a1a1a' : '#555550', border: '0.5px solid transparent', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', fontWeight: view === v ? 500 : 400 }}>{label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 11, color: '#999992', padding: '3px 9px', background: '#f8f8f7', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 20 }}>{totalStds} standards · {mandatoryStds} mandatory</span>
          {allYears.length > 1 ? (
            <select value={selectedYear?.year || ''} onChange={e => { const y = allYears.find(yr => yr.year === parseInt(e.target.value)); if (y) switchYear(y) }}
              style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', background: '#e6f1fb', color: '#0c447c', border: '0.5px solid #B5D4F4', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
              {allYears.map(y => <option key={y.year} value={y.year}>{y.year}{y.is_active ? ' (current)' : ' (archived)'}</option>)}
            </select>
          ) : <span style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', background: '#e6f1fb', color: '#0c447c', border: '0.5px solid #B5D4F4', borderRadius: 20 }}>{selectedYear?.year}</span>}
          {profile?.full_name && <span style={{ fontSize: 12, color: '#555550', padding: '4px 9px', background: '#f8f8f7', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 20 }}>{profile.full_name} <span style={{ fontSize: 10, color: '#999992' }}>({profile.role})</span></span>}
          {isAdmin && <button onClick={() => setModal({ type: 'users' })} style={{ fontSize: 12, padding: '4px 11px', background: '#EEEDFE', color: '#3C3489', border: '0.5px solid #AFA9EC', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Users</button>}
          {isAdmin && !isArchived && <button onClick={() => setModal({ type: 'archive' })} style={{ fontSize: 12, padding: '4px 11px', fontFamily: 'inherit' }}>Archive year</button>}
          {isAdmin && <button onClick={() => exportChangeLog(selectedYear?.year)} style={{ fontSize: 12, padding: '4px 11px', fontFamily: 'inherit' }}>Change log</button>}
          <button onClick={() => setModal({ type: 'export' })} style={{ background: '#e1f5ee', color: '#085041', border: '0.5px solid #9FE1CB', fontWeight: 500, fontSize: 12, padding: '4px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Export</button>
          <button onClick={() => supabase.auth.signOut()} style={{ fontSize: 12, color: '#999992', padding: '4px 10px', background: 'none', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
        </div>
      </div>

      {/* Body */}
      {view === 'dashboard' ? (
        <div style={{ flex: 1, overflow: 'hidden', background: '#fff' }}>
          <Dashboard cats={cats} year={selectedYear?.year} allYears={allYears} profile={profile}
            onNavigate={(ck, sk) => { setCatKey(ck); setSecKey(sk || null); setView('standards') }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Category sidebar */}
          <div style={{ width: 210, flexShrink: 0, background: '#fff', borderRight: '0.5px solid rgba(0,0,0,0.1)', overflowY: 'auto' }}>
            <div style={{ fontSize: 10, color: '#999992', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 12px 5px' }}>Categories</div>
            {cats.map(cat => {
              const needsReview = cat.sections.flatMap(s => s.standards).filter(s => s.status === 'needs_review').length
              return (
                <div key={cat.key} onClick={() => { setCatKey(cat.key); setSecKey(null) }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: catKey === cat.key ? '#1a1a1a' : '#555550', fontWeight: catKey === cat.key ? 500 : 400, background: catKey === cat.key ? '#f8f8f7' : 'transparent', borderLeft: `3px solid ${catKey === cat.key ? cat.dot_color : 'transparent'}` }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: cat.dot_color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12 }}>{cat.label}</span>
                  {needsReview > 0 && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: '#faeeda', color: '#633806', fontWeight: 500 }}>{needsReview}</span>}
                </div>
              )
            })}
          </div>

          {/* Section list */}
          <div style={{ width: 220, flexShrink: 0, background: '#f8f8f7', borderRight: '0.5px solid rgba(0,0,0,0.1)', overflowY: 'auto' }}>
            {!catKey ? <div style={{ padding: 16, fontSize: 13, color: '#999992' }}>Select a category</div>
              : currentCat?.sections.map(sec => {
                const nr = sec.standards.filter(s => s.status === 'needs_review').length
                return (
                  <div key={sec.key} onClick={() => setSecKey(sec.key)}
                    style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '0.5px solid rgba(0,0,0,0.07)', background: secKey === sec.key ? '#fff' : 'transparent' }}>
                    <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#999992' }}>{sec.key}</div>
                    <div style={{ fontSize: 12, fontWeight: secKey === sec.key ? 500 : 400, marginTop: 1, color: '#1a1a1a' }}>{sec.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: '#999992' }}>{sec.standards.length} standards</span>
                      {nr > 0 && <span style={{ fontSize: 10, padding: '0 5px', borderRadius: 3, background: '#faeeda', color: '#633806', fontWeight: 500 }}>{nr} to review</span>}
                    </div>
                  </div>
                )
              })
            }
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Search + filter bar */}
            <div style={{ padding: '8px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.1)', background: '#fff', flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, title, commentary, or evidence…"
                style={{ flex: 1, fontSize: 13, padding: '6px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit' }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ fontSize: 12, padding: '6px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#fff', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                <option value="all">All statuses</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ fontSize: 12, padding: '6px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, background: '#fff', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                <option value="all">All types</option>
                <option value="M">Mandatory</option>
                <option value="O">Optional</option>
              </select>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
              {search.trim().length > 1 ? (
                <div style={{ padding: '0 20px 20px' }}>
                  <div style={{ padding: '14px 0 12px', fontSize: 17, fontWeight: 600, color: '#1a1a1a' }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{search}"</div>
                  {searchResults.length === 0 && <div style={{ color: '#999992', fontSize: 14 }}>No standards matched.</div>}
                  {searchResults.map(std => <StdCard key={std.id} std={std} showMeta canEdit={showEdit}
                    onEdit={s => setModal({ type: 'edit', mode: 'edit', catKey: s.category_key, secKey: s.section_key, std: s })}
                    onDelete={s => setModal({ type: 'deleteConfirm', catKey: s.category_key, secKey: s.section_key, std: s })}
                    onDetail={s => setModal({ type: 'detail', std: s })} />)}
                </div>
              ) : !secKey ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999992', fontSize: 14 }}>Select a section to view its standards.</div>
              ) : (
                <div style={{ padding: '0 20px 20px' }}>
                  <div style={{ padding: '14px 0 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#999992' }}>{secKey}</div>
                      <div style={{ fontSize: 19, fontWeight: 600, color: '#1a1a1a', marginTop: 3 }}>{currentSec?.title}</div>
                    </div>
                    {showEdit && (
                      <button onClick={() => setModal({ type: 'edit', mode: 'add', catKey, secKey, std: { title: '', type: 'O', status: 'active', commentary: '', evidence: [], sort_order: currentSec.standards.length } })}
                        style={{ background: '#e6f1fb', color: '#0c447c', border: '0.5px solid #B5D4F4', fontWeight: 500, fontSize: 12, padding: '5px 13px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                        + Add standard
                      </button>
                    )}
                  </div>
                  {sectionStds.length === 0 && <div style={{ textAlign: 'center', padding: '40px 0', color: '#999992', fontSize: 14 }}>{currentSec?.standards.length === 0 ? 'No standards in this section yet.' : 'No standards match the current filters.'}</div>}
                  {sectionStds.map(std => (
                    <StdCard key={std.id} std={std} canEdit={showEdit}
                      onEdit={s => setModal({ type: 'edit', mode: 'edit', catKey, secKey, std: s })}
                      onDelete={s => setModal({ type: 'deleteConfirm', catKey, secKey, std: s })}
                      onDetail={s => setModal({ type: 'detail', std: s })} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'edit' && <EditModal std={modal.std} mode={modal.mode} sectionKey={modal.secKey} totalInSection={cats.find(c => c.key === modal.catKey)?.sections.find(s => s.key === modal.secKey)?.standards.length || 0} onSave={handleSaveEdit} onClose={closeModal} />}
      {modal?.type === 'deleteConfirm' && (
        <Modal onClose={closeModal}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#1a1a1a' }}>Delete standard?</div>
          <div style={{ fontSize: 13, color: '#555550', lineHeight: 1.7, marginBottom: 22 }}>Permanently remove <strong>{modal.std.std_key} — {modal.std.title}</strong>? A deletion record will be saved to version history. Remaining standards will renumber automatically.</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={closeModal} style={{ padding: '7px 16px', fontFamily: 'inherit' }}>Cancel</button>
            <button disabled={saving} onClick={handleDelete} style={{ padding: '7px 16px', background: '#fcebeb', color: '#791f1f', border: '0.5px solid #f7c1c1', borderRadius: 8, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>{saving ? 'Deleting…' : 'Delete'}</button>
          </div>
        </Modal>
      )}
      {modal?.type === 'detail' && <DetailModal std={modal.std} onClose={closeModal} profile={profile} />}
      {modal?.type === 'archive' && <ArchiveSummaryModal cats={cats} year={selectedYear?.year} activeYear={activeYear} onConfirm={handleArchive} onClose={closeModal} saving={saving} />}
      {modal?.type === 'users' && <UsersModal onClose={closeModal} currentUserId={session?.user?.id} showToast={showToast} />}
      {modal?.type === 'export' && <ExportModal onClose={closeModal} cats={cats} year={selectedYear?.year} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
