'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './page.module.css';

const API_URL = 'http://localhost:5001/ask';
const WAVEFORM_DELAYS = [0.1, 0.3, 0.5, 0.2, 0.7, 0.4, 0.6, 0.1, 0.35, 0.55, 0.25, 0.8];

type ConversationStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';
type SideTab = 'transcript' | 'progress';

interface TranscriptItem {
  speaker: string;
  time: string;
  type: 'ai' | 'candidate' | 'system';
  text: string;
}

export default function MeetPage() {
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [micOn, setMicOn] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [sideTab, setSideTab] = useState<SideTab>('transcript');
  const [elapsed, setElapsed] = useState(0);
  const [camError, setCamError] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [liveText, setLiveText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [speechReady, setSpeechReady] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const hasSpeechRef = useRef(false);
  const micMutedRef = useRef(false);
  const lastQuestionRef = useRef<string>('');
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const questionCount = useRef(0);
  const isListeningRef = useRef(false);
  const statusRef = useRef<ConversationStatus>('idle');
  const elapsedRef = useRef(0);

  // ── Connection Check ──
  useEffect(() => {
    async function checkServer() {
      try {
        const res = await fetch(API_URL.replace('/ask', '/'), { method: 'GET' });
        if (res.ok) setServerStatus('online');
        else setServerStatus('offline');
      } catch {
        setServerStatus('offline');
      }
    }
    checkServer();

    setSpeechReady(typeof MediaRecorder !== 'undefined');
  }, []);

  // Keep refs in sync with state
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  // ── Timer (Starts when session begins) ──
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [sessionStarted]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const getCurrentTime = () => formatTime(elapsedRef.current);

  // ── Camera setup ──
  useEffect(() => {
    let active = true;
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

      } catch {
        setCamError(true);
      }
    }
    initMedia();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Auto-scroll transcript ──
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, liveText]);



  // ── Stop AI speech ──
  const stopSpeaking = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = '';
      audioPlayerRef.current = null;
    }
  }, []);

  // ── Speak AI text via Groq PlayAI TTS ──
  const speakText = useCallback(async (text: string, onDone: () => void) => {
    try {
      const res = await fetch('http://localhost:5001/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS request failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      audio.onended = () => {
        URL.revokeObjectURL(url);
        audioPlayerRef.current = null;
        onDone();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        audioPlayerRef.current = null;
        onDone();
      };
      audio.play();
    } catch {
      // Fallback to browser TTS if Groq TTS fails
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = onDone;
      utterance.onerror = () => onDone();
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // ── Request mic permission explicitly ──
  const requestMicPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); // immediately release
      setMicPermission('granted');
      return true;
    } catch {
      setMicPermission('denied');
      setErrorMsg('Microphone access denied. Please allow mic access in browser settings.');
      setStatus('error');
      return false;
    }
  }, []);

  // ── Call AI backend ──
  const callBackend = useCallback(
    async (userText: string) => {
      setStatus('thinking');
      statusRef.current = 'thinking';
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answer: userText, prevQuestion: lastQuestionRef.current }),
        });
        const data = await res.json();
        const aiText = data.response || "I'm sorry, I couldn't process that.";
        lastQuestionRef.current = aiText;

        questionCount.current++;

        setTranscript((prev) => [
          ...prev,
          { speaker: 'HireAI', time: getCurrentTime(), type: 'ai', text: aiText },
        ]);

        // Speak the AI response (built-in, offline)
        setStatus('speaking');
        statusRef.current = 'speaking';

        speakText(aiText, () => {
          setStatus('idle');
          statusRef.current = 'idle';

          // Check if interview is finished
          if (data.status === 'finished' || data.finished) {
            handleEndSession();
            return;
          }

          // Auto-restart listening if mic is still on
          if (isListeningRef.current) {
            startRecording();
          }
        });
      } catch (err) {
        console.error('Backend call failed:', err);
        setStatus('idle');
        statusRef.current = 'idle';
        setTranscript((prev) => [
          ...prev,
          {
            speaker: 'System',
            time: getCurrentTime(),
            type: 'system',
            text: 'Connection error. Make sure the backend server is running on port 5001.',
          },
        ]);
        // Retry listening
        if (isListeningRef.current) {
          startRecording();
        }
      }
    },
    [speakText]
  );

  // ── Start Recording via MediaRecorder + Groq Whisper ──
  const startRecording = useCallback(async () => {
    // Cleanup previous session
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* noop */
      }
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        /* noop */
      }
      audioContextRef.current = null;
    }

    if (!isListeningRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      // Re-apply mute state (stream is recreated each round)
      if (micMutedRef.current) {
        stream.getAudioTracks().forEach((t) => {
          t.enabled = false;
        });
      }

      // AudioContext for silence detection
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      audioContext.createMediaStreamSource(stream).connect(analyser);

      // MediaRecorder setup
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg';
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      hasSpeechRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // Release mic + AudioContext
        audioStreamRef.current?.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try {
            audioContextRef.current.close();
          } catch {
            /* noop */
          }
          audioContextRef.current = null;
        }

        if (!hasSpeechRef.current || !isListeningRef.current) {
          if (isListeningRef.current) startRecording();
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (audioBlob.size < 1000) {
          if (isListeningRef.current) startRecording();
          return;
        }

        setLiveText('Transcribing...');
        setStatus('thinking');
        statusRef.current = 'thinking';

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'audio.webm');
          const res = await fetch('http://localhost:5001/transcribe', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();
          const text = (data.text || '').trim();

          if (text.length > 1) {
            setTranscript((prev) => [
              ...prev,
              { speaker: 'You', time: getCurrentTime(), type: 'candidate', text },
            ]);
            setLiveText('');
            callBackend(text);
          } else {
            setLiveText('');
            setStatus('listening');
            statusRef.current = 'listening';
            if (isListeningRef.current) startRecording();
          }
        } catch {
          setLiveText('');
          setStatus('listening');
          statusRef.current = 'listening';
          if (isListeningRef.current) startRecording();
        }
      };

      recorder.start(100);
      setStatus('listening');
      statusRef.current = 'listening';
      setErrorMsg('');
      setLiveText('');

      // Silence detection via AnalyserNode
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const SILENCE_THRESHOLD = 12;
      const SILENCE_DURATION = 1500;
      let silenceStartTime: number | null = null;

      const detectSilence = () => {
        if (!isListeningRef.current || statusRef.current !== 'listening') return;
        if (mediaRecorderRef.current?.state !== 'recording') return;

        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, val) => sum + val, 0) / dataArray.length;

        if (avg > SILENCE_THRESHOLD) {
          hasSpeechRef.current = true;
          silenceStartTime = null;
          setLiveText('Listening...');
        } else if (hasSpeechRef.current) {
          if (!silenceStartTime) {
            silenceStartTime = Date.now();
          } else if (Date.now() - silenceStartTime > SILENCE_DURATION) {
            silenceStartTime = null;
            try {
              recorder.stop();
            } catch {
              /* noop */
            }
            return;
          }
        }

        requestAnimationFrame(detectSilence);
      };

      requestAnimationFrame(detectSilence);
    } catch {
      setErrorMsg('Failed to access microphone. Please check permissions.');
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callBackend]);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => {
        console.error('Fullscreen error:', err);
        setErrorMsg('Failed to enter Fullscreen mode. Please maximize the window manually for the best experience.');
      });
    }
  };

  const startInterview = async () => {
    setShowWarningModal(false);
    enterFullscreen();
    
    // Request mic permission first if needed
    if (micPermission !== 'granted') {
      const granted = await requestMicPermission();
      if (!granted) return;
    }

    // Turn on
    isListeningRef.current = true;
    setMicOn(true);
    setSessionStarted(true);
    setErrorMsg('');
    startRecording();

    // Add first AI message if transcript is empty
    if (transcript.length === 0) {
      const intro = "Welcome to your HireAI interview. I will be your interviewer today. Please start by introducing yourself.";
      setTranscript([{ speaker: 'HireAI', time: getCurrentTime(), type: 'ai', text: intro }]);
      speakText(intro, () => {
         setStatus('listening');
         statusRef.current = 'listening';
      });
    }
  };

  const handleEndSession = useCallback(() => {
    isListeningRef.current = false;
    micMutedRef.current = false;
    setMicOn(false);
    setMicMuted(false);
    setSessionStarted(false);
    setShowEndConfirmModal(false);
    setStatus('idle');
    statusRef.current = 'idle';
    setLiveText('');
    setErrorMsg('');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch { /* noop */ }
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch { /* noop */ }
      audioContextRef.current = null;
    }
    stopSpeaking();

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
  }, [stopSpeaking]);

  // ── Toggle Mic (Now repurposed to handle warning or end request) ──
  const toggleMic = useCallback(async () => {
    if (micOn) {
      setShowEndConfirmModal(true);
      return;
    }
    
    setShowWarningModal(true);
  }, [micOn]);

  // ── Toggle Mute (audio track only — never touches AI status) ──
  const toggleMute = useCallback(() => {
    if (!micOn) return;
    const muted = !micMuted;
    micMutedRef.current = muted;
    setMicMuted(muted);
    // Apply to current stream if one is active
    if (audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !muted;
      });
    }
    if (muted) setLiveText('');
  }, [micOn, micMuted]);

  // ── Toggle Camera ──
  const toggleCam = () => {
    const tracks = streamRef.current?.getVideoTracks() ?? [];
    tracks.forEach((t) => {
      t.enabled = !t.enabled;
    });
    setCamOn((prev) => !prev);
  };

  // ── Status display helpers ──
  const statusLabel = (): string => {
    switch (status) {
      case 'listening':
        return 'LISTENING';
      case 'thinking':
        return 'AI PROCESSING';
      case 'speaking':
        return 'AI SPEAKING';
      case 'error':
        return 'ERROR';
      default:
        return 'READY';
    }
  };

  const statusIcon = (): string => {
    switch (status) {
      case 'listening':
        return 'hearing';
      case 'thinking':
        return 'psychology';
      case 'speaking':
        return 'record_voice_over';
      case 'error':
        return 'error_outline';
      default:
        return 'auto_awesome';
    }
  };

  const statusColor = (): string => {
    switch (status) {
      case 'listening':
        return '#00eefc';
      case 'thinking':
        return '#ffc832';
      case 'speaking':
        return '#db90ff';
      case 'error':
        return '#ff5555';
      default:
        return '#6b7280';
    }
  };

  const orbClass = (): string => {
    switch (status) {
      case 'listening':
        return styles.orbListening;
      case 'thinking':
        return styles.orbThinking;
      case 'speaking':
        return styles.orbSpeaking;
      default:
        return styles.orbIdle;
    }
  };

  const orbGradient = (): string => {
    switch (status) {
      case 'listening':
        return 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), rgba(0,238,252,0.7) 40%, rgba(0,180,220,0.9) 70%, rgba(219,144,255,0.4))';
      case 'thinking':
        return 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), rgba(255,200,50,0.7) 40%, rgba(255,160,30,0.9) 70%, rgba(219,144,255,0.4))';
      case 'speaking':
        return 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), rgba(219,144,255,0.8) 40%, rgba(177,46,241,0.9) 70%, rgba(0,238,252,0.4))';
      case 'error':
        return 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2), rgba(255,85,85,0.5) 40%, rgba(200,50,50,0.7) 70%, rgba(100,30,30,0.3))';
      default:
        return 'radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2), rgba(100,100,120,0.5) 40%, rgba(60,60,80,0.7) 70%, rgba(40,40,60,0.3))';
    }
  };

  return (
    <div
      className={styles.container}
      style={{ minHeight: '100vh', overflow: 'hidden', position: 'relative' }}
    >
      {/* ── Ambient Background ── */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <div
          className={styles.animateBlob}
          style={{
            position: 'absolute',
            top: '-10%',
            left: '-5%',
            width: 500,
            height: 500,
            background: 'rgba(219,144,255,0.1)',
            borderRadius: '50%',
            filter: 'blur(120px)',
          }}
        />
        <div
          className={styles.animateBlob}
          style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-5%',
            width: 600,
            height: 600,
            background: 'rgba(0,238,252,0.08)',
            borderRadius: '50%',
            filter: 'blur(140px)',
            animationDelay: '-5s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 800,
            height: 800,
            background: 'rgba(19,19,26,0.2)',
            borderRadius: '50%',
            filter: 'blur(100px)',
          }}
        />
      </div>

      {/* ── Top Nav ── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          zIndex: 50,
          background: 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span
            className={styles.headline}
            style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              background: 'linear-gradient(90deg, #c084fc, #22d3ee)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            HireAI Interview
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              background: `${statusColor()}15`,
              border: `1px solid ${statusColor()}33`,
              transition: 'all 0.4s ease',
            }}
          >
            <div
              className={styles.statusDot}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: statusColor(),
                transition: 'background 0.4s ease',
              }}
            />
            <span
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: statusColor(),
                transition: 'color 0.4s ease',
              }}
            >
              {statusLabel()}
            </span>
          </div>

          {/* Connection Indicators */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div
              title={serverStatus === 'online' ? 'Server Connected' : 'Server Offline'}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: serverStatus === 'online' ? '#22c55e' : '#ef4444',
              }}
            />
            <div
              title={speechReady ? 'Speech Service Ready' : 'Speech Service Unavailable'}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: speechReady ? '#22d3ee' : '#6b7280',
              }}
            />
          </div>

          <span style={{ fontSize: '0.8rem', color: '#6b7280', fontFamily: 'monospace' }}>
            {formatTime(elapsed)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
              cursor: 'pointer',
              fontSize: '1.5rem',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#67e8f9')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            <span className="material-symbols-outlined">help</span>
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              paddingLeft: '1.5rem',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f6f2fc', margin: 0 }}>
                Candidate
              </p>
              <p style={{ fontSize: '0.65rem', color: '#9ca3af', margin: 0 }}>Voice Interview</p>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '2rem', color: '#6b7280', fontVariationSettings: "'FILL' 1" }}
            >
              account_circle
            </span>
          </div>
        </div>
      </nav>

      {/* ── Right Side Panel ── */}
      <aside
        style={{
          position: 'fixed',
          right: 0,
          top: '6rem',
          bottom: '6rem',
          width: 300,
          borderRadius: '1.5rem 0 0 1.5rem',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,15,22,0.5)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          zIndex: 40,
          boxShadow: '0 0 40px rgba(138,43,226,0.1)',
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <h2
            className={styles.headline}
            style={{ color: '#22d3ee', fontWeight: 700, fontSize: '1.1rem', margin: 0 }}
          >
            HireAI Panel
          </h2>
          <p
            style={{
              color: '#6b7280',
              fontSize: '0.65rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              margin: '0.25rem 0 0',
            }}
          >
            {status === 'idle'
              ? 'Waiting'
              : status === 'listening'
                ? 'Recording'
                : status === 'thinking'
                  ? 'Processing'
                  : status === 'speaking'
                    ? 'Responding'
                    : 'Error'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '0.75rem',
            padding: '0.25rem',
          }}
        >
          {(['transcript', 'progress'] as SideTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSideTab(tab)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                transition: 'all 0.2s',
                background: sideTab === tab ? 'rgba(34,211,238,0.15)' : 'transparent',
                color: sideTab === tab ? '#22d3ee' : '#6b7280',
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                {tab === 'transcript' ? 'description' : 'analytics'}
              </span>
              {tab === 'transcript' ? 'Transcript' : 'Stats'}
            </button>
          ))}
        </div>

        {/* Panel Content */}
        <div
          ref={transcriptRef}
          className={styles.transcriptScroll}
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {sideTab === 'transcript' ? (
            <>
              {transcript.length === 0 && !liveText && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    gap: '1rem',
                    opacity: 0.5,
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '2.5rem', color: '#4b5563' }}
                  >
                    mic
                  </span>
                  <p style={{ fontSize: '0.75rem', color: '#4b5563', textAlign: 'center' }}>
                    Press the microphone button to start your interview
                  </p>
                </div>
              )}
              {transcript.map((item, i) => (
                <div
                  key={i}
                  className={styles.transcriptEntry}
                  style={{
                    background:
                      item.type === 'system' ? 'rgba(255,85,85,0.06)' : 'rgba(255,255,255,0.04)',
                    padding: '0.875rem',
                    borderRadius: '1rem',
                    border: `1px solid ${item.type === 'system' ? 'rgba(255,85,85,0.15)' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem',
                      color:
                        item.type === 'ai'
                          ? '#db90ff'
                          : item.type === 'system'
                            ? '#ff5555'
                            : '#00eefc',
                    }}
                  >
                    {item.speaker} • {item.time}
                  </p>
                  <p
                    style={{
                      fontSize: '0.8rem',
                      color: item.type === 'system' ? '#ff8888' : '#acaab3',
                      lineHeight: 1.6,
                      margin: 0,
                      fontStyle: item.type === 'ai' ? 'italic' : 'normal',
                    }}
                  >
                    {item.type !== 'system' && '\u201C'}
                    {item.text}
                    {item.type !== 'system' && '\u201D'}
                  </p>
                </div>
              ))}
              {liveText && (
                <div
                  className={styles.transcriptEntry}
                  style={{
                    background: 'rgba(0,238,252,0.06)',
                    padding: '0.875rem',
                    borderRadius: '1rem',
                    border: '1px solid rgba(0,238,252,0.15)',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '0.5rem',
                      color: '#00eefc',
                    }}
                  >
                    You • Live
                  </p>
                  <p
                    className={styles.blinkCursor}
                    style={{ fontSize: '0.8rem', color: '#c0faff', lineHeight: 1.6, margin: 0 }}
                  >
                    {liveText}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div style={{ paddingTop: '0.5rem' }}>

              <div
                style={{
                  padding: '1rem',
                  borderRadius: '1rem',
                  background: 'rgba(219,144,255,0.06)',
                  border: '1px solid rgba(219,144,255,0.15)',
                }}
              >
                <p
                  style={{
                    fontSize: '0.65rem',
                    color: '#db90ff',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 700,
                    marginBottom: '1rem',
                  }}
                >
                  Session Stats
                </p>
                {[
                  { label: 'Questions Asked', val: questionCount.current },
                  {
                    label: 'Responses Given',
                    val: transcript.filter((t) => t.type === 'candidate').length,
                  },
                  { label: 'Duration', val: formatTime(elapsed) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <span>{stat.label}</span>
                    <span style={{ color: '#f6f2fc', fontWeight: 700 }}>{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Canvas ── */}
      <main
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          paddingRight: 300,
          paddingTop: '5rem',
          paddingBottom: '6rem',
          position: 'relative',
        }}
      >
        <div
          className={styles.glassPanel}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 900,
            aspectRatio: '16/9',
            borderRadius: 40,
            overflow: 'hidden',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 120px rgba(219,144,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(219,144,255,0.05), rgba(0,238,252,0.05))',
              pointerEvents: 'none',
            }}
          />

          {/* AI Orb */}
          <div style={{ position: 'relative', width: 260, height: 260 }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                border: `2px solid ${statusColor()}33`,
                borderRadius: '50%',
                animation: 'spin 10s linear infinite',
                transition: 'border-color 0.4s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 16,
                border: `1px solid ${statusColor()}55`,
                borderRadius: '50%',
                animation: 'spin 15s linear infinite reverse',
                transition: 'border-color 0.4s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: -20,
                border: `1px dashed ${statusColor()}22`,
                borderRadius: '50%',
                animation: 'spin 25s linear infinite',
                transition: 'border-color 0.4s ease',
              }}
            />

            {status === 'listening' && (
              <>
                <div
                  className={styles.listeningRing}
                  style={{
                    position: 'absolute',
                    inset: -10,
                    border: '2px solid rgba(0,238,252,0.3)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  className={styles.listeningRing}
                  style={{
                    position: 'absolute',
                    inset: -10,
                    border: '2px solid rgba(0,238,252,0.2)',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    animationDelay: '0.5s',
                  }}
                />
              </>
            )}

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                className={orbClass()}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: orbGradient(),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background 0.6s ease',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    background: 'white',
                    borderRadius: '50%',
                    filter: 'blur(16px)',
                    opacity: 0.5,
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>

          {/* AI Status Tag */}
          <div
            style={{
              position: 'absolute',
              bottom: 28,
              left: 28,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(12px)',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: statusColor(), fontSize: '1.1rem', transition: 'color 0.4s ease' }}
            >
              {statusIcon()}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#f6f2fc',
              }}
            >
              {statusLabel()}
            </span>
            {(status === 'speaking' || status === 'listening') && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
                {[0.1, 0.4, 0.2, 0.6, 0.3].map((delay, i) => (
                  <div
                    key={i}
                    className={styles.waveformBar}
                    style={{
                      width: 3,
                      background: statusColor(),
                      borderRadius: 2,
                      animationDelay: `${delay}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div
              style={{
                position: 'absolute',
                top: 28,
                left: 28,
                right: 28,
                padding: '0.75rem 1rem',
                background: 'rgba(255,85,85,0.12)',
                backdropFilter: 'blur(12px)',
                borderRadius: '1rem',
                border: '1px solid rgba(255,85,85,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: '#ff5555', fontSize: '1.1rem' }}
              >
                warning
              </span>
              <p style={{ fontSize: '0.75rem', color: '#ff8888', margin: 0, lineHeight: 1.4 }}>
                {errorMsg}
              </p>
            </div>
          )}

          {/* Live transcript overlay or Text Input */}
          {(liveText || showInput) && !errorMsg && (
            <div
              style={{
                position: 'absolute',
                top: 28,
                left: 28,
                right: 28,
                padding: '0.75rem 1rem',
                background: 'rgba(0,238,252,0.08)',
                backdropFilter: 'blur(12px)',
                borderRadius: '1rem',
                border: '1px solid rgba(0,238,252,0.2)',
                zIndex: 10,
              }}
            >
              <p
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#00eefc',
                  marginBottom: '0.3rem',
                }}
              >
                {showInput ? 'Type your response' : 'You (Live)'}
              </p>
              {showInput ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    autoFocus
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && textInput.trim()) {
                        setTranscript((prev) => [
                          ...prev,
                          {
                            speaker: 'You',
                            time: getCurrentTime(),
                            type: 'candidate',
                            text: textInput.trim(),
                          },
                        ]);
                        callBackend(textInput.trim());
                        setTextInput('');
                        setShowInput(false);
                      }
                    }}
                    placeholder="Type here..."
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(0,238,252,0.3)',
                      color: 'white',
                      outline: 'none',
                      fontSize: '0.85rem',
                    }}
                  />
                  <button
                    onClick={() => setShowInput(false)}
                    className="material-symbols-outlined"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                    }}
                  >
                    close
                  </button>
                </div>
              ) : (
                <p
                  className={styles.blinkCursor}
                  style={{ fontSize: '0.85rem', color: '#c0faff', margin: 0, lineHeight: 1.5 }}
                >
                  {liveText}
                </p>
              )}
            </div>
          )}

          {/* Candidate PiP */}
          <div
            style={{
              position: 'absolute',
              bottom: 28,
              right: 28,
              width: 200,
              aspectRatio: '16/9',
              borderRadius: 16,
              overflow: 'hidden',
              border: `1px solid ${camOn ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.15)'}`,
              boxShadow: camOn
                ? '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(34,197,94,0.15)'
                : '0 8px 32px rgba(0,0,0,0.6)',
              background: 'rgba(20,20,30,0.9)',
              transition: 'border 0.3s, box-shadow 0.3s',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: camOn && !camError ? 'block' : 'none',
                transform: 'scaleX(-1)',
              }}
            />
            {(!camOn || camError) && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '0.4rem',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '2.5rem',
                    color: '#374151',
                    fontVariationSettings: "'FILL' 1",
                  }}
                >
                  {camError ? 'no_photography' : 'videocam_off'}
                </span>
                <span
                  style={{
                    fontSize: '0.55rem',
                    color: '#4b5563',
                    textAlign: 'center',
                    padding: '0 0.5rem',
                  }}
                >
                  {camError ? 'Camera access denied' : 'Camera Off'}
                </span>
              </div>
            )}
            <div style={{ position: 'absolute', top: 8, right: 8 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: camOn && !camError ? '#22c55e' : '#6b7280',
                  boxShadow: camOn && !camError ? '0 0 8px rgba(34,197,94,0.8)' : 'none',
                  transition: 'background 0.3s',
                }}
              />
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 6,
                left: 6,
                padding: '0.1rem 0.4rem',
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                borderRadius: 4,
                fontSize: '0.5rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#9ca3af',
              }}
            >
              Candidate (You)
            </div>
          </div>
        </div>

        {/* Floating Waveform */}
        {(status === 'listening' || status === 'speaking') && (
          <div
            style={{
              position: 'absolute',
              bottom: '8.5rem',
              left: '50%',
              transform: 'translateX(calc(-50% - 150px))',
              display: 'flex',
              alignItems: 'flex-end',
              gap: 4,
              height: 32,
              opacity: 0.6,
            }}
          >
            {WAVEFORM_DELAYS.map((delay, i) => (
              <div
                key={i}
                className={styles.waveformBar}
                style={{
                  width: 4,
                  background:
                    status === 'listening' ? '#00eefc' : i % 2 === 0 ? '#00eefc' : '#db90ff',
                  borderRadius: 2,
                  animationDelay: `${delay}s`,
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Bottom Dock ── */}
      <nav
        style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(calc(-50% - 150px))',
          borderRadius: '9999px',
          padding: '0.875rem 2rem',
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(20,20,30,0.75)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          display: 'flex',
          gap: '2rem',
          alignItems: 'center',
          zIndex: 50,
          boxShadow: '0 20px 50px rgba(0,238,252,0.12), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        <DockButton
          label={micOn ? 'Session Active' : 'Start Interview'}
          icon={micOn ? 'fiber_manual_record' : 'play_arrow'}
          active={micOn}
          activeColor="rgba(34,211,238,0.2)"
          activeTextColor="#22d3ee"
          onClick={toggleMic}
          pulsing={status === 'listening'}
        />
        <DockButton
          label={micMuted ? 'Unmute' : 'Mute'}
          icon={micMuted ? 'mic_off' : 'mic'}
          active={micMuted}
          activeColor="rgba(255,85,85,0.2)"
          activeTextColor="#ff5555"
          onClick={toggleMute}
          disabled={!micOn}
        />
        <DockButton
          label="Camera"
          icon={camOn ? 'videocam' : 'videocam_off'}
          active={false}
          onClick={toggleCam}
        />
        <DockButton
          label="Text"
          icon="keyboard"
          active={showInput}
          onClick={() => setShowInput(!showInput)}
        />
        <DockButton label="Settings" icon="settings" active={false} onClick={() => {}} />
        <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />
        <DockButton
          label="End"
          icon="call_end"
          filled
          active={false}
          activeColor="rgba(167,1,56,0.9)"
          activeTextColor="#ffb2b9"
          danger
          onClick={() => {
            if (micOn) {
              setShowEndConfirmModal(true);
              return;
            }
            if (typeof window !== 'undefined') window.history.back();
          }}
        />
      </nav>

      {/* Warning Modal (Start Interview) */}
      {showWarningModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '2rem'
          }}
        >
          <div 
            style={{
              maxWidth: 500,
              background: 'rgba(20,20,30,0.9)',
              border: '1px solid rgba(255,85,85,0.3)',
              borderRadius: '2rem',
              padding: '2.5rem',
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(255,85,85,0.15)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#ff5555', marginBottom: '1.5rem' }}>
              warning
            </span>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f6f2fc', marginBottom: '1rem' }}>
              Interview Integrity Warning
            </h2>
            <div style={{ textAlign: 'left', color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              <p style={{ marginBottom: '1rem' }}>
                By starting this interview, you agree to the following conditions:
              </p>
              <ul style={{ paddingLeft: '1.2rem', gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
                <li>This session will be recorded and analyzed by AI for assessment.</li>
                <li><strong>Manual interruption or stopping is disabled</strong> until the interview reaches its natural conclusion.</li>
                <li>Exiting or refreshing the browser may result in immediate disqualification.</li>
                <li>The browser will enter <strong>Full Screen Mode</strong> for the duration of the interview.</li>
              </ul>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowWarningModal(false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9ca3af',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={startInterview}
                style={{
                  flex: 2,
                  padding: '1rem',
                  borderRadius: '1rem',
                  background: 'linear-gradient(135deg, #7b3bed, #ff5555)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(123,59,237,0.3)'
                }}
              >
                I Understand, Start
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session Confirmation Modal */}
      {showEndConfirmModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 101,
            padding: '2rem'
          }}
        >
          <div 
            style={{
              maxWidth: 460,
              background: 'rgba(20,20,30,0.9)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '2rem',
              padding: '2.5rem',
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(0,0,0,0.5)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#ffb2b9', marginBottom: '1.5rem' }}>
              cancel
            </span>
            <h2 style={{ fontSize: '1.750rem', fontWeight: 800, color: '#f6f2fc', marginBottom: '1rem' }}>
              End Current Session?
            </h2>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
              Ending the session now may invalidate your current progress. Are you sure you want to terminate the interview?
            </p>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowEndConfirmModal(false)}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '1rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#9ca3af',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Keep Going
              </button>
              <button 
                onClick={handleEndSession}
                style={{
                  flex: 1.5,
                  padding: '1rem',
                  borderRadius: '1rem',
                  background: 'rgba(167,1,56,0.9)',
                  border: 'none',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirm End
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-style: normal;
          display: inline-block;
          line-height: 1;
          user-select: none;
        }
      `}</style>
    </div>
  );
}

// ── Dock Button Component ──
interface DockButtonProps {
  label: string;
  icon: string;
  active: boolean;
  activeColor?: string;
  activeTextColor?: string;
  filled?: boolean;
  danger?: boolean;
  pulsing?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function DockButton({
  label,
  icon,
  active,
  activeColor,
  activeTextColor,
  filled,
  danger,
  pulsing,
  disabled,
  onClick,
}: DockButtonProps) {
  const [hovered, setHovered] = useState(false);

  const bg = disabled
    ? 'transparent'
    : danger
      ? activeColor || 'rgba(167,1,56,0.85)'
      : active && activeColor
        ? activeColor
        : hovered
          ? 'rgba(255,255,255,0.08)'
          : 'transparent';

  const color = disabled
    ? '#374151'
    : danger
      ? activeTextColor || '#ffb2b9'
      : active && activeTextColor
        ? activeTextColor
        : '#cbd5e1';

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        background: bg,
        border: pulsing ? `2px solid ${activeTextColor || '#22d3ee'}` : 'none',
        borderRadius: '9999px',
        padding: '0.75rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        color,
        transform: hovered && !disabled ? 'scale(1.1)' : 'scale(1)',
        transition: 'all 0.2s ease',
        boxShadow: danger
          ? '0 4px 16px rgba(255,110,132,0.25)'
          : pulsing
            ? `0 0 20px ${activeTextColor || '#22d3ee'}44`
            : 'none',
        minWidth: 54,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '1.4rem', fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: '0.6rem',
          fontWeight: 600,
          fontFamily: 'Manrope, sans-serif',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
    </button>
  );
}
