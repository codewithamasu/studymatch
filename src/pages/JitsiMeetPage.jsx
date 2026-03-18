import { useParams, useNavigate } from 'react-router-dom'
import { JitsiMeeting } from '@jitsi/react-sdk'
import { useAuth } from '@/context/AuthContext'
import { ArrowLeft } from 'lucide-react'

export default function JitsiMeetPage() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleApiReady = (externalApi) => {
    // We can attach event listeners here if needed
    // e.g. externalApi.addListener('videoConferenceLeft', () => navigate('/dashboard'))
  }

  const generatedRoomName = `studymatch-${roomId}`

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
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
      <div className="flex-1 w-full bg-[#0F172A] relative overflow-hidden">
        <JitsiMeeting
          domain="meet.ffmuc.net"
          roomName={generatedRoomName}
          configOverwrite={{
            startWithAudioMuted: false,
            disableModeratorIndicator: true,
            startScreenSharing: true,
            enableEmailInStats: false,
            prejoinPageEnabled: false, 
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
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
            iframeRef.style.border = 'none';
          }}
        />
      </div>
    </div>
  )
}
