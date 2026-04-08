'use client';

import { useState } from 'react';
import styles from './page.module.css';

const INITIAL_JOBS: any[] = [
  {
    id: 1,
    title: 'AI Research Scientist',
    desc: 'We need an expert in Large Language Models to help push our boundaries. You will fine-tune models, devise new architectures, and run experiments at scale.',
    skills: ['Python', 'PyTorch', 'Transformers', 'CUDA'],
  },
  {
    id: 2,
    title: 'Senior Frontend Engineer',
    desc: 'Looking for an artist of the browser. Create stunning, physics-based micro-animations and manage complex React states for our next generation interfaces.',
    skills: ['React', 'Next.js', 'TypeScript', 'Animations'],
  },
  {
    id: 3,
    title: 'Backend Systems Architect',
    desc: 'Scale our infrastructure to handle millions of websocket connections. Low latency, high throughput, and system reliability are your primary goals.',
    skills: ['Go', 'Node.js', 'Kubernetes', 'Redis'],
  },
  {
    id: 4,
    title: 'Product Designer',
    desc: 'Craft magical experiences that combine cutting-edge AI features with intuitive, human-centered interfaces. Your designs will guide millions of users.',
    skills: ['Figma', 'Prototyping', 'UX Research', 'Framer'],
  },
];

const MOCK_CANDIDATES = {
  1: {
    total: 45,
    verified: 12,
    passedInterview: 4,
    candidates: [
      {
        name: 'Rahul Sharma',
        email: 'rahul@gmail.com',
        phone: '9876543210',
        resume: 'rahul_res.pdf',
        status: 'passed',
      },
      {
        name: 'Aman Verma',
        email: 'aman@gmail.com',
        phone: '9123456780',
        resume: 'aman_res.pdf',
        status: 'verified',
      },
    ],
  },
  2: {
    total: 80,
    verified: 20,
    passedInterview: 8,
    candidates: [
      {
        name: 'Jatin Roy',
        email: 'jatin@gmail.com',
        phone: '9898989898',
        resume: 'jatin_res.pdf',
        status: 'passed',
      },
      {
        name: 'Kavya Patel',
        email: 'kavya@gmail.com',
        phone: '9123987456',
        resume: 'kavya_res.pdf',
        status: 'verified',
      },
    ],
  },
  3: {
    total: 110,
    verified: 35,
    passedInterview: 12,
    candidates: [
      {
        name: 'Sneha Nair',
        email: 'sneha@gmail.com',
        phone: '9000100020',
        resume: 'sneha_res.pdf',
        status: 'passed',
      },
    ],
  },
  4: {
    total: 60,
    verified: 15,
    passedInterview: 3,
    candidates: [
      {
        name: 'Priya Singh',
        email: 'priya@gmail.com',
        phone: '9988776655',
        resume: 'priya_res.pdf',
        status: 'verified',
      },
    ],
  },
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // "dashboard", "candidates", "settings", "positions"
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [selectedJob, setSelectedJob] = useState(INITIAL_JOBS[0].id);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchVerified, setSearchVerified] = useState('');
  const [searchCrackers, setSearchCrackers] = useState('');
  const [masterSearch, setMasterSearch] = useState('');
  const [masterRoleFilter, setMasterRoleFilter] = useState('All');
  const [masterStatusFilter, setMasterStatusFilter] = useState('All');
  const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false);
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [themeMode, setThemeMode] = useState('dark');
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  // Add/Edit Position Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [editingJobId, setEditingJobId] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSkills, setNewSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // AI Evaluation Profile
  const [minScore, setMinScore] = useState(80);
  const [evalDesc, setEvalDesc] = useState('');
  const [coreSkills, setCoreSkills] = useState<string[]>([]);
  const [importantSkills, setImportantSkills] = useState<string[]>([]);
  const [bonusSkills, setBonusSkills] = useState<string[]>([]);
  const [coreSkillInput, setCoreSkillInput] = useState('');
  const [importantSkillInput, setImportantSkillInput] = useState('');
  const [bonusSkillInput, setBonusSkillInput] = useState('');

  const handleAddSkillGeneral = (
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    setInput: any,
    list: string[],
    setList: any
  ) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      if (!list.includes(input.trim())) {
        setList([...list, input.trim()]);
      }
      setInput('');
    }
  };

  const removeSkillGeneral = (skill: string, list: string[], setList: any) => {
    setList(list.filter((s) => s !== skill));
  };

  const openEditModal = (jobId: number, step: number) => {
    const jobToEdit = jobs.find((j) => j.id === jobId);
    if (jobToEdit) {
      setEditingJobId(jobId);
      setNewTitle(jobToEdit.title || '');
      setNewDesc(jobToEdit.desc || '');
      setNewSkills(jobToEdit.skills || []);

      const evalData = jobToEdit.evaluationData || {};
      setMinScore(evalData.minimumScore || 80);
      setEvalDesc(evalData.jobDescription || '');

      setCoreSkills(evalData.coreSkills || evalData.skills || []);
      setImportantSkills(evalData.importantSkills || []);
      setBonusSkills(evalData.bonusSkills || []);

      setSkillInput('');
      setCoreSkillInput('');
      setImportantSkillInput('');
      setBonusSkillInput('');

      setAddStep(step);
      setShowAddModal(true);
    }
  };

  const handleSavePosition = () => {
    if (newTitle.trim()) {
      const evaluationData = {
        minimumScore: minScore,
        skills: [...coreSkills, ...importantSkills, ...bonusSkills],
        coreSkills,
        importantSkills,
        bonusSkills,
        jobDescription: evalDesc || newDesc,
      };

      if (editingJobId) {
        setJobs(
          jobs.map((j) =>
            j.id === editingJobId
              ? {
                  ...j,
                  title: newTitle,
                  desc: newDesc,
                  skills: newSkills,
                  evaluationData,
                }
              : j
          )
        );
      } else {
        setJobs([
          ...jobs,
          {
            id: Date.now(),
            title: newTitle,
            desc: newDesc,
            skills: newSkills,
            evaluationData,
          },
        ]);
      }
      setShowAddModal(false);
      setEditingJobId(null);
    }
  };

  const activeJob = jobs.find((j) => j.id === selectedJob) || jobs[0];
  const jobData = MOCK_CANDIDATES[selectedJob as keyof typeof MOCK_CANDIDATES] || {
    total: 0,
    verified: 0,
    passedInterview: 0,
    candidates: [],
  };

  const allCandidates = Object.entries(MOCK_CANDIDATES).flatMap(([jobId, job]) =>
    job.candidates.map((cand) => ({ ...cand, jobId: Number(jobId) }))
  );

  const filteredMasterCandidates = allCandidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(masterSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(masterSearch.toLowerCase());

    const matchesRole = masterRoleFilter === 'All' || c.jobId === Number(masterRoleFilter);
    const candStatus = c.status === 'passed' ? 'passed' : 'verified';

    let matchesStatus = true;
    if (masterStatusFilter === 'Verified') matchesStatus = candStatus === 'verified';
    if (masterStatusFilter === 'Passed') matchesStatus = candStatus === 'passed';

    return matchesSearch && matchesRole && matchesStatus;
  });

  const filteredVerified = jobData.candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchVerified.toLowerCase()) ||
      c.email.toLowerCase().includes(searchVerified.toLowerCase())
  );

  const filteredCrackers = jobData.candidates.filter(
    (c) =>
      c.status === 'passed' &&
      (c.name.toLowerCase().includes(searchCrackers.toLowerCase()) ||
        c.email.toLowerCase().includes(searchCrackers.toLowerCase()))
  );

  // Mouse interaction state for the background blob parallax effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 40;
    const y = (e.clientY / window.innerHeight - 0.5) * 40;
    setMousePos({ x, y });
  };

  return (
    <div
      className={`${styles.container} ${themeMode === 'light' ? styles.lightMode : ''}`}
      onMouseMove={handleMouseMove}
    >
      <div className={styles.dustOverlay} />
      <div
        className={styles.liquidBlob}
        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
      />
      <div className={styles.blurBase} />

      <div className={styles.layoutWrapper}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarLogo}>
            HireAI{' '}
            <span style={{ color: '#8b949e', fontSize: '0.8rem', fontWeight: 'normal' }}>
              Admin
            </span>
          </div>
          <nav className={styles.sidebarNav}>
            <button
              className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'candidates' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('candidates')}
            >
              Candidates
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'positions' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('positions')}
            >
              Edit Positions
            </button>
            <button
              className={`${styles.navItem} ${activeTab === 'settings' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className={styles.mainContent}>
          {/* CONDITIONAL RENDERING BASED ON TAB */}

          {activeTab === 'dashboard' && (
            <>
              {/* HEADER */}
              <header className={styles.header}>
                <div>
                  <h1 className={styles.title}>Overview</h1>
                  <div className={styles.subtitle}>Activity and metrics</div>
                </div>
                <div>
                  <div className={styles.customSelectWrapper}>
                    <div
                      className={styles.jobSelect}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      {activeJob.title}
                    </div>
                    {isDropdownOpen && (
                      <div className={styles.dropdownMenu}>
                        {jobs.map((job) => (
                          <div
                            key={job.id}
                            className={`${styles.dropdownItem} ${selectedJob === job.id ? styles.dropdownItemActive : ''}`}
                            onClick={() => {
                              setSelectedJob(job.id);
                              setIsDropdownOpen(false);
                            }}
                          >
                            {job.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </header>

              {/* ================= STATS WIDGETS ================= */}
              <section className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Resumes Submitted</div>
                  <div className={styles.statValue}>{jobData.total}</div>
                  <div className={styles.statTrend} style={{ color: '#38ef7d' }}>
                    +12% this week
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Verified by AI</div>
                  <div className={styles.statValue}>{jobData.verified}</div>
                  <div className={styles.statTrend} style={{ color: '#38ef7d' }}>
                    +5% this week
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>AI Interview Crackers</div>
                  <div className={styles.statValue}>{jobData.passedInterview}</div>
                  <div className={styles.statTrend} style={{ color: '#00f2fe' }}>
                    Top 10%
                  </div>
                </div>
              </section>

              <div className={styles.masonryGrid}>
                {/* ================= CANDIDATES TABLE ================= */}
                <section className={styles.section} style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.tableHeader}>
                    <h2 className={styles.sectionTitle}>AI Verified Candidates</h2>
                    <div className={styles.tableActions}>
                      <input
                        type="text"
                        placeholder="Search candidate name or email..."
                        className={styles.searchInput}
                        value={searchVerified}
                        onChange={(e) => setSearchVerified(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Status</th>
                          <th>Resume</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVerified.length > 0 ? (
                          filteredVerified.map((cand, idx) => (
                            <tr key={idx}>
                              <td>
                                <div className={styles.userCell}>
                                  <div className={styles.avatar}>{cand.name.charAt(0)}</div>
                                  <span className={styles.userName}>{cand.name}</span>
                                </div>
                              </td>
                              <td>{cand.email}</td>
                              <td>{cand.phone}</td>
                              <td>
                                {cand.status === 'passed' ? (
                                  <span style={{ color: '#00f2fe' }}>★ Passed</span>
                                ) : (
                                  <span style={{ color: '#a1a1aa' }}>Verified</span>
                                )}
                              </td>
                              <td>
                                <button className={styles.actionBtn}>View {cand.resume}</button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              style={{ textAlign: 'center', padding: '2rem', color: '#a1a1aa' }}
                            >
                              No verified candidates found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* ================= AI INTERVIEW CRACKERS TABLE ================= */}
                <section className={styles.section} style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.tableHeader}>
                    <h2 className={styles.sectionTitle} style={{ color: '#00f2fe' }}>
                      AI Interview Crackers
                    </h2>
                    <div className={styles.tableActions}>
                      <input
                        type="text"
                        placeholder="Search crackers..."
                        className={styles.searchInput}
                        value={searchCrackers}
                        onChange={(e) => setSearchCrackers(e.target.value)}
                      />
                    </div>
                  </div>
                  <div
                    className={styles.tableContainer}
                    style={{
                      borderColor: 'rgba(0, 242, 254, 0.3)',
                      boxShadow: '0 0 20px rgba(0,242,254,0.1)',
                    }}
                  >
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCrackers.length > 0 ? (
                          filteredCrackers.map((cand, idx) => (
                            <tr key={idx} style={{ background: 'rgba(0, 242, 254, 0.02)' }}>
                              <td>
                                <div className={styles.userCell}>
                                  <div
                                    className={styles.avatar}
                                    style={{
                                      background: 'linear-gradient(135deg, #00f2fe, #4facfe)',
                                    }}
                                  >
                                    {cand.name.charAt(0)}
                                  </div>
                                  <span className={styles.userName}>{cand.name}</span>
                                </div>
                              </td>
                              <td>{cand.email}</td>
                              <td>{cand.phone}</td>
                              <td>
                                <a
                                  href={`mailto:${cand.email}?subject=Job Offer from HireAI`}
                                  style={{ textDecoration: 'none' }}
                                >
                                  <button
                                    className={styles.actionBtn}
                                    style={{
                                      background: 'rgba(0, 242, 254, 0.1)',
                                      borderColor: 'rgba(0, 242, 254, 0.5)',
                                    }}
                                  >
                                    Mail to
                                  </button>
                                </a>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              style={{ textAlign: 'center', padding: '2rem', color: '#a1a1aa' }}
                            >
                              No interview crackers found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </>
          )}

          {activeTab === 'candidates' && (
            <>
              <header className={styles.header}>
                <div>
                  <h1 className={styles.title}>Master Talent Pool</h1>
                  <div className={styles.subtitle}>All Candidates & Applicants</div>
                </div>
              </header>
              <section className={styles.section}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableActions} style={{ width: '100%' }}>
                    <input
                      type="text"
                      placeholder="Global keyword search..."
                      className={styles.searchInput}
                      value={masterSearch}
                      onChange={(e) => setMasterSearch(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <div className={styles.customSelectWrapper}>
                      <div
                        className={styles.filterSelect}
                        onClick={() => {
                          setIsRoleFilterOpen(!isRoleFilterOpen);
                          setIsStatusFilterOpen(false);
                        }}
                      >
                        {masterRoleFilter === 'All'
                          ? 'All Roles'
                          : jobs.find((j) => j.id === Number(masterRoleFilter))?.title}
                      </div>
                      {isRoleFilterOpen && (
                        <div className={styles.dropdownMenu}>
                          <div
                            className={`${styles.dropdownItem} ${masterRoleFilter === 'All' ? styles.dropdownItemActive : ''}`}
                            onClick={() => {
                              setMasterRoleFilter('All');
                              setIsRoleFilterOpen(false);
                            }}
                          >
                            All Roles
                          </div>
                          {jobs.map((job) => (
                            <div
                              key={job.id}
                              className={`${styles.dropdownItem} ${masterRoleFilter === String(job.id) ? styles.dropdownItemActive : ''}`}
                              onClick={() => {
                                setMasterRoleFilter(String(job.id));
                                setIsRoleFilterOpen(false);
                              }}
                            >
                              {job.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={styles.customSelectWrapper}>
                      <div
                        className={styles.filterSelect}
                        onClick={() => {
                          setIsStatusFilterOpen(!isStatusFilterOpen);
                          setIsRoleFilterOpen(false);
                        }}
                      >
                        {masterStatusFilter === 'All'
                          ? 'All Statuses'
                          : masterStatusFilter === 'Verified'
                            ? 'AI Verified'
                            : 'Interview Passed'}
                      </div>
                      {isStatusFilterOpen && (
                        <div className={styles.dropdownMenu} style={{ right: 0, left: 'auto' }}>
                          <div
                            className={`${styles.dropdownItem} ${masterStatusFilter === 'All' ? styles.dropdownItemActive : ''}`}
                            onClick={() => {
                              setMasterStatusFilter('All');
                              setIsStatusFilterOpen(false);
                            }}
                          >
                            All Statuses
                          </div>
                          <div
                            className={`${styles.dropdownItem} ${masterStatusFilter === 'Verified' ? styles.dropdownItemActive : ''}`}
                            onClick={() => {
                              setMasterStatusFilter('Verified');
                              setIsStatusFilterOpen(false);
                            }}
                          >
                            AI Verified
                          </div>
                          <div
                            className={`${styles.dropdownItem} ${masterStatusFilter === 'Passed' ? styles.dropdownItemActive : ''}`}
                            onClick={() => {
                              setMasterStatusFilter('Passed');
                              setIsStatusFilterOpen(false);
                            }}
                          >
                            Interview Passed
                          </div>
                        </div>
                      )}
                    </div>
                    <button className={styles.actionBtn}>Bulk Action</button>
                  </div>
                </div>

                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMasterCandidates.map((cand, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className={styles.userCell}>
                              <div className={styles.avatar}>{cand.name.charAt(0)}</div>
                              <span className={styles.userName}>{cand.name}</span>
                            </div>
                          </td>
                          <td>{cand.email}</td>
                          <td>{cand.phone}</td>
                          <td>
                            {cand.status === 'passed' ? (
                              <span style={{ color: '#00f2fe' }}>★ Passed</span>
                            ) : (
                              <span style={{ color: '#a1a1aa' }}>Verified</span>
                            )}
                          </td>
                          <td>
                            <a
                              href={`mailto:${cand.email}?subject=Regarding your application at HireAI`}
                              style={{ textDecoration: 'none' }}
                            >
                              <button
                                className={styles.actionBtn}
                                style={{
                                  background: 'rgba(0, 242, 254, 0.1)',
                                  borderColor: 'rgba(0, 242, 254, 0.5)',
                                }}
                              >
                                Mail to
                              </button>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {activeTab === 'positions' && (
            <>
              <header className={styles.header}>
                <div>
                  <h1 className={styles.title}>Position Management</h1>
                  <div className={styles.subtitle}>Add, edit, or remove open roles efficiently</div>
                </div>
                <button
                  className={styles.actionBtn}
                  style={{
                    background: '#00f2fe',
                    color: '#000',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 'bold',
                  }}
                  onClick={() => {
                    setEditingJobId(null);
                    setNewTitle('');
                    setNewDesc('');
                    setNewSkills([]);
                    setSkillInput('');
                    setAddStep(1);
                    setMinScore(80);
                    setEvalDesc('');
                    setCoreSkills([]);
                    setImportantSkills([]);
                    setBonusSkills([]);
                    setShowAddModal(true);
                  }}
                >
                  + Add New Position
                </button>
              </header>
              <section
                className={styles.section}
                style={{ background: 'transparent', border: 'none', padding: 0 }}
              >
                <div className={styles.positionsGrid}>
                  {jobs.map((job) => (
                    <div key={job.id} className={styles.positionCard}>
                      <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#fff', fontWeight: 600 }}>
                        {job.title}
                      </h3>
                      {job.desc && (
                        <p style={{ fontSize: '0.9rem', color: '#a1a1aa', margin: '0.5rem 0' }}>
                          {job.desc}
                        </p>
                      )}
                      {job.skills && job.skills.length > 0 && (
                        <div
                          className={styles.skillsContainerInline}
                          style={{ marginTop: '0.5rem' }}
                        >
                          {job.skills.map((s: string) => (
                            <span
                              key={s}
                              className={styles.skillPill}
                              style={{
                                pointerEvents: 'none',
                                background: 'rgba(255,255,255,0.05)',
                              }}
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.5rem',
                          marginTop: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          className={styles.actionBtn}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => openEditModal(job.id, 1)}
                        >
                          ✏️ Edit Front Card
                        </button>
                        <button
                          className={styles.actionBtn}
                          style={{
                            borderColor: 'rgba(0, 242, 254, 0.5)',
                            color: '#00f2fe',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                          }}
                          onClick={() => openEditModal(job.id, 2)}
                        >
                          🤖 Edit AI Analysis
                        </button>
                        <div style={{ flex: 1 }}></div>
                        <button
                          className={styles.deleteBtn}
                          style={{ padding: '0.4rem 0.8rem' }}
                          onClick={() => {
                            if (jobs.length > 1) {
                              setJobs(jobs.filter((j) => j.id !== job.id));
                              if (selectedJob === job.id) setSelectedJob(jobs[0].id);
                            } else {
                              alert('Cannot delete the last position.');
                            }
                          }}
                          title="Remove Position"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <header className={styles.header}>
                <div>
                  <h1 className={styles.title}>System Settings</h1>
                  <div className={styles.subtitle}>Platform Configuration</div>
                </div>
              </header>
              <div className={styles.settingsGrid}>
                <div className={styles.settingsCard}>
                  <h3>Appearance Theme</h3>
                  <p>Customize the admin portal color scheme.</p>
                  <div className={styles.customSelectWrapper} style={{ minWidth: '220px' }}>
                    <div
                      className={styles.filterSelect}
                      onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                    >
                      {themeMode === 'dark' ? 'Dark Mode (Default)' : 'Light Mode'}
                    </div>
                    {isThemeDropdownOpen && (
                      <div className={styles.dropdownMenu}>
                        <div
                          className={`${styles.dropdownItem} ${themeMode === 'dark' ? styles.dropdownItemActive : ''}`}
                          onClick={() => {
                            setThemeMode('dark');
                            setIsThemeDropdownOpen(false);
                          }}
                        >
                          Dark Mode (Default)
                        </div>
                        <div
                          className={`${styles.dropdownItem} ${themeMode === 'light' ? styles.dropdownItemActive : ''}`}
                          onClick={() => {
                            setThemeMode('light');
                            setIsThemeDropdownOpen(false);
                          }}
                        >
                          Light Mode
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.settingsCard}>
                  <h3>Team Access</h3>
                  <p>Manage who can view and edit candidate progressing.</p>
                  <button
                    className={styles.actionBtn}
                    style={
                      themeMode === 'dark'
                        ? { background: '#00f2fe', color: '#000' }
                        : { background: '#0ea5e9', color: '#fff' }
                    }
                  >
                    + Invite Member
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div
            className={styles.loginModalCard}
            style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: 0 }}>
                {addStep === 1
                  ? editingJobId
                    ? 'Edit Position'
                    : 'Add New Position'
                  : 'AI Evaluation Settings'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
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

            {addStep === 1 ? (
              <>
                <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                  <label>Job Heading</label>
                  <input
                    type="text"
                    className={styles.inputField}
                    placeholder="e.g. Senior Machine Learning Engineer"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                  <label>Description</label>
                  <textarea
                    className={styles.inputField}
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    placeholder="Describe the responsibilities and requirements..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '2rem' }}>
                  <label>
                    General Skills{' '}
                    <span style={{ color: '#8b949e', fontSize: '0.8rem', fontWeight: 'normal' }}>
                      (Type a word and press Enter)
                    </span>
                  </label>
                  <div className={styles.skillInputWrapper}>
                    <div className={styles.skillsContainerInline}>
                      {newSkills.map((skill) => (
                        <span key={skill} className={styles.skillPill}>
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkillGeneral(skill, newSkills, setNewSkills)}
                            className={styles.removeSkillBtn}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className={styles.skillInlineAdd}
                        placeholder="Type words..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) =>
                          handleAddSkillGeneral(
                            e,
                            skillInput,
                            setSkillInput,
                            newSkills,
                            setNewSkills
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.btnPrimaryDark}
                  style={{ width: '100%' }}
                  onClick={() => setAddStep(2)}
                >
                  Next: Configure AI Evaluation →
                </button>
              </>
            ) : (
              <>
                <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                  <label>Minimum Score Threshold (0-100)</label>
                  <input
                    type="number"
                    className={styles.inputField}
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                  />
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                  <label>
                    Core Skills{' '}
                    <span style={{ color: '#8b949e', fontSize: '0.8rem', fontWeight: 'normal' }}>
                      (Must have)
                    </span>
                  </label>
                  <div className={styles.skillInputWrapper}>
                    <div className={styles.skillsContainerInline}>
                      {coreSkills.map((skill) => (
                        <span
                          key={skill}
                          className={styles.skillPill}
                          style={{ borderColor: 'rgba(255, 59, 48, 0.5)' }}
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkillGeneral(skill, coreSkills, setCoreSkills)}
                            className={styles.removeSkillBtn}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className={styles.skillInlineAdd}
                        placeholder="Add core skill..."
                        value={coreSkillInput}
                        onChange={(e) => setCoreSkillInput(e.target.value)}
                        onKeyDown={(e) =>
                          handleAddSkillGeneral(
                            e,
                            coreSkillInput,
                            setCoreSkillInput,
                            coreSkills,
                            setCoreSkills
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                  <label>
                    Important Skills{' '}
                    <span style={{ color: '#8b949e', fontSize: '0.8rem', fontWeight: 'normal' }}>
                      (Good to have)
                    </span>
                  </label>
                  <div className={styles.skillInputWrapper}>
                    <div className={styles.skillsContainerInline}>
                      {importantSkills.map((skill) => (
                        <span
                          key={skill}
                          className={styles.skillPill}
                          style={{ borderColor: 'rgba(255, 149, 0, 0.5)' }}
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() =>
                              removeSkillGeneral(skill, importantSkills, setImportantSkills)
                            }
                            className={styles.removeSkillBtn}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className={styles.skillInlineAdd}
                        placeholder="Add important skill..."
                        value={importantSkillInput}
                        onChange={(e) => setImportantSkillInput(e.target.value)}
                        onKeyDown={(e) =>
                          handleAddSkillGeneral(
                            e,
                            importantSkillInput,
                            setImportantSkillInput,
                            importantSkills,
                            setImportantSkills
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
                  <label>
                    Bonus Skills{' '}
                    <span style={{ color: '#8b949e', fontSize: '0.8rem', fontWeight: 'normal' }}>
                      (Nice to have)
                    </span>
                  </label>
                  <div className={styles.skillInputWrapper}>
                    <div className={styles.skillsContainerInline}>
                      {bonusSkills.map((skill) => (
                        <span
                          key={skill}
                          className={styles.skillPill}
                          style={{ borderColor: 'rgba(46, 204, 113, 0.5)' }}
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkillGeneral(skill, bonusSkills, setBonusSkills)}
                            className={styles.removeSkillBtn}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className={styles.skillInlineAdd}
                        placeholder="Add bonus skill..."
                        value={bonusSkillInput}
                        onChange={(e) => setBonusSkillInput(e.target.value)}
                        onKeyDown={(e) =>
                          handleAddSkillGeneral(
                            e,
                            bonusSkillInput,
                            setBonusSkillInput,
                            bonusSkills,
                            setBonusSkills
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginBottom: '2rem' }}>
                  <label>
                    Evaluation Instructions{' '}
                    <span style={{ color: '#8b949e', fontSize: '0.8rem', fontWeight: 'normal' }}>
                      (Passed to AI)
                    </span>
                  </label>
                  <textarea
                    className={styles.inputField}
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder={
                      newDesc || 'Describe what the AI should focus on during evaluations...'
                    }
                    value={evalDesc}
                    onChange={(e) => setEvalDesc(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    className={styles.btnPrimaryDark}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    onClick={() => setAddStep(1)}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimaryDark}
                    style={{ flex: 2 }}
                    onClick={handleSavePosition}
                  >
                    Publish Position
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
