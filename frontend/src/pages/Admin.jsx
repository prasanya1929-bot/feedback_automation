import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/Admin.css'

const API = import.meta.env.VITE_BACKEND_URL

const YEAR_OPTIONS    = [1, 2, 3, 4]
const BRANCH_OPTIONS  = ['AIML', 'IOT']
const SECTION_OPTIONS = ['A', 'B', 'C']
const YEAR_LABELS     = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' }
const STATUS_OPTIONS  = ['Pending', 'In Progress', 'Resolved', 'Rejected']

function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch { return null }
}

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('token')}` }
}

function Spinner() {
  return <div className="adm-spinner" aria-label="Loading" />
}

function StateCard({ type, title, desc }) {
  const icons = { idle: '🔍', error: '⚠️', empty: '📭' }
  return (
    <div className="adm-state-card">
      <div className={`adm-state-icon ${type}`}>
        {type === 'loading' ? <Spinner /> : icons[type]}
      </div>
      <p className="adm-state-title">{title}</p>
      {desc && <p className="adm-state-desc">{desc}</p>}
    </div>
  )
}

// ── Response Detail Modal ─────────────────────────────────────
function ResponseModal({ questionData, onClose }) {
  const { label, answers, otherComments, summary } = questionData
  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2 className="adm-modal-title">{label}</h2>
          <button type="button" className="adm-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="adm-modal-body">

          {/* AI Summary */}
          <div>
            <p className="adm-modal-section-title">AI Summary</p>
            <div className="adm-ai-summary">{summary}</div>
          </div>

          <div className="adm-modal-divider" />

          {/* Response Breakdown */}
          <div>
            <p className="adm-modal-section-title">Response Breakdown</p>
            {answers.length === 0 ? (
              <p className="adm-modal-empty">No predefined responses recorded.</p>
            ) : (
              <div className="adm-modal-breakdown">
                {answers.map((a) => (
                  <div key={a.answer} className="adm-modal-breakdown-row">
                    <span className="adm-modal-breakdown-answer">{a.answer}</span>
                    <span className="adm-modal-breakdown-count">{a.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="adm-modal-divider" />

          {/* Others */}
          <div>
            <p className="adm-modal-section-title">Others</p>
            {otherComments.length === 0 ? (
              <p className="adm-modal-empty">No open-ended responses for this category.</p>
            ) : (
              <div className="adm-modal-others-list">
                {otherComments.map((c, i) => (
                  <div key={i} className="adm-modal-other-item">{c}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Overall Feedback Modal ────────────────────────────────────
function OverallModal({ overallSummary, additionalComments, onClose }) {
  return (
    <div className="adm-modal-backdrop" onClick={onClose}>
      <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2 className="adm-modal-title">Overall Student Feedback</h2>
          <button type="button" className="adm-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="adm-modal-body">

          {/* AI Summary */}
          <div>
            <p className="adm-modal-section-title">AI Summary</p>
            <div className="adm-ai-summary">{overallSummary}</div>
          </div>

          <div className="adm-modal-divider" />

          {/* All Comments */}
          <div>
            <p className="adm-modal-section-title">All Student Comments</p>
            {additionalComments.length === 0 ? (
              <p className="adm-modal-empty">No additional comments submitted yet.</p>
            ) : (
              <div className="adm-modal-comments-list">
                {additionalComments.map((c, i) => (
                  <div key={i} className="adm-modal-comment-item">{c}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Overall Feedback Card ─────────────────────────────────────
function OverallFeedbackCard({ overallSummary, additionalComments, onViewAll }) {
  return (
    <div className="adm-overall-card">
      <div className="adm-overall-header">
        <div className="adm-overall-icon">💬</div>
        <span className="adm-overall-title">Overall Student Feedback</span>
      </div>
      <div>
        <div className="adm-ai-label">AI Summary</div>
        <div className="adm-ai-summary">{overallSummary}</div>
      </div>
      <button type="button" className="adm-view-all-btn" onClick={onViewAll}>
        View All Comments
      </button>
    </div>
  )
}

// ── Question Card with AI summary + status controls ───────────
function QuestionCard({ questionData, statusMap, filterCtx, onStatusSaved, onViewResponses }) {
  const { key, label, summary } = questionData
  const num   = key.replace('q', '')

  return (
    <div className="adm-question-card">
      <div className="adm-question-header">
        <span className="adm-question-number">Q{num}</span>
        <span className="adm-question-title">{label}</span>
      </div>

      {/* AI Summary */}
      <div>
        <div className="adm-ai-label">AI Summary</div>
        <div className="adm-ai-summary">{summary}</div>
      </div>

      {/* Status controls + View Responses */}
      <AnswerStatusRow
        questionKey={key}
        label={label}
        statusMap={statusMap}
        filterCtx={filterCtx}
        onStatusSaved={onStatusSaved}
        onViewResponses={onViewResponses}
      />
    </div>
  )
}

// ── Per-question status row (existing controls preserved) ─────
// The old AnswerBar managed one status per answer-option.
// Now we manage one status per question (the summary-level status).
// We keep the same dropdown + Update + badge pattern.
function AnswerStatusRow({ questionKey, label, statusMap, filterCtx, onStatusSaved, onViewResponses }) {
  // Use the first stored status for this question key as the representative
  // (admin sets one status per question now)
  const mapKey         = `${questionKey}|__question__`
  const persistedStatus = statusMap[mapKey] ?? 'Pending'
  const [draft,  setDraft]  = useState(persistedStatus)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDraft(persistedStatus) }, [persistedStatus])

  async function handleUpdate() {
    if (draft === persistedStatus) return
    setSaving(true)
    try {
      const res  = await fetch(`${API}/admin/status`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          ...filterCtx,
          questionKey,
          answer: '__question__',
          status: draft,
        }),
      })
      const data = await res.json()
      if (data.success) onStatusSaved(questionKey, '__question__', data.status)
    } catch { /* silent */ } finally { setSaving(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="adm-status-row">
        <span className="adm-status-label">Status</span>
        <select
          className="adm-status-select"
          data-status={draft}
          value={draft}
          disabled={saving}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={`Status for ${label}`}
        >
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          type="button"
          className="adm-status-update-btn"
          disabled={saving || draft === persistedStatus}
          onClick={handleUpdate}
        >
          {saving ? 'Saving…' : 'Update'}
        </button>
        <span className="adm-status-badge" data-status={persistedStatus}>
          {persistedStatus}
        </span>
      </div>
      <button type="button" className="adm-view-responses-btn" onClick={onViewResponses}>
        View Responses
      </button>
    </div>
  )
}

// ── Main Admin component ──────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate()
  const location = useLocation()

  const [adminUser,   setAdminUser]   = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [year,    setYear]    = useState('')
  const [branch,  setBranch]  = useState('')
  const [section, setSection] = useState('')

  const [facultyOptions,       setFacultyOptions]       = useState([])
  const [facultyLoading,       setFacultyLoading]       = useState(false)
  const [selectedFaculty,      setSelectedFaculty]      = useState('')
  const [selectedSubject,      setSelectedSubject]      = useState('')
  const [selectedFacultyLabel, setSelectedFacultyLabel] = useState('')

  // responses data (replaces analytics for display)
  const [responses,   setResponses]   = useState(null)
  const [fetchState,  setFetchState]  = useState('idle')
  const [errorMsg,    setErrorMsg]    = useState('')

  const [statusMap, setStatusMap] = useState({})

  // Modal state
  const [responseModal, setResponseModal] = useState(null) // questionData object
  const [overallModal,  setOverallModal]  = useState(false)

  // Auth guard
  useEffect(() => {
    const params   = new URLSearchParams(location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      localStorage.setItem('token', urlToken)
      window.history.replaceState({}, document.title, '/admin')
    }
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login', { replace: true }); return }
    const decoded = decodeToken(token)
    if (!decoded || decoded.role !== 'admin') {
      localStorage.removeItem('token')
      navigate('/login', { replace: true })
      return
    }
    setAdminUser(decoded)
  }, [location.search, navigate])

  // Load faculty options
  const loadFacultyOptions = useCallback(async (y, b, s) => {
    if (!y || !b || !s) { setFacultyOptions([]); return }
    setFacultyLoading(true)
    setFacultyOptions([])
    setSelectedFaculty('')
    setSelectedSubject('')
    setSelectedFacultyLabel('')
    setResponses(null)
    setFetchState('idle')
    try {
      const params = new URLSearchParams({ year: y, branch: b, section: s })
      const res  = await fetch(`${API}/admin/faculties?${params}`, { headers: authHeaders() })
      const data = await res.json()
      if (data.success) setFacultyOptions(data.faculties)
    } catch { setFacultyOptions([]) }
    finally { setFacultyLoading(false) }
  }, [])

  useEffect(() => { loadFacultyOptions(year, branch, section) }, [year, branch, section, loadFacultyOptions])

  function resetFilters() {
    setSelectedFaculty(''); setSelectedSubject(''); setSelectedFacultyLabel('')
    setResponses(null); setFetchState('idle'); setStatusMap({})
  }

  function handleYearChange(v)    { setYear(v);    resetFilters() }
  function handleBranchChange(v)  { setBranch(v);  resetFilters() }
  function handleSectionChange(v) { setSection(v); resetFilters() }

  function handleFacultyChange(val) {
    const opt = facultyOptions.find((f) => f.label === val)
    setSelectedSubject(val)
    setSelectedFaculty(opt ? opt.faculty : '')
    setSelectedFacultyLabel(val)
    setResponses(null); setFetchState('idle'); setStatusMap({})
  }

  async function fetchData() {
    if (!year || !branch || !section || !selectedSubject || !selectedFaculty) return
    setFetchState('loading')
    setResponses(null)
    setStatusMap({})
    setErrorMsg('')

    const qp = new URLSearchParams({ year, branch, section, subject: selectedSubject, faculty: selectedFaculty })

    try {
      const [respRes, statusRes] = await Promise.all([
        fetch(`${API}/admin/responses?${qp}`, { headers: authHeaders() }),
        fetch(`${API}/admin/status?${qp}`,    { headers: authHeaders() }),
      ])
      const respData   = await respRes.json()
      const statusData = await statusRes.json()

      if (!respData.success) {
        setErrorMsg(respData.message || 'Failed to load responses.')
        setFetchState('error')
        return
      }

      if (statusData.success) {
        const map = {}
        for (const s of statusData.statuses) {
          map[`${s.questionKey}|${s.answer}`] = s.status
        }
        setStatusMap(map)
      }

      setResponses(respData)
      setFetchState(respData.totalResponses === 0 ? 'empty' : 'done')
    } catch {
      setErrorMsg('Could not connect to the server. Please ensure the backend is running.')
      setFetchState('error')
    }
  }

  function handleStatusSaved(questionKey, answer, newStatus) {
    setStatusMap((prev) => ({ ...prev, [`${questionKey}|${answer}`]: newStatus }))
  }

  function clearFilters() {
    setYear(''); setBranch(''); setSection('')
    setSelectedFaculty(''); setSelectedSubject(''); setSelectedFacultyLabel('')
    setFacultyOptions([]); setResponses(null); setFetchState('idle')
    setErrorMsg(''); setStatusMap({})
  }

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  if (!adminUser) return null

  const allSelected     = year && branch && section && selectedSubject && selectedFaculty
  const facultyDisabled = facultyLoading || !year || !branch || !section
  const filterCtx       = { year, branch, section, subject: selectedSubject, faculty: selectedFaculty }

  return (
    <div className="adm-shell">
      <button type="button" className="adm-menu-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle menu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className={`adm-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} role="presentation" />

      <aside className={`adm-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="adm-sidebar-header">
          <div className="adm-brand">
            <div className="adm-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="adm-brand-text">Campus Feedback Hub</span>
          </div>
        </div>
        <nav className="adm-sidebar-nav">
          <button type="button" className="adm-nav-item active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Dashboard</span>
          </button>
          <button type="button" className="adm-nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Analytics</span>
          </button>
        </nav>
        <div className="adm-sidebar-footer">
          <button type="button" className="adm-logout-sidebar-btn" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            <h1>Feedback Analytics</h1>
            <p>Select filters to view aggregated feedback data</p>
          </div>
          <div className="adm-topbar-right">
            <div className="adm-admin-badge">
              <div className="adm-admin-avatar">{adminUser.email?.[0]?.toUpperCase() ?? 'A'}</div>
              <div className="adm-admin-info">
                <span className="adm-admin-role">Admin</span>
                <span className="adm-admin-email">{adminUser.email}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="adm-body">
          {/* Filter card — unchanged */}
          <section className="adm-filter-card">
            <h2 className="adm-filter-card-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filter Feedback
            </h2>
            <div className="adm-filter-grid">
              <div className="adm-filter-group">
                <label className="adm-filter-label" htmlFor="filter-year">Year</label>
                <select id="filter-year" className="adm-select" value={year} onChange={(e) => handleYearChange(e.target.value)}>
                  <option value="">Select Year</option>
                  {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{YEAR_LABELS[y]}</option>)}
                </select>
              </div>
              <div className="adm-filter-group">
                <label className="adm-filter-label" htmlFor="filter-branch">Branch</label>
                <select id="filter-branch" className="adm-select" value={branch} onChange={(e) => handleBranchChange(e.target.value)}>
                  <option value="">Select Branch</option>
                  {BRANCH_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="adm-filter-group">
                <label className="adm-filter-label" htmlFor="filter-section">Section</label>
                <select id="filter-section" className="adm-select" value={section} onChange={(e) => handleSectionChange(e.target.value)}>
                  <option value="">Select Section</option>
                  {SECTION_OPTIONS.map((s) => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <div className="adm-filter-group">
                <label className="adm-filter-label" htmlFor="filter-faculty">Faculty</label>
                <select id="filter-faculty" className="adm-select" value={selectedSubject} onChange={(e) => handleFacultyChange(e.target.value)} disabled={facultyDisabled || facultyOptions.length === 0}>
                  <option value="">
                    {facultyLoading ? 'Loading...' : !year || !branch || !section ? 'Select Year, Branch & Section first' : facultyOptions.length === 0 ? 'No faculty found' : 'Select Faculty'}
                  </option>
                  {facultyOptions.map((f) => <option key={f.label} value={f.label}>{f.label}</option>)}
                </select>
              </div>
            </div>
            <div className="adm-filter-actions">
              <button type="button" className="adm-fetch-btn" onClick={fetchData} disabled={!allSelected || fetchState === 'loading'}>
                {fetchState === 'loading' ? 'Fetching…' : 'View Feedback Analytics'}
              </button>
              <button type="button" className="adm-clear-btn" onClick={clearFilters}>Clear</button>
            </div>
          </section>

          {/* Summary strip — unchanged */}
          {fetchState === 'done' && responses && (
            <div className="adm-summary-strip">
              <div className="adm-summary-card">
                <div className="adm-summary-icon blue">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div className="adm-summary-info">
                  <span className="adm-summary-value">{responses.totalResponses}</span>
                  <span className="adm-summary-label">Total Responses</span>
                </div>
              </div>
              <div className="adm-summary-card">
                <div className="adm-summary-icon green">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 14l2 2 4-4" />
                  </svg>
                </div>
                <div className="adm-summary-info">
                  <span className="adm-summary-value">{responses.questions.length}</span>
                  <span className="adm-summary-label">Questions Analysed</span>
                </div>
              </div>
              <div className="adm-summary-card">
                <div className="adm-summary-icon purple">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="adm-summary-info">
                  <span className="adm-summary-value" style={{ fontSize: '15px', paddingTop: '6px' }}>{selectedFacultyLabel}</span>
                  <span className="adm-summary-label">Faculty</span>
                </div>
              </div>
            </div>
          )}

          {/* State cards */}
          {fetchState === 'idle'    && <StateCard type="idle"    title="No data loaded yet"           desc="Select Year, Branch, Section and Faculty above, then click View Feedback Analytics." />}
          {fetchState === 'loading' && <StateCard type="loading" title="Fetching analytics…" />}
          {fetchState === 'error'   && <StateCard type="error"   title="Failed to load analytics"     desc={errorMsg} />}
          {fetchState === 'empty'   && <StateCard type="empty"   title="No feedback available"        desc={`No feedback has been submitted yet for ${selectedFacultyLabel} — ${YEAR_LABELS[year]}, ${branch}, Section ${section}.`} />}

          {/* Analytics */}
          {fetchState === 'done' && responses && (
            <>
              <h2 className="adm-analytics-heading">
                Response Breakdown — {selectedFacultyLabel}&nbsp;·&nbsp;{YEAR_LABELS[year]}&nbsp;·&nbsp;{branch}&nbsp;·&nbsp;Section {section}
              </h2>

              {/* Overall card — above question cards */}
              <OverallFeedbackCard
                overallSummary={responses.overallSummary}
                additionalComments={responses.additionalComments}
                onViewAll={() => setOverallModal(true)}
              />

              <div className="adm-analytics-grid">
                {responses.questions.map((q) => (
                  <QuestionCard
                    key={q.key}
                    questionData={q}
                    statusMap={statusMap}
                    filterCtx={filterCtx}
                    onStatusSaved={handleStatusSaved}
                    onViewResponses={() => setResponseModal(q)}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {responseModal && (
        <ResponseModal questionData={responseModal} onClose={() => setResponseModal(null)} />
      )}
      {overallModal && (
        <OverallModal
          overallSummary={responses.overallSummary}
          additionalComments={responses.additionalComments}
          onClose={() => setOverallModal(false)}
        />
      )}
    </div>
  )
}
