import InquiryForm from "@/components/InquiryForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />

      <div className="relative w-full max-w-6xl">
        <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-6 md:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">

            {/* LEFT COLUMN - Big Logo + Branding */}
            <div className="lg:col-span-2 flex flex-col items-start space-y-5 rounded-2xl ">
              {/* Big logo (contains brand name) */}
              <img
                src="/logos.png"
              alt ="Creative Sol House Logo"
                className="w-full max-w-[380px] md:max-w-[420px] h-auto object-contain select-none rounded-3xl "
                draggable={false}
              />

              {/* Tagline under the logo */}
              <p className="text-sm text-amber-400 font-extralight tracking-[0.15em] uppercase -mt-9">
                Design · Development · Delivery
              </p>

              <div className="w-full h-px bg-gradient-to-r from-amber-400/60 via-amber-400/20 to-transparent" />

              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-white leading-snug tracking-wide">
                  Let's Start A Conversation.
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Fill Out The Form And Our Team At{" "}
                  <span className="font-semibold text-amber-400">Creative Sol House</span>{" "}
                  Will Get Back To You Within 24 Hours.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {['24H Response', 'No Spam', 'Secure'].map((item) => (
                  <span
                    key={item}
                    className="px-2.5 py-0.5 text-[11px] font-medium text-amber-400 bg-amber-400/10 rounded-full border border-amber-400/30"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN - Form on CREAM panel */}
            <div className="lg:col-span-3">
              <div className="bg-linear-to-br from-amber-50 to-amber-300 rounded-2xl border border-purple-900/15 p-5 md:p-6 shadow-2xl shadow-purple-900/10">
                <InquiryForm />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © 2026 <span className="text-amber-400 font-medium">Creative Sol House</span>. All Rights Reserved.
          {" · "}
          <a
            href="https://cshouse.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 font-medium hover:text-amber-300 underline-offset-2 hover:underline transition-colors"
          >
            cshouse.net
          </a>
        </p>
      </div>
    </main>
  );
}