import { useParams, useNavigate } from 'react-router-dom'
import { JitsiMeeting } from '@jitsi/react-sdk'
import { useAuthStore } from '@/store/useAuthStore'
import { ArrowLeft } from 'lucide-react'

export default function JitsiMeetPage() {
  const { roomId } = useParams()
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  const handleApiReady = (api) => {
    api.addListener('videoConferenceLeft', () => {
      navigate('/sessions')
    })
  }

  const generatedRoomName = `studymatch-${roomId}`
  const jitsiDomain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si'

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0F172A]">
      {/* Header bar */}
      <div className="h-16 shrink-0 bg-[#1e293b]/90 backdrop-blur-md flex items-center px-4 md:px-6 justify-between border-b border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Study Session</h1>
            <p className="text-slate-400 text-xs">Room ID: {roomId}</p>
          </div>
        </div>
      </div>

      {/* Jitsi SDK wrapper */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#0F172A]">
        <JitsiMeeting
          domain={jitsiDomain}
          roomName={generatedRoomName}
          configOverwrite={{
            startWithAudioMuted: false,
            disableModeratorIndicator: true,
            startScreenSharing: true,
            enableEmailInStats: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_CHROME_EXTENSION_BANNER: false,
          }}
          userInfo={{
            displayName: user?.full_name || 'StudyMatch User',
            email: user?.email || '',
          }}
          onApiReady={handleApiReady}
          spinner={() => (
            <div className="flex h-full w-full items-center justify-center bg-[#0F172A] text-slate-200">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-white" />
                <p className="text-sm font-medium">Loading meeting room...</p>
              </div>
            </div>
          )}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
            iframeRef.style.border = 'none';
            iframeRef.style.position = 'absolute';
            iframeRef.style.inset = '0';
          }}
        />
      </div>
    </div>
  )
}
