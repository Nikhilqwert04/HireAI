'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

const JOBS = [
  {
    id: 1,
    title: 'AI Research Scientist',
    desc: 'We need an expert in Large Language Models to help push our boundaries. You will fine-tune models, devise new architectures, and run experiments at scale.',
    skills: ['Python', 'PyTorch', 'Transformers', 'CUDA'],
    colorClass: styles.colorPink,
  },
  {
    id: 2,
    title: 'Senior Frontend Engineer',
    desc: 'Looking for an artist of the browser. Create stunning, physics-based micro-animations and manage complex React states for our next generation interfaces.',
    skills: ['React', 'Next.js', 'TypeScript', 'Animations'],
    colorClass: styles.colorBlue,
  },
  {
    id: 3,
    title: 'Backend Systems Architect',
    desc: 'Scale our infrastructure to handle millions of websocket connections. Low latency, high throughput, and system reliability are your primary goals.',
    skills: ['Go', 'Node.js', 'Kubernetes', 'Redis'],
    colorClass: styles.colorGreen,
  },
  {
    id: 4,
    title: 'Product Designer',
    desc: 'Craft magical experiences that combine cutting-edge AI features with intuitive, human-centered interfaces. Your designs will guide millions of users.',
    skills: ['Figma', 'Prototyping', 'UX Research', 'Framer'],
    colorClass: styles.colorPurple,
  },
];

// Scroll Reveal Wrapper Component
const RevealOnScroll = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.isVisible);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={styles.revealWrapper}>
      {children}
    </div>
  );
};

// Interactive Miniature Calendar Component for portal
const MiniCalendar = ({
  today,
  deadlineDay,
  monthLabel,
}: {
  today: number;
  deadlineDay: number;
  monthLabel: string;
}) => {
  const daysInMonth = 30; // Mock 30 days
  const startOffset = 2; // Start on Tuesday for visualization

  return (
    <div className={styles.calendarWrapper}>
      <div className={styles.calHeader}>{monthLabel}</div>
      <div className={styles.calGrid}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className={styles.calDayLabel}>
            {d}
          </div>
        ))}

        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`offset-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isWindow = day >= today && day < deadlineDay;
          const isDeadline = day === deadlineDay;

          let dayClass = styles.calDay;
          if (isWindow) dayClass += ` ${styles.calWindow}`;
          if (isDeadline) dayClass += ` ${styles.calDeadline}`;

          let tooltip = '';
          if (isWindow) tooltip = 'Interview Available';
          if (isDeadline) tooltip = 'Final Deadline';

          return (
            <div key={day} className={dayClass} title={tooltip}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [view, setView] = useState<'landing' | 'dashboard' | 'process' | 'trust' | 'portal'>(
    'landing'
  );
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [themeMode, setThemeMode] = useState('dark');

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);

  // Mouse interaction state for the background blob parallax effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 40;
    const y = (e.clientY / window.innerHeight - 0.5) * 40;
    setMousePos({ x, y });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim().length > 0) {
      setShowLoginModal(false);
      setShowProfileModal(true);
    }
  };

  const handleProfileComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 0 && phone.trim().length > 0) {
      setShowProfileModal(false);
      setIsLoggedIn(true);
      setView('dashboard');
    }
  };

  const handleJobApplySubmit = () => {
    setView('portal');
  };

  const TopNav = () => (
    <nav className={styles.navBlock}>
      <div className={styles.logo} onClick={() => setView('landing')}>
        HireAI
      </div>
      <div className={styles.navLinks}>
        <button
          className={`${styles.navLink} ${view === 'process' ? styles.navLinkActive : ''}`}
          onClick={() => setView('process')}
        >
          How It Works
        </button>
        <button
          className={`${styles.navLink} ${view === 'trust' ? styles.navLinkActive : ''}`}
          onClick={() => setView('trust')}
        >
          Security & Trust
        </button>
        <button
          className={`${styles.navLink} ${view === 'dashboard' || view === 'portal' ? styles.navLinkActive : ''}`}
          onClick={() => (isLoggedIn ? setView('dashboard') : setShowLoginModal(true))}
        >
          {view === 'portal' ? 'Portal' : 'Open Roles'}
        </button>
        <button
          className={styles.themeToggleBtn}
          onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {themeMode === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
      <div className={styles.navRight}>
        {!isLoggedIn ? (
          <>
            <button className={styles.btnLogin} onClick={() => setShowLoginModal(true)}>
              Login
            </button>
            <button className={styles.btnSignup} onClick={() => setShowLoginModal(true)}>
              Sign up
            </button>
          </>
        ) : (
          <button
            className={styles.btnLogin}
            style={{ borderColor: 'rgba(255,255,255,0.4)' }}
            onClick={() => {
              setIsLoggedIn(false);
              setView('landing');
            }}
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );

  return (
    <div
      className={`${styles.container} ${themeMode === 'light' ? styles.lightMode : ''}`}
      onMouseMove={handleMouseMove}
    >
      <div className={styles.dustOverlay} />

      {/* Universal background blob */}
      <div
        className={styles.liquidBlob}
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
      />

      <div className={styles.contentWrapper}>
        <TopNav />

        {/* View 1: LANDING */}
        {view === 'landing' && (
          <div className={styles.landingMain}>
            <main className={styles.heroSection}>
              <h1 className={styles.heroTitle}>
                Elevate Your
                <br />
                Hiring Experience
              </h1>
              <p className={styles.heroSubtitle}>
                Unlock your hiring potential in a fully automated, unbiased environment, powered by
                our next-gen HireAI.
              </p>
              <button
                className={styles.btnCta}
                onClick={() => (isLoggedIn ? setView('dashboard') : setShowLoginModal(true))}
              >
                {isLoggedIn ? 'View Open Positions' : 'Sign Up & Apply'}
              </button>

              {/* Left Glass Card */}
              <div
                className={styles.floatCardLeft}
                style={{ transform: `translate(${-mousePos.x}px, ${-mousePos.y}px)` }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <span className={styles.fcLabel}>Screening Efficiency</span>
                  <span
                    style={{
                      background: '#fff',
                      color: '#000',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    ↗
                  </span>
                </div>
                <h3 className={styles.fcTitle}>
                  Unparalleled
                  <br />
                  Candidate Matching
                </h3>
                <p style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>Accelerating time to hire</p>
              </div>

              {/* Right Glass Card */}
              <div
                className={styles.floatCardRight}
                style={{ transform: `translate(${-mousePos.x * 1.5}px, ${-mousePos.y * 1.5}px)` }}
              >
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span className={styles.fcLabel}>Shortlist Accuracy</span>
                  <span
                    style={{
                      background: '#fff',
                      color: '#000',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    ↗
                  </span>
                </div>
                <div className={styles.fcStat}>96%</div>
                <div className={styles.fcBarBg}>
                  <div className={styles.fcBarFill} />
                </div>
              </div>
            </main>

            {/* Ticker Section */}
            <RevealOnScroll>
              <div className={styles.tickerSection}>
                <p>Pioneering the future of talent acquisition with</p>
                <div className={styles.tickerLogoContainer}>
                  {[
                    'Artificial Intelligence',
                    'Deep Learning',
                    'Predictive Analytics',
                    'Contextual NLP',
                    'Real-time Metrics',
                    'Automated Matching',
                    'Artificial Intelligence',
                    'Deep Learning',
                    'Predictive Analytics',
                  ].map((tech, i) => (
                    <div key={i} className={styles.tLogo}>
                      {tech}
                    </div>
                  ))}
                </div>
              </div>
            </RevealOnScroll>

            {/* Features Scroll Area */}
            <div className={styles.featureShowcase}>
              <RevealOnScroll>
                <div className={styles.featureRow}>
                  <div className={styles.featureText}>
                    <h2>Automated Precision Screening</h2>
                    <p>
                      Our language models dive deep into resumes, extracting not just keywords, but
                      contextual experience. Save countless hours and instantly uncover the top 1%
                      of applicants with pinpoint accuracy.
                    </p>
                  </div>
                  <div className={styles.featureVisual}>
                    <div className={styles.visualContentInner}>
                      <div className={styles.mockBarChart}>
                        <div
                          className={styles.mockBar}
                          style={{
                            height: '40%',
                            background: 'rgba(255,255,255,0.1)',
                            animationDelay: '0s',
                          }}
                        ></div>
                        <div
                          className={styles.mockBar}
                          style={{
                            height: '60%',
                            background: 'rgba(255,255,255,0.1)',
                            animationDelay: '0.2s',
                          }}
                        ></div>
                        <div
                          className={styles.mockBar}
                          style={{
                            height: '85%',
                            background: 'rgba(255,255,255,0.1)',
                            animationDelay: '0.4s',
                          }}
                        ></div>
                        <div
                          className={styles.mockBar}
                          style={{
                            height: '100%',
                            background: 'linear-gradient(180deg, #7b3bed, rgba(123,59,237,0.1))',
                            animationDelay: '0.6s',
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>

              <RevealOnScroll>
                <div className={`${styles.featureRow} ${styles.featureRowReverse}`}>
                  <div className={styles.featureText}>
                    <h2>Immersive AI Interviews</h2>
                    <p>
                      Conduct highly engaging, personalized first-round interviews entirely run by
                      our digital AI agents. Candidates experience real-time adaptability as the AI
                      tailors its questions based on their live responses.
                    </p>
                  </div>
                  <div className={styles.featureVisual}>
                    <div className={styles.visualContentInner} style={{ alignItems: 'center' }}>
                      <div className={styles.mockPulseCircle}></div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* Final CTA */}
            <RevealOnScroll>
              <div className={styles.finalCtaSection}>
                <h2>
                  Ready to transform
                  <br />
                  your workforce?
                </h2>
                <button
                  className={styles.btnCta}
                  onClick={() => (isLoggedIn ? setView('dashboard') : setShowLoginModal(true))}
                >
                  Start Hiring Now
                </button>
              </div>
            </RevealOnScroll>
          </div>
        )}

        {/* View 2: PROCESS / HOW IT WORKS */}
        {view === 'process' && (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>The AI Hiring Journey</h1>
              <p style={{ color: '#a1a1aa', fontSize: '1.1rem' }}>
                A flawless, unbiased, and instantaneous application process.
              </p>
            </div>
            <div className={styles.genericGrid}>
              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>📄</div>
                <h3 className={styles.infoTitle}>1. Document Upload</h3>
                <p className={styles.infoDesc}>
                  Upload your resume securely. Our AI instantly parses your history, extracting core
                  competencies without human bias.
                </p>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>⚡</div>
                <h3 className={styles.infoTitle}>2. AI Shortlisting</h3>
                <p className={styles.infoDesc}>
                  Behind the scenes, our neural networks cross-reference your skills with the job
                  requirements to generate a rapid alignment score.
                </p>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>🎥</div>
                <h3 className={styles.infoTitle}>3. AI Video Interview</h3>
                <p className={styles.infoDesc}>
                  Conduct your first round directly with our digital AI HR. It asks dynamic
                  behavioral and technical questions in real-time.
                </p>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>🤝</div>
                <h3 className={styles.infoTitle}>4. Final Match</h3>
                <p className={styles.infoDesc}>
                  The AI delivers a comprehensive performance report to the human recruiters.
                  Successful candidates get an instant offer!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* View 3: SECURITY & TRUST */}
        {view === 'trust' && (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Fairness & Integrity</h1>
              <p style={{ color: '#a1a1aa', fontSize: '1.1rem' }}>
                We enforce world-class safeguards during the AI interview round to ensure absolute
                meritocracy.
              </p>
            </div>
            <div className={styles.genericGrid}>
              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>👁️</div>
                <h3 className={styles.infoTitle}>Eye Gaze Tracking</h3>
                <p className={styles.infoDesc}>
                  Our AI deeply monitors your eye movements. If you're consistently reading off
                  notes or a secondary screen, the system flags it instantly.
                </p>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>🔒</div>
                <h3 className={styles.infoTitle}>Strict Window Lock</h3>
                <p className={styles.infoDesc}>
                  Navigating away from the interview tab or opening other applications will pause
                  the interview. Multiple violations auto-terminate the session.
                </p>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>🎙️</div>
                <h3 className={styles.infoTitle}>Voice Analysis</h3>
                <p className={styles.infoDesc}>
                  Advanced auditory filtering picks up if someone else is in the room whispering
                  answers, ensuring the voice perfectly matches yours.
                </p>
              </div>
              <div className={styles.infoCard}>
                <div className={styles.iconWrapper}>👤</div>
                <h3 className={styles.infoTitle}>Identity Verification</h3>
                <p className={styles.infoDesc}>
                  Your face is compared to your pre-verified identity frame by frame throughout the
                  entire call, ensuring no swappers take your place.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* View 4: DASHBOARD (OPEN ROLES) */}
        {view === 'dashboard' && (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Open Positions</h1>
              <p style={{ color: '#a1a1aa', fontSize: '1.1rem' }}>
                Select a role to instantly upload your resume and begin the AI evaluation.
              </p>
            </div>
            <div className={styles.jobsGrid}>
              {JOBS.map((job) => (
                <div
                  key={job.id}
                  className={`${styles.jobCard} ${job.colorClass}`}
                  onClick={() => {
                    setSelectedJob(job);
                    setFile(null);
                  }}
                >
                  <h2 className={styles.jobTitle}>{job.title}</h2>
                  <p className={styles.jobDesc}>{job.desc}</p>
                  <div className={styles.skillsContainer}>
                    {job.skills.map((skill) => (
                      <span key={skill} className={styles.skillPill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View 5: NEW CANDIDATE PORTAL */}
        {view === 'portal' && (
          <div className={styles.pageContainer}>
            <div className={styles.pageHeader} style={{ marginBottom: '3rem' }}>
              <h1 className={styles.pageTitle}>
                Welcome, {name ? name.split(' ')[0] : email.split('@')[0]}!
              </h1>
              <div
                style={{
                  display: 'inline-flex',
                  background: 'rgba(46, 204, 113, 0.15)',
                  border: '1px solid rgba(46, 204, 113, 0.4)',
                  color: '#38ef7d',
                  padding: '0.5rem 1rem',
                  borderRadius: '2rem',
                  marginTop: '1rem',
                  fontWeight: '600',
                }}
              >
                ✓ Highly Eligible for: {selectedJob?.title || 'Open Position'}
              </div>
            </div>

            <div className={styles.portalGrid}>
              {/* Analytics Card */}
              <div className={styles.portalCard}>
                <h2>Live Eligibility Analytics</h2>
                <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Real-time data parse from your recent upload against role requirements.
                </p>
                <div className={styles.anItem}>
                  <div className={styles.anLabel}>
                    <span>Resume Keyword Match</span>
                    <span>94%</span>
                  </div>
                  <div className={styles.anBarBg}>
                    <div
                      className={styles.anBarFill}
                      style={{
                        width: '94%',
                        background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
                      }}
                    />
                  </div>
                </div>
                <div className={styles.anItem}>
                  <div className={styles.anLabel}>
                    <span>Experience Requirements</span>
                    <span>100%</span>
                  </div>
                  <div className={styles.anBarBg}>
                    <div
                      className={styles.anBarFill}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(90deg, #11998e, #38ef7d)',
                      }}
                    />
                  </div>
                </div>
                <div className={styles.anItem}>
                  <div className={styles.anLabel}>
                    <span>Initial Screening Score</span>
                    <span>88%</span>
                  </div>
                  <div className={styles.anBarBg}>
                    <div
                      className={styles.anBarFill}
                      style={{
                        width: '88%',
                        background: 'linear-gradient(90deg, #b06ab3, #4568dc)',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Phase 1 Schedule */}
              <div
                className={styles.portalCard}
                style={{ display: 'flex', flexDirection: 'column' }}
              >
                <h2>Phase 1: AI Interview Round</h2>
                <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  You can give your technical interview anytime until the deadline date highlighted
                  below.
                </p>

                <MiniCalendar today={10} deadlineDay={15} monthLabel="This Week" />

                <button
                  className={styles.btnPrimaryDark}
                  style={{ marginTop: 'auto', padding: '1rem', fontSize: '1.05rem' }}
                  onClick={() => router.push('/meet')}
                >
                  Start AI Interview
                </button>
              </div>

              {/* Phase 2 Schedule */}
              <div className={styles.portalCard}>
                <h2>Phase 2: Final Main Round</h2>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    padding: '2rem',
                    borderRadius: '1rem',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    textAlign: 'center',
                    marginTop: '1rem',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Pending Evaluation</h3>
                  <p style={{ color: '#a1a1aa', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    You are selected for phase 2 and an email will be provided shortly for that
                    meeting once Phase 1 is officially cleared.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.loginModalCard}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button
                onClick={() => setShowLoginModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: '700' }}>
              Welcome to HireAI
            </h2>
            <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>Sign in to continue securely.</p>
            <button
              className={styles.btnPrimaryDark}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                width: '100%',
                background: '#fff',
                color: '#000',
                border: 'none',
              }}
              onClick={() => {
                setShowLoginModal(false);
                setEmail('user@google.com');
                setName('Google User');
                setIsLoggedIn(true);
                setView('dashboard');
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      )}

      {/* PROFILE ONBOARDING MODAL */}
      {showProfileModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.loginModalCard}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setEmail('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: '700' }}>
              Complete Profile
            </h2>
            <p style={{ color: '#a1a1aa', marginBottom: '2rem' }}>
              We need a few details to finalize your account.
            </p>
            <form onSubmit={handleProfileComplete}>
              <input
                type="text"
                required
                placeholder="Full Name"
                className={styles.inputField}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="tel"
                required
                placeholder="Phone Number"
                className={styles.inputField}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <button type="submit" className={styles.btnPrimaryDark}>
                Complete Sign Up
              </button>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD MODAL */}
      {selectedJob && view === 'dashboard' && (
        <div className={styles.modalOverlay}>
          <div className={styles.loginModalCard} style={{ maxWidth: '600px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              Apply for {selectedJob.title}
            </h2>
            <p style={{ color: '#8b949e', marginBottom: '2rem' }}>
              Submit your resume to get started.
            </p>

            <div className={styles.uploadBox}>
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                id="resumeUpload"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) setFile(e.target.files[0]);
                }}
              />
              <label htmlFor="resumeUpload" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
                <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>Upload Resume</div>
                <div style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>PDF, DOCX format</div>
              </label>
            </div>

            {file && (
              <div
                style={{
                  padding: '1rem',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '1rem',
                  marginBottom: '2rem',
                }}
              >
                Selected: <strong>{file.name}</strong>
              </div>
            )}

            <button className={styles.btnPrimaryDark} onClick={handleJobApplySubmit}>
              Submit & Track Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
