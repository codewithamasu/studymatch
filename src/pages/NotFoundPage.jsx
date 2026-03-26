import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Sparkles, ArrowLeft, Ghost } from 'lucide-react'
import { DISPLAY_FONT } from '@/lib/constants'



export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#F9F9F8] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <Helmet>
        <title>404 - Page Ghosted | StudyMatch</title>
      </Helmet>

      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-neutral-100 mb-8 animate-bounce">
          <Ghost className="w-12 h-12 text-blue-500" strokeWidth={1.5} />
        </div>

        <h1 
          className="text-4xl sm:text-5xl font-bold text-neutral-900 tracking-tight mb-4"
          style={{ fontFamily: DISPLAY_FONT }}
        >
          404 - Ghosted!
        </h1>

        <p className="text-neutral-500 text-lg mb-10 leading-relaxed">
          Whoops! This page ghosted us. It might have moved to a different study session or never existed.
        </p>

        <div className="space-y-4">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 w-full py-4 bg-[#136DEC] text-white rounded-[20px] font-bold shadow-[0_12px_24px_rgba(19,109,236,0.25)] hover:bg-[#1162D3] active:scale-[0.97] transition-all duration-200"
          >
            <Sparkles className="w-5 h-5" />
            Back to Success
          </Link>
          
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-4 text-neutral-600 font-semibold hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go to Landing
          </Link>
        </div>
      </div>

      <p className="absolute bottom-8 left-0 right-0 text-center text-[11px] font-bold tracking-widest uppercase text-neutral-400">
        StudyMatch &bull; Smart Study Partners
      </p>
    </div>
  )
}
