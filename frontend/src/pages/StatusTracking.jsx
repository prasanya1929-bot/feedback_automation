import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/StatusTracking.css'

const API = import.meta.env.VITE_BACKEND_URL

// ── Status badge colours ───────────────────────────────────
const STATUS_STYLES = {
  'Pending':     { bg: '#fffbeb', color: '#92400e', border: '#fde68a' },
  'In Progress': { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe' },
  'Resolved':    { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  'Rejected':    { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES['Pending']
  return (
    <span
      className="st-badge"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      <span className="st-badge-dot" style={{ background: s.color }} />
      {status}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function StatusTracking() {
  const navigate = useNavigate()

  const [statuses,  setStatuses]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [userInfo,  setUserInfo]  = useState(null)   // { branch, year, section, email }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login', { replace: true }); return }

    // Decode student info from JWT — no extra API call
    let decoded
    try {
      decoded = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      )
    } catch {
      navigate('/login', { replace: true })
      return
    }

    // Admins should not land here
    if (decoded.role === 'admin') {
      navigate('/admin', { replace: true })
      return
    }

    setUserInfo({
      email:   decoded.email,
      branch:  decoded.branch,
      year:    decoded.year,
      section: decoded.section,
    })

    // Fetch statuses — backend derives branch/year/section from JWT
    fetch(`${API}/student/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStatuses(data.statuses)
        else setError(data.message || 'Failed to load status.')
      })
      .catch(() => setError('Could not connect to the server.'))
      .finally(() => setLoading(false))
  }, [navigate])

  // Group statuses by subject for a cleaner view
  const grouped = statuses.reduce((acc, s) => {
    if (!acc[s.subject]) acc[s.subject] = []
    acc[s.subject].push(s)
    return acc
  }, {})

  return (
    <div className="st-page">

      {/* Top bar */}
      <header className="st-topbar">
        <button
          type="button"
          className="st-back-btn"
          onClick={() => navigate('/dashboard')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Back
        </button>
        <div className="st-topbar-title-wrap">
          <h1 className="st-topbar-title">Feedback Issue Status</h1>
          {userInfo && (
            <span className="st-topbar-subtitle">
              {userInfo.branch} · Year {userInfo.year} · Section {userInfo.section}
            </span>
          )}
        </div>
      </header>

      <main className="st-body">

        {/* Info strip */}
        <div className="st-info-strip">
          Showing issue statuses for your class only. Status updates are managed by your administrator.
        </div>

        {/* Loading */}
        {loading && (
          <div className="st-state">
            <div className="st-spinner" />
            <p className="st-state-title">Loading status…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="st-state">
            <span className="st-state-icon">⚠️</span>
            <p className="st-state-title">Something went wrong</p>
            <p className="st-state-desc">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && statuses.length === 0 && (
          <div className="st-state">
            <span className="st-state-icon">📭</span>
            <p className="st-state-title">No issue statuses yet</p>
            <p className="st-state-desc">
              Once your administrator reviews the feedback for your class, issue statuses will appear here.
            </p>
          </div>
        )}

        {/* Status grouped by subject */}
        {!loading && !error && Object.entries(grouped).map(([subject, items]) => (
          <div key={subject} className="st-subject-card">
            <div className="st-subject-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span className="st-subject-name">{subject}</span>
            </div>

            <table className="st-table">
              <thead>
                <tr>
                  <th className="st-th">Question</th>
                  <th className="st-th">Issue</th>
                  <th className="st-th">Status</th>
                  <th className="st-th">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="st-tr">
                    <td className="st-td st-td-question">{item.question}</td>
                    <td className="st-td st-td-issue">{item.issue}</td>
                    <td className="st-td">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="st-td st-td-date">
                      {formatDate(item.updatedAt) ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      </main>
    </div>
  )
}
