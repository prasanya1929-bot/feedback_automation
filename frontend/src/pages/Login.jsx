import FeatureCard from '../components/FeatureCard'

const features = [
  { icon: 'lock', title: 'Secure', text: 'End-to-end encrypted', badge: 'Verified' },
  { icon: 'document', title: 'Transparent', text: 'Full audit trail', badge: 'Verified' },
  { icon: 'robot', title: 'AI Assisted', text: 'Smart categorisation', badge: 'Verified' },
]

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function LockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

export default function Login() {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      {/* Left marketing panel */}
      <div className="relative flex w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-950 via-blue-700 to-blue-400 p-8 md:w-1/2 md:p-10 lg:p-12">
        <div className="pointer-events-none absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-xs font-medium tracking-wide text-emerald-300">System online</span>
          </div>

          <div className="space-y-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200/70">
              AI-Powered Feedback Management System
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Campus Feedback Hub
            </h1>
            <p className="text-lg font-medium text-blue-100">A centralized platform for campus feedback</p>
            <p className="max-w-md text-sm leading-relaxed text-blue-100/80">
              Submit, track, and resolve campus concerns efficiently and transparently. Built for students,
              faculty, and administrators.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>

        <p className="relative z-10 mt-8 text-xs text-blue-200/60">
          Access is restricted to verified institutional accounts only.
        </p>
      </div>

      {/* Right login panel */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-6 md:w-1/2 md:p-8 lg:p-12">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-sm font-bold tracking-wide text-white shadow-lg">
              CFH
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              Sign in using your institutional Google account to access your feedback dashboard and track your
              requests.
            </p>
          </div>

          <a
            href={`${import.meta.env.VITE_BACKEND_URL}/auth/google`}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">
            Use your college or university Google Workspace account. Personal Gmail is not permitted.
          </p>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Institutional access only
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
            <LockIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <p className="text-xs leading-relaxed text-slate-500">
              Secure authentication powered by Google. Only authorized institutional accounts can access the
              platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
