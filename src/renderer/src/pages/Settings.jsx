import { useState, useEffect } from 'react'
import { useSettings } from '../hooks/useOrbit'
import './Settings.css'

function ToggleSetting({ label, description, value, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <div className="setting-label">{label}</div>
        {description && <div className="setting-desc">{description}</div>}
      </div>
      <button
        className={`toggle${value ? ' on' : ''}`}
        onClick={() => onChange(!value)}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  )
}

function SliderSetting({ label, description, value, min, max, step = 1, onChange }) {
  return (
    <div className="setting-row col">
      <div className="setting-row-header">
        <div>
          <div className="setting-label">{label}</div>
          {description && <div className="setting-desc">{description}</div>}
        </div>
        <span className="slider-value">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="slider"
      />
    </div>
  )
}

export default function Settings() {
  const { data: settings, reload } = useSettings()
  const [local, setLocal] = useState({})
  const [googleStatus, setGoogleStatus] = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const [importStatus, setImportStatus] = useState('')
  const [scanStatus, setScanStatus] = useState('')

  useEffect(() => {
    if (settings) setLocal(settings)
  }, [settings])

  const save = async (key, value) => {
    const strVal = String(value)
    setLocal(l => ({ ...l, [key]: strVal }))
    await window.orbit.updateSetting(key, strVal)
  }

  const handleConnectGoogle = async () => {
    setGoogleStatus('Opening browser…')
    try {
      const result = await window.orbit.connectGoogle()
      if (result.success) {
        setGoogleStatus('Connected!')
        reload()
      }
    } catch (err) {
      setGoogleStatus(`Error: ${err.message}`)
    }
  }

  const handleDisconnectGoogle = async () => {
    await window.orbit.disconnectGoogle()
    setGoogleStatus('Disconnected')
    reload()
  }

  const handleScanGmail = async () => {
    setScanStatus('Scanning…')
    try {
      const result = await window.orbit.scanGmail()
      if (result.error) {
        setScanStatus(result.error)
      } else {
        setScanStatus(result.message)
      }
    } catch (err) {
      setScanStatus(`Error: ${err.message}`)
    }
  }

  const handleExport = async () => {
    setExportStatus('Exporting…')
    try {
      const data = await window.orbit.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orbit-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportStatus('Exported!')
    } catch (err) {
      setExportStatus(`Error: ${err.message}`)
    }
  }

  const handleLinkedInImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus('Importing…')
    // Read file, send to main via a simple approach
    const text = await file.text()
    // We'll send the CSV text — main process parses it
    try {
      // Store the file path isn't accessible in sandboxed renderer.
      // Instead we send the raw content and parse in renderer using a simple CSV parser.
      const rows = parseLinkedInCSV(text)
      let imported = 0, skipped = 0
      const existing = await window.orbit.getContacts()
      const existingEmails = new Set(existing.map(c => c.email?.toLowerCase()).filter(Boolean))

      for (const row of rows) {
        const email = row['Email Address']?.toLowerCase()
        if (email && existingEmails.has(email)) { skipped++; continue }
        await window.orbit.addContact({
          first_name: row['First Name'] || '',
          last_name: row['Last Name'] || '',
          email: row['Email Address'] || '',
          company: row['Company'] || '',
          role: row['Position'] || '',
          how_met: 'LinkedIn import',
          tags: ''
        })
        imported++
      }
      setImportStatus(`Imported ${imported}, skipped ${skipped} duplicates.`)
    } catch (err) {
      setImportStatus(`Error: ${err.message}`)
    }
  }

  const handleDeleteAll = async () => {
    if (!confirm('Delete ALL data? This cannot be undone.')) return
    if (!confirm('Are you absolutely sure? All contacts, outreach, and interactions will be deleted.')) return
    const contacts = await window.orbit.getContacts()
    for (const c of contacts) await window.orbit.deleteContact(c.id)
    setImportStatus('All data deleted.')
  }

  if (!settings) return <div className="page"><div className="loading-text">Loading…</div></div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Configure Orbit to your preferences</div>
        </div>
      </div>

      <div className="settings-sections">
        <section className="settings-section">
          <div className="settings-section-title">Reminders</div>
          <ToggleSetting
            label="Follow-up reminders"
            description="Get OS notifications when contacts need follow-up"
            value={local.followup_enabled !== 'false'}
            onChange={(v) => save('followup_enabled', v ? 'true' : 'false')}
          />
          <div className="setting-row col">
            <div className="setting-row-header">
              <div>
                <div className="setting-label">Follow-up window</div>
                <div className="setting-desc">Days of silence before a contact is considered overdue</div>
              </div>
            </div>
            <div className="window-chips">
              {[14, 30, 60, 90].map(d => (
                <button
                  key={d}
                  className={`chip${local.followup_window_days === String(d) ? ' active' : ''}`}
                  onClick={() => save('followup_window_days', d)}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-title">Google Account</div>

          {local.google_connected === 'true' ? (
            <>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Signed in with Google</div>
                  <div className="setting-desc">Calendar sync and Gmail scanning are enabled</div>
                  {googleStatus && <div className="status-msg">{googleStatus}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" onClick={handleConnectGoogle}>Reconnect</button>
                  <button className="btn-secondary" onClick={handleDisconnectGoogle}>Sign Out</button>
                </div>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Scan Gmail for outreach</div>
                  <div className="setting-desc">Matches sent emails to your contacts and imports outreach records</div>
                  {scanStatus && <div className="status-msg">{scanStatus}</div>}
                </div>
                <button className="btn-secondary" onClick={handleScanGmail}>Scan Now</button>
              </div>
            </>
          ) : (
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-label">Sign in with Google</div>
                <div className="setting-desc">Connect your Google account to sync Calendar events and scan Gmail for outreach</div>
                {googleStatus && <div className="status-msg">{googleStatus}</div>}
              </div>
              <button className="btn-primary" onClick={handleConnectGoogle}>
                Sign in with Google
              </button>
            </div>
          )}
        </section>

        <section className="settings-section">
          <div className="settings-section-title">Data</div>
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">LinkedIn CSV Import</div>
              <div className="setting-desc">
                Export from LinkedIn → Settings → Data Privacy → Get a copy of your data
              </div>
              {importStatus && <div className="status-msg">{importStatus}</div>}
            </div>
            <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Choose File
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleLinkedInImport} />
            </label>
          </div>
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Export All Data</div>
              <div className="setting-desc">Download all contacts, outreach, and interactions as JSON</div>
              {exportStatus && <div className="status-msg">{exportStatus}</div>}
            </div>
            <button className="btn-secondary" onClick={handleExport}>Export JSON</button>
          </div>
        </section>

        <section className="settings-section danger-zone">
          <div className="settings-section-title" style={{ color: 'var(--red)' }}>Danger Zone</div>
          <div className="setting-row">
            <div className="setting-info">
              <div className="setting-label">Delete All Data</div>
              <div className="setting-desc">Permanently delete all contacts, outreach, and interactions</div>
            </div>
            <button className="btn-danger" onClick={handleDeleteAll}>Delete All</button>
          </div>
        </section>
      </div>
    </div>
  )
}

function parseLinkedInCSV(text) {
  // Skip the first row if it's not a header (LinkedIn has a notes row sometimes)
  const lines = text.trim().split('\n')
  let headerIdx = 0
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('First Name')) { headerIdx = i; break }
  }
  const headers = lines[headerIdx].split(',').map(h => h.replace(/^"|"$/g, '').trim())
  const rows = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const vals = lines[i].match(/("([^"]*)")|([^,]+)|,/g) || []
    const row = {}
    headers.forEach((h, j) => {
      row[h] = (vals[j] || '').replace(/^"|"$/g, '').trim()
    })
    rows.push(row)
  }
  return rows
}
