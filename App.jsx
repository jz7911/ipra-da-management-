import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import AuthPage from './AuthPage'

// ─── helpers ───────────────────────────────────────────────────────
function renumber(standards, sectionKey) {
  return standards.map((s, i) => ({ ...s, std_key: `${sectionKey}.${i + 1}`, sort_order: i }))
}

function Badge({ type }) {
  return (
    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 500, flexShrink: 0, background: type === 'M' ? 'var(--red-l)' : 'var(--green-l)', color: type === 'M' ? 'var(--red-t)' : 'var(--green-t)', border: `0.5px solid ${type === 'M' ? 'var(--red-b)' : '#9FE1CB'}` }}>
      {type === 'M' ? 'Mandatory' : 'Optional'}
    </span>
  )
}

function RoleBadge({ role }) {
  const styles = {
    admin: { background: '#EEEDFE', color: '#3C3489', border: '0.5px solid #AFA9EC' },
    editor: { background: 'var(--blue-l)', color: 'var(--blue-t)', border: '0.5px solid #B5D4F4' },
    viewer: { background: 'var(--bg2)', color: 'var(--text3)', border: '0.5px solid var(--border)' },
  }
  return <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 500, ...styles[role] }}>{role}</span>
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 9999, background: type === 'error' ? 'var(--red-l)' : 'var(--green-l)', color: type === 'error' ? 'var(--red-t)' : 'var(--green-t)', border: `0.5px solid ${type === 'error' ? 'var(--red-b)' : '#9FE1CB'}`, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
      {msg}
    </div>
  )
}

function Modal({ children, onClose, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 50, zIndex: 1000, overflowY: 'auto' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--bg)', border: '0.5px solid var(--border2)', borderRadius: 12, padding: 26, width: wide ? 660 : 520, maxWidth: '96vw', marginBottom: 40 }}>
        {children}
      </div>
    </div>
  )
}

function FL({ children }) {
  return <label style={{ display: 'block', fontSize: 11, color: 'var(--text3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{children}</label>
}

// ─── Edit Standard Modal ────────────────────────────────────────────
function EditModal({ std, mode, sectionKey, totalInSection, onSave, onClose }) {
  const maxPos = mode === 'add' ? totalInSection + 1 : totalInSection
  const currentPos = mode === 'edit' ? (std.sort_order + 1) : maxPos
  const [form, setForm] = useState({
    title: std?.title || '',
    type: std?.type || 'O',
    commentary: std?.commentary || '',
    evidence: Array.isArray(std?.evidence) ? std.evidence.join('\n') : '',
    position: currentPos
  })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    await onSave({ ...form, evidence: form.evidence.split('\n').map(e => e.trim()).filter(Boolean) })
    setSaving(false)
  }

  return (
    <Modal onClose={onClose} wide>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text)' }}>
        {mode === 'add' ? 'Add standard' : 'Edit standard'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <FL>Title</FL>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Standard title..." autoFocus />
        </div>
        <div>
          <FL>Position in section</FL>
          <select value={form.position} onChange={e => set('position', parseInt(e.target.value))}>
            {Array.from({ length: maxPos }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>
                {mode === 'add'
                  ? n === maxPos ? `${n} — end of section` : `${n} — insert before ${sectionKey}.${n}`
                  : n === currentPos ? `${n} — current position` : `${n}`}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Standards below renumber automatically</div>
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <FL>Type</FL>
        <div style={{ display: 'flex', gap: 8 }}>
          {['M', 'O'].map(t => (
            <button key={t} onClick={() => set('type', t)} style={{ padding: '6px 18px', fontSize: 13, fontWeight: form.type === t ? 500 : 400, background: form.type === t ? (t === 'M' ? 'var(--red-l)' : 'var(--green-l)') : 'var(--bg2)', color: form.type === t ? (t === 'M' ? 'var(--red-t)' : 'var(--green-t)') : 'var(--text2)', border: `0.5px solid ${form.type === t ? (t === 'M' ? 'var(--red-b)' : '#9FE1CB') : 'var(--border)'}` }}>
              {t === 'M' ? 'Mandatory' : 'Optional'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <FL>Commentary</FL>
        <textarea rows={4} value={form.commentary} onChange={e => set('commentary', e.target.value)} placeholder="Describe the intent of this standard..." />
      </div>
      <div style={{ marginBottom: 22 }}>
        <FL>Evidence of compliance — one item per line</FL>
        <textarea rows={6} value={form.evidence} onChange={e => set('evidence', e.target.value)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="a. Evidence item one&#10;b. Evidence item two" />
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose}>Cancel</button>
        <button disabled={saving || !form.title.trim()} onClick={handleSave} style={{ background: 'var(--blue-l)', color: 'var(--blue-t)', border: '0.5px solid #B5D4F4', fontWeight: 500 }}>
          {saving ? 'Saving…' : mode === 'add' ? 'Add standard' : 'Save changes'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Export Modal ───────────────────────────────────────────────────
function ExportModal({ onClose, cats, year }) {
  const exportPDF = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>IPRA Standards ${year}</title><style>body{font-family:Georgia,serif;max-width:820px;margin:30px auto;padding:0 24px;color:#1a1a1a;line-height:1.75;font-size:13px}h1{font-size:22px;font-weight:600;border-bottom:2px solid #1D9E75;padding-bottom:10px;margin-bottom:24px}h2{font-size:17px;font-weight:600;margin-top:42px;padding:7px 14px;background:#f5f5f3;border-left:4px solid #888}h3{font-size:14px;font-weight:600;margin-top:22px;color:#444}.std{border:1px solid #ddd;border-radius:5px;padding:14px;margin:12px 0;page-break-inside:avoid}.badge{font-size:10px;padding:2px 6px;border-radius:3px;font-weight:700}.M{background:#fee2e2;color:#991b1b}.O{background:#dcfce7;color:#166534}.ev{margin:8px 0 0;padding-left:16px}.ev li{font-size:12px;margin:3px 0}@media print{h2{page-break-before:always}h2:first-of-type{page-break-before:avoid}.std{page-break-inside:avoid}button{display:none}}.btn{position:fixed;top:16px;right:16px;padding:8px 20px;background:#1D9E75;color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer}</style></head><body><button class="btn" onclick="window.print()">Print / Save as PDF</button><h1>IPRA — Joint Distinguished Agency<br>Accreditation Standards ${year}</h1>\n`
    cats.forEach(cat => {
      html += `<h2>${cat.label}</h2>\n`
      cat.sections.forEach(sec => {
        html += `<h3>${sec.key} — ${sec.title}</h3>\n`
        sec.standards.forEach(s => {
          html += `<div class="std"><strong>${s.std_key} ${s.title}</strong> <span class="badge ${s.type}">${s.type === 'M' ? 'MANDATORY' : 'OPTIONAL'}</span>${s.commentary ? `<p style="font-size:12px;color:#555;font-style:italic;margin:6px 0"><strong style="font-style:normal">Commentary:</strong> ${s.commentary}</p>` : ''}<ul class="ev">${s.evidence.map(e => `<li>${e}</li>`).join('')}</ul></div>\n`
        })
      })
    })
    html += `</body></html>`
    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 800)
    onClose()
  }

  const exportWord = async () => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } = await import('docx')
    const children = []
    children.push(new Paragraph({ children: [new TextRun({ text: `IPRA — Joint Distinguished Agency`, bold: true, size: 32, color: '1D9E75' })], spacing: { after: 120 } }))
    children.push(new Paragraph({ children: [new TextRun({ text: `Accreditation Standards — ${year}`, bold: true, size: 26 })], spacing: { after: 400 } }))
    cats.forEach(cat => {
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
  }

  return (
    <Modal onClose={onClose}>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Export standards</div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 22 }}>Choose your export format for {year} standards.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        {[
          { icon: '📄', title: 'Word document', desc: 'Downloads a .docx file. Opens in Word, Google Docs, or LibreOffice.', action: exportWord },
          { icon: '🖨️', title: 'PDF', desc: 'Opens a print-ready page. Use Print → Save as PDF in your browser.', action: exportPDF }
        ].map(({ icon, title, desc, action }) => (
          <div key={title} onClick={action} style={{ border: '0.5px solid var(--border)', borderRadius: 10, padding: '16px 14px', cursor: 'pointer', transition: 'background 0.1s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={onClose}>Close</button></div>
    </Modal>
  )
}

// ─── Standard Card ──────────────────────────────────────────────────
function StdCard({ std, onEdit, onDelete, canEdit, showMeta }) {
  return (
    <div style={{ border: '0.5px solid var(--border)', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: 'var(--bg2)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text3)', marginBottom: 3 }}>
            {std.std_key}
            {showMeta && <span style={{ fontFamily: 'Inter, sans-serif', marginLeft: 8 }}>· {std.category_label} › {std.section_title}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{std.title}</span>
            <Badge type={std.type} />
          </div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 2 }}>
            <button onClick={onEdit} style={{ fontSize: 12, padding: '4px 12px' }}>Edit</button>
            <button onClick={onDelete} style={{ fontSize: 12, padding: '4px 12px', color: 'var(--red-t)', border: '0.5px solid var(--red-b)', background: 'var(--red-l)' }}>Delete</button>
          </div>
        )}
      </div>
      {std.commentary && (
        <div style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, borderBottom: '0.5px solid var(--border)', fontStyle: 'italic' }}>
          <span style={{ fontStyle: 'normal', fontWeight: 500 }}>Commentary: </span>{std.commentary}
        </div>
      )}
      <div style={{ padding: '10px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Evidence of compliance</div>
        {std.evidence?.map((ev, i) => (
          <div key={i} style={{ fontSize: 13, padding: '3px 0 3px 14px', position: 'relative', lineHeight: 1.5 }}>
            <span style={{ position: 'absolute', left: 4, top: 9, width: 4, height: 4, borderRadius: '50%', background: 'var(--border2)', display: 'inline-block' }} />
            {ev}
          </div>
        ))}
        {std.updated_by_name && (
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10, paddingTop: 8, borderTop: '0.5px solid var(--border)' }}>
            Last updated by {std.updated_by_name} · {new Date(std.updated_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main App ───────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [cats, setCats] = useState([])          // [{key, label, color, dot_color, sections:[{key,title,standards:[...]}]}]
  const [activeYear, setActiveYear] = useState(null)
  const [catKey, setCatKey] = useState(null)
  const [secKey, setSecKey] = useState(null)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  const showToast = (msg, type = 'success') => setToast({ msg, type })
  const closeModal = () => setModal(null)
  const canEdit = profile?.role === 'admin' || profile?.role === 'editor'

  // ── Auth ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) { setLoading(false); return }
    supabase.from('profiles').select('*').eq('id', session.user.id).single()
      .then(({ data }) => { setProfile(data); loadData() })
  }, [session])

  // ── Load all data ─────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true)
    const [{ data: years }, { data: catsData }, { data: secs }, { data: stds }] = await Promise.all([
      supabase.from('years').select('*').order('year'),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('sections').select('*').order('sort_order'),
      supabase.from('standards_full').select('*').order('sort_order')
    ])

    const activeYearRow = years?.find(y => y.is_active) || years?.[0]
    setActiveYear(activeYearRow)

    const activeStds = stds?.filter(s => s.year === activeYearRow?.year) || []

    const built = catsData?.map(cat => ({
      ...cat,
      sections: secs?.filter(s => s.category_id === cat.id).map(sec => ({
        ...sec,
        standards: activeStds.filter(s => s.section_key === sec.key).sort((a, b) => a.sort_order - b.sort_order)
      })) || []
    })) || []

    setCats(built)
    setLoading(false)
  }

  // ── Save standard ─────────────────────────────────────────────────
  const handleSaveEdit = async (form) => {
    setSaving(true)
    const cat = cats.find(c => c.key === modal.catKey)
    const sec = cat?.sections.find(s => s.key === modal.secKey)
    if (!sec) return

    const pos = form.position - 1
    let stds = [...sec.standards]

    if (modal.mode === 'edit') {
      const oldIdx = stds.findIndex(s => s.id === modal.std.id)
      const updated = { ...stds[oldIdx], title: form.title, type: form.type, commentary: form.commentary, evidence: form.evidence }
      stds.splice(oldIdx, 1)
      stds.splice(pos, 0, updated)
    } else {
      stds.splice(pos, 0, { title: form.title, type: form.type, commentary: form.commentary, evidence: form.evidence, section_id: sec.id, year_id: activeYear.id })
    }

    stds = renumber(stds, sec.key)

    // Upsert all affected standards
    const upserts = stds.map(s => ({
      ...(s.id ? { id: s.id } : {}),
      section_id: sec.id,
      year_id: activeYear.id,
      std_key: s.std_key,
      title: s.title,
      type: s.type,
      commentary: s.commentary || '',
      evidence: s.evidence || [],
      sort_order: s.sort_order
    }))

    const { error } = await supabase.from('standards').upsert(upserts, { onConflict: 'id' })
    if (error) { showToast('Save failed: ' + error.message, 'error'); setSaving(false); return }

    await loadData()
    closeModal()
    showToast(modal.mode === 'edit' ? 'Saved and renumbered' : 'Added and section renumbered')
    setSaving(false)
  }

  // ── Delete standard ───────────────────────────────────────────────
  const handleDelete = async (stdId, secKey) => {
    setSaving(true)
    const cat = cats.find(c => c.key === modal.catKey)
    const sec = cat?.sections.find(s => s.key === secKey)
    if (!sec) return

    await supabase.from('standards').delete().eq('id', stdId)

    // Renumber remaining
    const remaining = renumber(sec.standards.filter(s => s.id !== stdId), sec.key)
    if (remaining.length > 0) {
      await supabase.from('standards').upsert(remaining.map(s => ({ id: s.id, std_key: s.std_key, sort_order: s.sort_order, section_id: sec.id, year_id: activeYear.id, title: s.title, type: s.type, commentary: s.commentary || '', evidence: s.evidence || [] })))
    }

    await loadData()
    closeModal()
    showToast('Deleted and renumbered')
    setSaving(false)
  }

  // ── Archive year ──────────────────────────────────────────────────
  const handleArchive = async () => {
    setSaving(true)
    // Mark current year archived
    await supabase.from('years').update({ is_active: false, is_archived: true, archived_at: new Date().toISOString() }).eq('id', activeYear.id)

    // Create new year
    const newYear = activeYear.year + 1
    const { data: newYearRow } = await supabase.from('years').insert({ year: newYear, is_active: true }).select().single()

    // Copy all standards to new year
    const allStds = cats.flatMap(c => c.sections.flatMap(s => s.standards))
    if (allStds.length > 0) {
      await supabase.from('standards').insert(allStds.map(s => ({ section_id: s.section_id, year_id: newYearRow.id, std_key: s.std_key, title: s.title, type: s.type, commentary: s.commentary || '', evidence: s.evidence || [], sort_order: s.sort_order })))
    }

    await loadData()
    closeModal()
    showToast(`Year ${activeYear.year} archived. Now editing ${newYear}`)
    setSaving(false)
  }

  // ── Computed ──────────────────────────────────────────────────────
  const allStds = cats.flatMap(c => c.sections.flatMap(s => s.standards))
  const totalStds = allStds.length
  const mandatoryStds = allStds.filter(s => s.type === 'M').length

  const searchResults = search.trim().length > 1
    ? allStds.filter(s =>
      s.std_key?.toLowerCase().includes(search.toLowerCase()) ||
      s.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.commentary?.toLowerCase().includes(search.toLowerCase()) ||
      s.evidence?.some(e => e.toLowerCase().includes(search.toLowerCase()))
    ) : []

  const currentCat = cats.find(c => c.key === catKey)
  const currentSec = currentCat?.sections.find(s => s.key === secKey)

  // ── Render ────────────────────────────────────────────────────────
  if (!session) return <AuthPage />

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 14 }}>
      Loading standards…
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg3)' }}>

      {/* Top bar */}
      <div style={{ height: 56, background: 'var(--bg)', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 30, height: 30, background: 'var(--green)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8.75-3.25a.75.75 0 00-1.5 0V8c0 .199.079.39.22.53l2.25 2.25a.75.75 0 101.06-1.06L8.75 7.69V4.75z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>IPRA Accreditation Standards</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Joint Distinguished Agency Committee</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', padding: '3px 10px', background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 20 }}>{totalStds} standards · {mandatoryStds} mandatory</span>
          {activeYear && <span style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', background: 'var(--blue-l)', color: 'var(--blue-t)', border: '0.5px solid #B5D4F4', borderRadius: 20 }}>{activeYear.year}</span>}
          <RoleBadge role={profile?.role || 'viewer'} />
          {canEdit && <button onClick={() => setModal({ type: 'archive' })} style={{ fontSize: 12 }}>Archive year</button>}
          <button onClick={() => setModal({ type: 'export' })} style={{ background: 'var(--green-l)', color: 'var(--green-t)', border: '0.5px solid #9FE1CB', fontWeight: 500, fontSize: 12 }}>Export</button>
          <button onClick={() => supabase.auth.signOut()} style={{ fontSize: 12, color: 'var(--text3)' }}>Sign out</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Category sidebar */}
        <div style={{ width: 215, flexShrink: 0, background: 'var(--bg)', borderRight: '0.5px solid var(--border)', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 14px 6px' }}>Categories</div>
          {cats.map(cat => (
            <div key={cat.key} onClick={() => { setCatKey(cat.key); setSecKey(null) }}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: catKey === cat.key ? 'var(--text)' : 'var(--text2)', fontWeight: catKey === cat.key ? 500 : 400, background: catKey === cat.key ? 'var(--bg2)' : 'transparent', borderLeft: `3px solid ${catKey === cat.key ? cat.dot_color : 'transparent'}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.dot_color, flexShrink: 0 }} />
              {cat.label}
            </div>
          ))}
        </div>

        {/* Section list */}
        <div style={{ width: 235, flexShrink: 0, background: 'var(--bg2)', borderRight: '0.5px solid var(--border)', overflowY: 'auto' }}>
          {!catKey ? <div style={{ padding: 20, fontSize: 13, color: 'var(--text3)' }}>Select a category</div> :
            currentCat?.sections.map(sec => (
              <div key={sec.key} onClick={() => setSecKey(sec.key)}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '0.5px solid var(--border)', background: secKey === sec.key ? 'var(--bg)' : 'transparent' }}>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text3)' }}>{sec.key}</div>
                <div style={{ fontSize: 13, fontWeight: secKey === sec.key ? 500 : 400, marginTop: 2 }}>{sec.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{sec.standards.length} standard{sec.standards.length !== 1 ? 's' : ''}</div>
              </div>
            ))
          }
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 20px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, title, commentary, or evidence…" style={{ fontSize: 13 }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)' }}>
            {search.trim().length > 1 ? (
              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ padding: '18px 0 14px', fontSize: 18, fontWeight: 600 }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{search}"</div>
                {searchResults.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 14 }}>No standards matched.</div>}
                {searchResults.map(std => <StdCard key={std.id} std={std} showMeta canEdit={canEdit}
                  onEdit={() => setModal({ type: 'edit', mode: 'edit', catKey: std.category_key, secKey: std.section_key, std })}
                  onDelete={() => setModal({ type: 'deleteConfirm', catKey: std.category_key, secKey: std.section_key, std })} />)}
              </div>
            ) : !secKey ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text3)', fontSize: 14 }}>
                Select a section to view its standards.
              </div>
            ) : (
              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ padding: '18px 0 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text3)' }}>{secKey}</div>
                    <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{currentSec?.title}</div>
                  </div>
                  {canEdit && (
                    <button onClick={() => setModal({ type: 'edit', mode: 'add', catKey, secKey, std: { title: '', type: 'O', commentary: '', evidence: [] } })}
                      style={{ background: 'var(--blue-l)', color: 'var(--blue-t)', border: '0.5px solid #B5D4F4', fontWeight: 500 }}>
                      + Add standard
                    </button>
                  )}
                </div>
                {currentSec?.standards.length === 0 && <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text3)', fontSize: 14 }}>No standards in this section yet.</div>}
                {currentSec?.standards.map(std => (
                  <StdCard key={std.id} std={std} canEdit={canEdit}
                    onEdit={() => setModal({ type: 'edit', mode: 'edit', catKey, secKey, std })}
                    onDelete={() => setModal({ type: 'deleteConfirm', catKey, secKey, std })} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal?.type === 'edit' && (
        <EditModal std={modal.std} mode={modal.mode} sectionKey={modal.secKey}
          totalInSection={cats.find(c => c.key === modal.catKey)?.sections.find(s => s.key === modal.secKey)?.standards.length || 0}
          onSave={handleSaveEdit} onClose={closeModal} />
      )}
      {modal?.type === 'deleteConfirm' && (
        <Modal onClose={closeModal}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Delete standard?</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 22 }}>
            Permanently remove <strong>{modal.std.std_key} — {modal.std.title}</strong>? Remaining standards will renumber automatically.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={closeModal}>Cancel</button>
            <button disabled={saving} onClick={() => handleDelete(modal.std.id, modal.secKey)} style={{ background: 'var(--red-l)', color: 'var(--red-t)', border: '0.5px solid var(--red-b)', fontWeight: 500 }}>
              {saving ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === 'archive' && (
        <Modal onClose={closeModal}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Archive {activeYear?.year}?</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 22 }}>
            This saves all {activeYear?.year} standards as a read-only archive and advances to {activeYear?.year + 1}. All standards are copied forward as a starting point for the new year.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={closeModal}>Cancel</button>
            <button disabled={saving} onClick={handleArchive} style={{ background: 'var(--amber-l)', color: 'var(--amber-t)', border: '0.5px solid #FAC775', fontWeight: 500 }}>
              {saving ? 'Archiving…' : `Archive & advance to ${activeYear?.year + 1}`}
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === 'export' && <ExportModal onClose={closeModal} cats={cats} year={activeYear?.year} />}

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
