import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'

function decodeToken(token) {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

function val(value) {
  return value !== undefined && value !== null && value !== '' ? value : 'N/A'
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [subjects, setSubjects] = useState([])
  const [submittedSubjects, setSubmittedSubjects] = useState([])
  const profileRef = useRef(null)

 const handleSubjectClick = async (subject) => {
  try {
    const token = localStorage.getItem('token')
    const decoded = decodeToken(token)

    if (!decoded?.email) {
      alert('User session invalid')
      return
    }

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/feedback/check?studentEmail=${decoded.email}&subject=${encodeURIComponent(subject)}`
    )

    const data = await response.json()

    if (data.alreadySubmitted) {
      alert('Feedback already submitted for this subject')
      return
    }

    localStorage.setItem('selectedSubject', subject)
    navigate('/feedback')
  } catch (error) {
    console.error(error)
    alert('Error checking feedback status')
  }
}

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('selectedSubject')
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token')

    if (urlToken) {
      localStorage.setItem('token', urlToken)
      window.history.replaceState({}, document.title, '/dashboard')
    }

    const token = localStorage.getItem('token')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    const decoded = decodeToken(token)
    if (!decoded) {
      localStorage.removeItem('token')
      navigate('/login', { replace: true })
      return
    }

    setUser(decoded)

    const fetchSubmittedSubjects = async (email) => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/feedback/submitted-subjects?studentEmail=${encodeURIComponent(email)}`
        )

        const data = await response.json()
        setSubmittedSubjects(data.submittedSubjects || [])
      } catch (error) {
        console.error(error)
      }
    }

    const fetchSubjects = async (rollNumber) => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/feedback/subjects/${encodeURIComponent(rollNumber)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const data = await response.json()
        setSubjects(data.subjects || [])
      } catch (error) {
        console.error('Failed to load subjects:', error)
        setSubjects([])
      }
    }

    fetchSubmittedSubjects(decoded.email)
    fetchSubjects(decoded.rollNumber)
  }, [navigate])

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) {
    return null
  }

  return (
    <div className="dashboard">
      <button
        type="button"
        className="dashboard-menu-toggle"
        onClick={() => setSidebarOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div
        className={`dashboard-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        role="presentation"
      />

      <aside className={`dashboard-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="dashboard-sidebar-header">
          <div className="dashboard-brand">
            <div className="dashboard-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="dashboard-brand-text">Student Feedback Automation System</span>
          </div>
        </div>

        <nav className="dashboard-nav">
          <button type="button" className="dashboard-nav-item active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>Dashboard</span>
          </button>
          <button type="button" className="dashboard-nav-item"
            onClick={() => navigate('/status')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 14l2 2 4-4" />
            </svg>
            <span>Status Tracking</span>
          </button>
        </nav>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-avatar-wrapper" ref={profileRef}>
            <button
              type="button"
              className="dashboard-avatar"
              onClick={() => setProfileOpen((o) => !o)}
              aria-label="Profile menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>

            {profileOpen && (
              <div className="dashboard-profile-dropdown">
                <h3>Student Profile</h3>
                <div className="dashboard-profile-row">
                  <span className="dashboard-profile-label">Roll Number</span>
                  <span className="dashboard-profile-value">{val(user.rollNumber)}</span>
                </div>
                <div className="dashboard-profile-row">
                  <span className="dashboard-profile-label">Branch</span>
                  <span className="dashboard-profile-value">{val(user.branch)}</span>
                </div>
                <div className="dashboard-profile-row">
                  <span className="dashboard-profile-label">Year</span>
                  <span className="dashboard-profile-value">{val(user.year)}</span>
                </div>
                <div className="dashboard-profile-row">
                  <span className="dashboard-profile-label">Section</span>
                  <span className="dashboard-profile-value">{val(user.section)}</span>
                </div>
                <div className="dashboard-profile-row">
                  <span className="dashboard-profile-label">Email</span>
                  <span className="dashboard-profile-value">{val(user.email)}</span>
                </div>
                <button type="button" className="dashboard-logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="dashboard-content">
          <section className="dashboard-welcome-card">
            <div className="dashboard-welcome-text">
              <h1>Welcome back 👋</h1>
              <p>Your feedback helps us improve the learning experience.</p>
            </div>
            <div className="dashboard-welcome-illustration" aria-hidden="true">
              📚
            </div>
          </section>

          <section className="dashboard-subject-card">
            <h2>Choose Subject to Give Feedback</h2>

            <div className="dashboard-subject-cards-container">
              {subjects.map((subject) => {
                const isSubmitted = submittedSubjects.includes(subject)

                return (
                  <div
                    key={subject}
                    className={`dashboard-subject-card-item${isSubmitted ? ' submitted' : ''}`}
                    onClick={() => {
                      if (!isSubmitted) {
                        handleSubjectClick(subject)
                      }
                    }}
                    role="button"
                    tabIndex={isSubmitted ? -1 : 0}
                    onKeyDown={(e) => {
                      if (isSubmitted) return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSubjectClick(subject)
                      }
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    <span className="subject-name">{subject}</span>
                    {isSubmitted && <span className="dashboard-submitted-badge">✓ Submitted</span>}
                  </div>
                )
              })}
            </div>

            <div className="dashboard-info-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              <span>
                Once you submit feedback for a subject, you will not be able to submit it again.
              </span>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
