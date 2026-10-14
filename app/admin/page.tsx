"use client";

export default function AdminBlockedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-50 via-white to-pink-50 relative overflow-hidden">
      {/* Ambient glow accents */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b10_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      <div className="relative w-full max-w-lg animate-[fadeIn_0.35s_ease-out]">
        {/* Warning icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/30">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mt-6 tracking-tight text-center">
            This Page Is Not Available
          </h1>
          <p className="text-sm text-slate-700 mt-2 text-center max-w-sm">
            This area is restricted. Access is limited to authorized personnel only.
          </p>
        </div>

        {/* Info card */}
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-blue-100 shadow-2xl shadow-blue-500/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
              <svg
                className="w-4.5 h-4.5 text-red-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-900">
                Unauthorized access attempt
              </p>
              <p className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">
                You do not have permission to view this resource. If you believe
                this is a mistake, contact the site administrator.
              </p>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <svg
                className="w-4.5 h-4.5 text-blue-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-slate-900">
                Looking for something else?
              </p>
              <p className="text-[12.5px] text-slate-700 mt-0.5 leading-relaxed">
                Return to the public site to submit a new inquiry or browse our
                services.
              </p>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="mt-6 flex justify-center">
          <a
            href="/"
            className="group px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 shadow-lg shadow-blue-500/25 transition-all duration-200 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 17l-5-5m0 0l5-5m-5 5h12"
              />
            </svg>
            Back to Home
          </a>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Error 403 · Forbidden
        </p>
      </div>
    </main>
  );
}