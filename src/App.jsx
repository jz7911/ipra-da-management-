import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'
import AuthPage from './AuthPage'

// ─── Helpers ────────────────────────────────────────────────────────
function renumber(standards, sectionKey) {
  return standards.map((s, i) => ({ ...s, std_key: `${sectionKey}.${i + 1}`, sort_order: i }))
}

function Badge({ type }) {
  return (
    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 500, flexShrink: 0, background: type === 'M' ? '#fcebeb' : '#e1f5ee', color: type === 'M' ? '#791f1f' : '#085041', border: `0.5px solid ${type === 'M' ? '#f7c1c1' : '#9FE1CB'}` }}>
      {type === 'M' ? 'Mandatory' : 'Optional'}
    </span>
  )
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 9999, background: type === 'error' ? '#fcebeb' : '#e1f5ee', color: type === 'error' ? '#791f1f' : '#085041', border: `0.5px solid ${type === 'error' ? '#f7c1c1' : '#9FE1CB'}`, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}>
      {msg}
    </div>
  )
}

function Modal({ children, onClose, wide }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 50, zIndex: 1000, overflowY: 'auto' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 12, padding: 26, width: wide ? 660 : 500, maxWidth: '96vw', marginBottom: 40 }}>
        {children}
      </div>
    </div>
  )
}

function FL({ children, sub }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <label style={{ fontSize: 11, color: '#999992', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{children}</label>
      {sub && <span style={{ fontSize: 11, color: '#999992', marginLeft: 6, textTransform: 'none', letterSpacing: 0 }}>{sub}</span>}
    </div>
  )
}

// ─── Edit Standard Modal ─────────────────────────────────────────────
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

  return (
    <Modal onClose={onClose} wide>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: '#1a1a1a' }}>
        {mode === 'add' ? 'Add standard' : `Edit ${std?.std_key}`}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <FL>Title</FL>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Standard title..." autoFocus
            style={{ width: '100%', fontSize: 14, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div>
          <FL>Position in section</FL>
          <select value={form.position} onChange={e => set('position', parseInt(e.target.value))}
            style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff' }}>
            {Array.from({ length: maxPos }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>
                {mode === 'add'
                  ? (n === maxPos ? `${n} — end of section` : `${n} — insert before ${sectionKey}.${n}`)
                  : (n === currentPos ? `${n} — current` : `${n}`)}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 11, color: '#999992', marginTop: 4 }}>Others renumber automatically</div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <FL>Type</FL>
        <div style={{ display: 'flex', gap: 8 }}>
          {['M', 'O'].map(t => (
            <button key={t} onClick={() => set('type', t)} style={{ padding: '6px 18px', fontSize: 13, fontWeight: form.type === t ? 500 : 400, background: form.type === t ? (t === 'M' ? '#fcebeb' : '#e1f5ee') : '#f8f8f7', color: form.type === t ? (t === 'M' ? '#791f1f' : '#085041') : '#555550', border: `0.5px solid ${form.type === t ? (t === 'M' ? '#f7c1c1' : '#9FE1CB') : 'rgba(0,0,0,0.12)'}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t === 'M' ? 'Mandatory' : 'Optional'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <FL>Commentary</FL>
        <textarea rows={4} value={form.commentary} onChange={e => set('commentary', e.target.value)} placeholder="Describe the intent of this standard..."
          style={{ width: '100%', fontSize: 13, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }} />
      </div>

      <div style={{ marginBottom: 22 }}>
        <FL sub="(one item per line)">Evidence of compliance</FL>
        <textarea rows={7} value={form.evidence} onChange={e => set('evidence', e.target.value)}
          style={{ width: '100%', fontSize: 12, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: "'JetBrains Mono', monospace", resize: 'vertical', lineHeight: 1.6, boxSizing: 'border-box' }}
          placeholder="a. Evidence item one&#10;b. Evidence item two&#10;c. Evidence item three" />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '7px 16px', fontFamily: 'inherit' }}>Cancel</button>
        <button disabled={saving || !form.title.trim()}
          onClick={async () => {
            setSaving(true)
            await onSave({ ...form, evidence: form.evidence.split('\n').map(e => e.trim()).filter(Boolean) })
            setSaving(false)
          }}
          style={{ padding: '7px 20px', background: form.title.trim() && !saving ? '#1D9E75' : '#9FE1CB', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: form.title.trim() && !saving ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
          {saving ? 'Saving…' : mode === 'add' ? 'Add standard' : 'Save changes'}
        </button>
      </div>
    </Modal>
  )
}

// ─── Version History Modal ───────────────────────────────────────────
function HistoryModal({ std, onClose }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('standard_versions').select('*').eq('standard_id', std.id).order('changed_at', { ascending: false })
      .then(({ data }) => { setVersions(data || []); setLoading(false) })
  }, [std.id])

  const changeBadge = (type) => {
    const s = { created: { background: '#e1f5ee', color: '#085041', border: '0.5px solid #9FE1CB' }, updated: { background: '#e6f1fb', color: '#0c447c', border: '0.5px solid #B5D4F4' }, deleted: { background: '#fcebeb', color: '#791f1f', border: '0.5px solid #f7c1c1' } }
    return <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 500, ...s[type] }}>{type}</span>
  }

  return (
    <Modal onClose={onClose} wide>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: '#1a1a1a' }}>Version history</div>
      <div style={{ fontSize: 13, color: '#999992', marginBottom: 20 }}>{std.std_key} — {std.title}</div>
      {loading ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#999992', fontSize: 13 }}>Loading…</div>
      ) : versions.length === 0 ? (
        <div style={{ padding: '30px 0', textAlign: 'center', color: '#999992', fontSize: 13 }}>No history yet.</div>
      ) : (
        <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden', maxHeight: 460, overflowY: 'auto' }}>
          {versions.map((v, i) => (
            <div key={v.id} style={{ borderBottom: i < versions.length - 1 ? '0.5px solid rgba(0,0,0,0.07)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8f8f7' }}>
                {changeBadge(v.change_type)}
                <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>{v.changed_by_name || 'Unknown'}</span>
                <span style={{ fontSize: 11, color: '#999992', marginLeft: 'auto' }}>
                  {new Date(v.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#999992' }}>{v.std_key}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{v.title}</span>
                  <Badge type={v.type} />
                </div>
                {v.commentary && <div style={{ fontSize: 12, color: '#555550', fontStyle: 'italic', marginBottom: 4, lineHeight: 1.5 }}>{v.commentary}</div>}
                {v.evidence?.map((e, j) => (
                  <div key={j} style={{ fontSize: 12, color: '#555550', padding: '1px 0 1px 12px', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 3, top: 6, width: 3, height: 3, borderRadius: '50%', background: '#aaa', display: 'inline-block' }} />
                    {e}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={{ padding: '7px 16px', fontFamily: 'inherit' }}>Close</button>
      </div>
    </Modal>
  )
}

// ─── Export Modal ────────────────────────────────────────────────────
function ExportModal({ onClose, cats, year }) {
  const [selected, setSelected] = useState(() => { const s = {}; cats.forEach(c => { s[c.key] = true }); return s })
  const [format, setFormat] = useState(null)
  const [exporting, setExporting] = useState(false)
  const selectedCats = cats.filter(c => selected[c.key])
  const allSelected = cats.every(c => selected[c.key])
  const noneSelected = cats.every(c => !selected[c.key])
  const toggleAll = (val) => { const s = {}; cats.forEach(c => { s[c.key] = val }); setSelected(s) }

  const exportPDF = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>IPRA Standards ${year}</title><style>body{font-family:Georgia,serif;max-width:820px;margin:30px auto;padding:0 24px;color:#1a1a1a;line-height:1.75;font-size:13px}h1{font-size:22px;font-weight:600;border-bottom:2px solid #1D9E75;padding-bottom:10px;margin-bottom:24px}h2{font-size:17px;font-weight:600;margin-top:42px;padding:7px 14px;background:#f5f5f3;border-left:4px solid #888}h3{font-size:14px;font-weight:600;margin-top:22px;color:#444}.std{border:1px solid #ddd;border-radius:5px;padding:14px;margin:12px 0;page-break-inside:avoid}.badge{font-size:10px;padding:2px 6px;border-radius:3px;font-weight:700;margin-left:6px}.M{background:#fee2e2;color:#991b1b}.O{background:#dcfce7;color:#166534}.commentary{font-size:12px;color:#555;font-style:italic;margin:6px 0 8px}.ev-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#888;margin-bottom:5px}.ev{font-size:12px;padding:2px 0 2px 14px;position:relative}.ev:before{content:"•";position:absolute;left:3px;color:#888}@media print{h2{page-break-before:always}h2:first-of-type{page-break-before:avoid}.std{page-break-inside:avoid}button{display:none}}.btn{position:fixed;top:16px;right:16px;padding:8px 20px;background:#1D9E75;color:white;border:none;border-radius:6px;font-size:13px;cursor:pointer}</style></head><body><button class="btn" onclick="window.print()">Print / Save as PDF</button><h1>IPRA — Joint Distinguished Agency<br>Accreditation Standards ${year}</h1>\n`
    selectedCats.forEach(cat => {
      html += `<h2>${cat.label}</h2>\n`
      cat.sections.forEach(sec => {
        html += `<h3>${sec.key} — ${sec.title}</h3>\n`
        sec.standards.forEach(s => { html += `<div class="std"><strong>${s.std_key} ${s.title}</strong><span class="badge ${s.type}">${s.type === 'M' ? 'MANDATORY' : 'OPTIONAL'}</span>${s.commentary ? `<div class="commentary"><strong style="font-style:normal">Commentary:</strong> ${s.commentary}</div>` : ''}<div class="ev-label">Evidence of compliance</div>${s.evidence.map(e => `<div class="ev">${e}</div>`).join('')}</div>\n` })
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
      <div style={{ fontSize: 13, color: '#999992', marginBottom: 20 }}>Choose categories and format.</div>
      <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 10, overflow: 'hidden', marginBottom: 22 }}>
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
      <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 12 }}>Format</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
        {[{ key: 'word', icon: '📄', title: 'Word document', desc: 'Downloads a .docx file.' }, { key: 'pdf', icon: '🖨️', title: 'PDF', desc: 'Print-ready page — use Print → Save as PDF.' }].map(({ key, icon, title, desc }) => (
          <div key={key} onClick={() => setFormat(key)} style={{ border: `${format === key ? '2px solid #1D9E75' : '0.5px solid rgba(0,0,0,0.12)'}`, borderRadius: 10, padding: '14px 13px', cursor: 'pointer', background: format === key ? '#f0faf6' : '#fff' }}>
            <div style={{ fontSize: 24, marginBottom: 7 }}>{icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 }}>{title}</div>
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

// ─── Standard Card ────────────────────────────────────────────────────
function StdCard({ std, onEdit, onDelete, onHistory, showMeta }) {
  return (
    <div style={{ border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: '#f8f8f7', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#999992', marginBottom: 3 }}>
            {std.std_key}
            {showMeta && <span style={{ fontFamily: 'Inter, sans-serif', marginLeft: 8 }}>· {std.category_label} › {std.section_title}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{std.title}</span>
            <Badge type={std.type} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginTop: 2 }}>
          <button onClick={() => onHistory(std)} style={{ fontSize: 11, padding: '3px 10px', color: '#555550', border: '0.5px solid rgba(0,0,0,0.15)', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>History</button>
          <button onClick={() => onEdit(std)} style={{ fontSize: 11, padding: '3px 10px', color: '#0c447c', border: '0.5px solid #B5D4F4', background: '#e6f1fb', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>Edit</button>
          <button onClick={() => onDelete(std)} style={{ fontSize: 11, padding: '3px 10px', color: '#791f1f', border: '0.5px solid #f7c1c1', background: '#fcebeb', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
        </div>
      </div>
      {std.commentary && (
        <div style={{ padding: '10px 16px', fontSize: 13, color: '#555550', lineHeight: 1.65, borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontStyle: 'italic' }}>
          <span style={{ fontStyle: 'normal', fontWeight: 500 }}>Commentary: </span>{std.commentary}
        </div>
      )}
      <div style={{ padding: '10px 16px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#999992', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Evidence of compliance</div>
        {std.evidence?.map((ev, i) => (
          <div key={i} style={{ fontSize: 13, color: '#1a1a1a', padding: '3px 0 3px 14px', position: 'relative', lineHeight: 1.5 }}>
            <span style={{ position: 'absolute', left: 4, top: 9, width: 4, height: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.2)', display: 'inline-block' }} />
            {ev}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cats, setCats] = useState([])
  const [allYears, setAllYears] = useState([])
  const [activeYear, setActiveYear] = useState(null)
  const [selectedYear, setSelectedYear] = useState(null)
  const [catKey, setCatKey] = useState(null)
  const [secKey, setSecKey] = useState(null)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => setToast({ msg, type })
  const closeModal = () => setModal(null)

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
    setSelectedYear(prev => prev || activeYearRow)
    setCats(buildCats(activeYearRow?.year, catsData, secs, stds))
    setLoading(false)
  }, [])

  const switchYear = useCallback(async (year) => {
    setCatKey(null); setSecKey(null); setSearch(''); setLoading(true)
    const [{ data: catsData }, { data: secs }, { data: stds }] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('sections').select('*').order('sort_order'),
      supabase.from('standards_full').select('*').order('sort_order')
    ])
    setCats(buildCats(year.year, catsData, secs, stds))
    setSelectedYear(year)
    setLoading(false)
  }, [])

  // ── Save edit / add ─────────────────────────────────────────────────
  const handleSaveEdit = async (form) => {
    setSaving(true)
    const cat = cats.find(c => c.key === modal.catKey)
    const sec = cat?.sections.find(s => s.key === modal.secKey)
    if (!sec) return

    const pos = form.position - 1
    let stds = [...sec.standards]

    if (modal.mode === 'edit') {
      const oldIdx = stds.findIndex(s => s.id === modal.std.id)
      stds.splice(oldIdx, 1)
      stds.splice(pos, 0, { ...modal.std, title: form.title, type: form.type, commentary: form.commentary, evidence: form.evidence })
    } else {
      stds.splice(pos, 0, { title: form.title, type: form.type, commentary: form.commentary, evidence: form.evidence, section_id: sec.id, year_id: selectedYear.id })
    }

    stds = renumber(stds, sec.key)

    const upserts = stds.map(s => ({
      ...(s.id ? { id: s.id } : {}),
      section_id: sec.id,
      year_id: selectedYear.id,
      std_key: s.std_key,
      title: s.title,
      type: s.type,
      commentary: s.commentary || '',
      evidence: s.evidence || [],
      sort_order: s.sort_order
    }))

    const { error } = await supabase.from('standards').upsert(upserts, { onConflict: 'id' })
    if (error) { showToast('Save failed: ' + error.message, 'error'); setSaving(false); return }

    await switchYear(selectedYear)
    closeModal()
    showToast(modal.mode === 'edit' ? 'Standard saved — history recorded' : 'Standard added')
    setSaving(false)
  }

  // ── Delete ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setSaving(true)
    const { std, catKey: ck, secKey: sk } = modal
    const cat = cats.find(c => c.key === ck)
    const sec = cat?.sections.find(s => s.key === sk)

    await supabase.from('standards').delete().eq('id', std.id)

    const remaining = renumber(sec.standards.filter(s => s.id !== std.id), sk)
    if (remaining.length > 0) {
      await supabase.from('standards').upsert(remaining.map(s => ({ id: s.id, std_key: s.std_key, sort_order: s.sort_order, section_id: sec.id, year_id: selectedYear.id, title: s.title, type: s.type, commentary: s.commentary || '', evidence: s.evidence || [] })))
    }

    await switchYear(selectedYear)
    closeModal()
    showToast('Deleted — history recorded')
    setSaving(false)
  }

  const allStds = cats.flatMap(c => c.sections.flatMap(s => s.standards))
  const totalStds = allStds.length
  const mandatoryStds = allStds.filter(s => s.type === 'M').length
  const isArchived = selectedYear && activeYear && selectedYear.year !== activeYear.year

  const searchResults = search.trim().length > 1
    ? allStds.filter(s =>
        s.std_key?.toLowerCase().includes(search.toLowerCase()) ||
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.commentary?.toLowerCase().includes(search.toLowerCase()) ||
        s.evidence?.some(e => e.toLowerCase().includes(search.toLowerCase()))
      ) : []

  const currentCat = cats.find(c => c.key === catKey)
  const currentSec = currentCat?.sections.find(s => s.key === secKey)

  if (!session) return <AuthPage />
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999992', fontSize: 14, background: '#f2f1ef' }}>Loading standards…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f2f1ef' }}>

      {isArchived && (
        <div style={{ background: '#faeeda', borderBottom: '0.5px solid #FAC775', padding: '8px 20px', fontSize: 12, color: '#633806', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span>Viewing archived <strong>{selectedYear.year}</strong> standards — editing disabled for archived years.</span>
          <button onClick={() => switchYear(activeYear)} style={{ fontSize: 11, padding: '2px 10px', background: '#fff', border: '0.5px solid #FAC775', borderRadius: 6, color: '#633806', cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>Return to {activeYear.year}</button>
        </div>
      )}

      {/* Top bar */}
      <div style={{ height: 56, background: '#fff', borderBottom: '0.5px solid rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 30, height: 30, background: '#1D9E75', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm8.75-3.25a.75.75 0 00-1.5 0V8c0 .199.079.39.22.53l2.25 2.25a.75.75 0 101.06-1.06L8.75 7.69V4.75z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.2 }}>IPRA Accreditation Standards</div>
            <div style={{ fontSize: 11, color: '#999992' }}>Joint Distinguished Agency Committee</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#999992', padding: '3px 10px', background: '#f8f8f7', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 20 }}>{totalStds} standards · {mandatoryStds} mandatory</span>
          {allYears.length > 1 ? (
            <select value={selectedYear?.year || ''} onChange={e => { const y = allYears.find(yr => yr.year === parseInt(e.target.value)); if (y) switchYear(y) }}
              style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', background: '#e6f1fb', color: '#0c447c', border: '0.5px solid #B5D4F4', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
              {allYears.map(y => <option key={y.year} value={y.year}>{y.year}{y.is_active ? ' (current)' : ' (archived)'}</option>)}
            </select>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', background: '#e6f1fb', color: '#0c447c', border: '0.5px solid #B5D4F4', borderRadius: 20 }}>{selectedYear?.year}</span>
          )}
          {profile?.full_name && <span style={{ fontSize: 12, color: '#555550', padding: '4px 10px', background: '#f8f8f7', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 20 }}>{profile.full_name}</span>}
          <button onClick={() => setModal({ type: 'export' })} style={{ background: '#e1f5ee', color: '#085041', border: '0.5px solid #9FE1CB', fontWeight: 500, fontSize: 12, padding: '5px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Export</button>
          <button onClick={() => supabase.auth.signOut()} style={{ fontSize: 12, color: '#999992', padding: '5px 12px', background: 'none', border: '0.5px solid rgba(0,0,0,0.12)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Category sidebar */}
        <div style={{ width: 215, flexShrink: 0, background: '#fff', borderRight: '0.5px solid rgba(0,0,0,0.1)', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, color: '#999992', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 14px 6px' }}>Categories</div>
          {cats.map(cat => (
            <div key={cat.key} onClick={() => { setCatKey(cat.key); setSecKey(null) }}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: catKey === cat.key ? '#1a1a1a' : '#555550', fontWeight: catKey === cat.key ? 500 : 400, background: catKey === cat.key ? '#f8f8f7' : 'transparent', borderLeft: `3px solid ${catKey === cat.key ? cat.dot_color : 'transparent'}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.dot_color, flexShrink: 0 }} />
              {cat.label}
            </div>
          ))}
        </div>

        {/* Section list */}
        <div style={{ width: 235, flexShrink: 0, background: '#f8f8f7', borderRight: '0.5px solid rgba(0,0,0,0.1)', overflowY: 'auto' }}>
          {!catKey ? <div style={{ padding: 20, fontSize: 13, color: '#999992' }}>Select a category</div>
            : currentCat?.sections.map(sec => (
              <div key={sec.key} onClick={() => setSecKey(sec.key)}
                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '0.5px solid rgba(0,0,0,0.07)', background: secKey === sec.key ? '#fff' : 'transparent' }}>
                <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#999992' }}>{sec.key}</div>
                <div style={{ fontSize: 13, fontWeight: secKey === sec.key ? 500 : 400, marginTop: 2, color: '#1a1a1a' }}>{sec.title}</div>
                <div style={{ fontSize: 11, color: '#999992', marginTop: 2 }}>{sec.standards.length} standard{sec.standards.length !== 1 ? 's' : ''}</div>
              </div>
            ))
          }
        </div>

        {/* Main panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '8px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.1)', background: '#fff', flexShrink: 0 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID, title, commentary, or evidence…"
              style={{ fontSize: 13, width: '100%', padding: '7px 10px', border: '0.5px solid rgba(0,0,0,0.18)', borderRadius: 8, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
            {search.trim().length > 1 ? (
              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ padding: '18px 0 14px', fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{search}"</div>
                {searchResults.length === 0 && <div style={{ color: '#999992', fontSize: 14 }}>No standards matched.</div>}
                {searchResults.map(std => <StdCard key={std.id} std={std} showMeta
                  onEdit={std => !isArchived && setModal({ type: 'edit', mode: 'edit', catKey: std.category_key, secKey: std.section_key, std })}
                  onDelete={std => !isArchived && setModal({ type: 'deleteConfirm', catKey: std.category_key, secKey: std.section_key, std })}
                  onHistory={std => setModal({ type: 'history', std })} />)}
              </div>
            ) : !secKey ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999992', fontSize: 14 }}>Select a section to view its standards.</div>
            ) : (
              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ padding: '18px 0 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#999992' }}>{secKey}</div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a1a', marginTop: 4 }}>{currentSec?.title}</div>
                  </div>
                  {!isArchived && (
                    <button onClick={() => setModal({ type: 'edit', mode: 'add', catKey, secKey, std: { title: '', type: 'O', commentary: '', evidence: [], sort_order: currentSec.standards.length } })}
                      style={{ background: '#e6f1fb', color: '#0c447c', border: '0.5px solid #B5D4F4', fontWeight: 500, fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                      + Add standard
                    </button>
                  )}
                </div>
                {currentSec?.standards.length === 0 && <div style={{ textAlign: 'center', padding: '50px 0', color: '#999992', fontSize: 14 }}>No standards in this section yet.</div>}
                {currentSec?.standards.map(std => (
                  <StdCard key={std.id} std={std}
                    onEdit={std => setModal({ type: 'edit', mode: 'edit', catKey, secKey, std })}
                    onDelete={std => setModal({ type: 'deleteConfirm', catKey, secKey, std })}
                    onHistory={std => setModal({ type: 'history', std })} />
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
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#1a1a1a' }}>Delete standard?</div>
          <div style={{ fontSize: 13, color: '#555550', lineHeight: 1.7, marginBottom: 22 }}>
            This will permanently remove <strong>{modal.std.std_key} — {modal.std.title}</strong>. A record of this deletion will be saved to version history. Remaining standards will renumber automatically.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={closeModal} style={{ padding: '7px 16px', fontFamily: 'inherit' }}>Cancel</button>
            <button disabled={saving} onClick={handleDelete} style={{ padding: '7px 16px', background: '#fcebeb', color: '#791f1f', border: '0.5px solid #f7c1c1', borderRadius: 8, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}

      {modal?.type === 'history' && <HistoryModal std={modal.std} onClose={closeModal} />}
      {modal?.type === 'export' && <ExportModal onClose={closeModal} cats={cats} year={selectedYear?.year} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
