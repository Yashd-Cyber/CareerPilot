import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  BookOpen,
  Briefcase,
  FileText,
  Gauge,
  LogOut,
  MessageSquareText,
  Sparkles,
} from 'lucide-react';
import { BrowserRouter, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const queryClient = new QueryClient();

type User = {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  isActive?: boolean;
};

type AppContextValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message ?? 'Request failed.');
  }
  return payload as T;
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await api<{ user: User }>('/api/auth/me');
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(() => ({ user, loading, refresh, logout }), [user, loading]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('AppContext missing');
  }
  return context;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<StudentDashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/career-goals" element={<CareerGoalsPage />} />
              <Route path="/assessments" element={<AssessmentPage />} />
              <Route path="/roadmaps" element={<RoadmapPage />} />
              <Route path="/resumes" element={<ResumePage />} />
              <Route path="/job-analysis" element={<JobAnalysisPage />} />
              <Route path="/interviews" element={<InterviewPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function ProtectedLayout() {
  const { user, loading, logout } = useAppContext();
  const navigate = useNavigate();

  if (loading) {
    return <div className="page-shell padded">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="logo">CP</div>
          <div>
            <strong>CareerPilot AI</strong>
            <span>{user.role === 'ADMIN' ? 'Admin Console' : 'Student Workspace'}</span>
          </div>
        </div>

        <nav className="nav-list">
          {user.role === 'ADMIN' ? (
            <NavLink to="/admin">Admin dashboard</NavLink>
          ) : (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/profile">Profile</NavLink>
              <NavLink to="/career-goals">Career goals</NavLink>
              <NavLink to="/assessments">Skill assessment</NavLink>
              <NavLink to="/roadmaps">Roadmap</NavLink>
              <NavLink to="/resumes">Resume analysis</NavLink>
              <NavLink to="/job-analysis">Job analysis</NavLink>
              <NavLink to="/interviews">Mock interview</NavLink>
              <NavLink to="/analytics">Analytics</NavLink>
            </>
          )}
        </nav>

        <div className="user-panel">
          <div>
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </div>
          <button
            type="button"
            className="button ghost"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="content-panel">
        <Routes>
          <Route path="/dashboard" element={<StudentDashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/career-goals" element={<CareerGoalsPage />} />
          <Route path="/assessments" element={<AssessmentPage />} />
          <Route path="/roadmaps" element={<RoadmapPage />} />
          <Route path="/resumes" element={<ResumePage />} />
          <Route path="/job-analysis" element={<JobAnalysisPage />} />
          <Route path="/interviews" element={<InterviewPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}

function LandingPage() {
  const { user } = useAppContext();

  return (
    <div className="landing-page">
      <header className="topbar">
        <div className="brand-row">
          <div className="logo">CP</div>
          <strong>CareerPilot AI</strong>
        </div>
        <div className="nav-actions">
          {user ? (
            <NavLink to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} className="button primary">
              Open workspace
            </NavLink>
          ) : (
            <>
              <NavLink to="/login" className="button ghost">Student login</NavLink>
              <NavLink to="/admin-login" className="button ghost">Admin login</NavLink>
              <NavLink to="/register" className="button primary">Create account</NavLink>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div>
          <span className="eyebrow">AI Career Roadmap + Mock Interview Platform</span>
          <h1>Build a career plan that adapts to your skills and goals.</h1>
          <p>
            CareerPilot AI helps students map their path, monitor skill gaps, upload resumes,
            assess job fit, and practice interviews with real Gemini-powered insights.
          </p>
          <div className="cta-row">
            <NavLink to="/register" className="button primary large">Get started</NavLink>
            <NavLink to="/login" className="button secondary large">Student login</NavLink>
          </div>
        </div>
        <div className="hero-panel card">
          <div className="metric-row">
            <div><span>Roadmaps</span><strong>AI-guided</strong></div>
            <div><span>Resume review</span><strong>Gemini</strong></div>
          </div>
          <div className="mini-grid">
            <div className="mini-card"><Sparkles size={18} /> Career goals</div>
            <div className="mini-card"><Gauge size={18} /> Skill assessment</div>
            <div className="mini-card"><Briefcase size={18} /> Job match</div>
            <div className="mini-card"><MessageSquareText size={18} /> Mock interviews</div>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <FeatureCard icon={<BookOpen size={20} />} title="Career roadmap" text="Set your goal and get a measurable path to improve the right skills." />
        <FeatureCard icon={<FileText size={20} />} title="Resume analysis" text="Extract and review resume content with actionable suggestions." />
        <FeatureCard icon={<BarChart3 size={20} />} title="Progress analytics" text="Track milestones, assessments, and interview performance over time." />
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="card feature-card">
      <div className="icon-wrap">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const { refresh } = useAppContext();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await refresh();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register.');
    }
  };

  return (
    <AuthLayout title="Create your CareerPilot account" subtitle="Start your personal roadmap and interview practice.">
      <form className="stack-form" onSubmit={onSubmit}>
        <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password (8+ characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="alert error">{error}</p>}
        <button type="submit" className="button primary">Register</button>
        <p className="muted-link">Already have an account? <NavLink to="/login">Log in</NavLink></p>
      </form>
    </AuthLayout>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAppContext();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/auth/login', { method: 'POST', body: JSON.stringify(form) });
      await refresh();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in.');
    }
  };

  return (
    <AuthLayout title="Student login" subtitle="Continue your roadmap and interview journey.">
      <form className="stack-form" onSubmit={onSubmit}>
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="alert error">{error}</p>}
        <button type="submit" className="button primary">Login</button>
        <p className="muted-link">Need an account? <NavLink to="/register">Register</NavLink></p>
      </form>
    </AuthLayout>
  );
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAppContext();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/auth/admin-login', { method: 'POST', body: JSON.stringify(form) });
      await refresh();
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Admin login failed.');
    }
  };

  return (
    <AuthLayout title="Admin login" subtitle="Secure platform access for administrators.">
      <form className="stack-form" onSubmit={onSubmit}>
        <input type="email" placeholder="Admin email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="alert error">{error}</p>}
        <button type="submit" className="button primary">Log in as admin</button>
      </form>
    </AuthLayout>
  );
}

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div className="brand-row auth-brand">
          <div className="logo">CP</div>
          <div>
            <strong>CareerPilot AI</strong>
          </div>
        </div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

function StudentDashboardPage() {
  const { user } = useAppContext();
  const { data } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api<{ metrics: any }>('/api/analytics'),
  });

  const metrics = data?.metrics ?? { totalMilestones: 0, completedMilestones: 0, progressPct: 0, assessmentsCompleted: 0, interviewAttempts: 0, averageInterviewScore: 0 };

  return (
    <div className="page-section">
      <h2>Welcome back, {user?.name}</h2>
      <div className="stats-grid">
        <StatCard label="Roadmap progress" value={`${metrics.progressPct}%`} accent="indigo" />
        <StatCard label="Assessments" value={metrics.assessmentsCompleted} accent="navy" />
        <StatCard label="Interviews" value={metrics.interviewAttempts} accent="green" />
        <StatCard label="Average score" value={`${metrics.averageInterviewScore}%`} accent="amber" />
      </div>

      <div className="two-col">
        <div className="card">
          <h3>What you can do next</h3>
          <ul className="check-list">
            <li>Update your profile and select a target career</li>
            <li>Complete a skill assessment</li>
            <li>Generate a personalized roadmap</li>
            <li>Upload your resume and analyze job descriptions</li>
            <li>Practice mock interviews and review feedback</li>
          </ul>
        </div>
        <div className="card">
          <h3>Quick access</h3>
          <div className="quick-links">
            <NavLink to="/profile">Profile</NavLink>
            <NavLink to="/roadmaps">Roadmap</NavLink>
            <NavLink to="/interviews">Interview</NavLink>
            <NavLink to="/analytics">Analytics</NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage() {
  const [form, setForm] = useState({ education: '', experienceLevel: 'Beginner', currentSkills: 'JavaScript, React', preferredCareer: 'Frontend Developer', availableStudyTime: '5 hours/week', professionalGoals: '' });
  const [status, setStatus] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          currentSkills: form.currentSkills.split(',').map((item) => item.trim()).filter(Boolean),
          careerInterests: ['Productivity', 'Problem solving'],
        }),
      });
      setStatus('Profile saved successfully.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to save profile.');
    }
  };

  return (
    <div className="page-section">
      <h2>Profile & account settings</h2>
      <form className="stack-form card" onSubmit={onSubmit}>
        <div className="grid-2">
          <input placeholder="Education" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} />
          <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
        <div className="grid-2">
          <input placeholder="Current skills" value={form.currentSkills} onChange={(e) => setForm({ ...form, currentSkills: e.target.value })} />
          <select value={form.preferredCareer} onChange={(e) => setForm({ ...form, preferredCareer: e.target.value })}>
            <option>Frontend Developer</option>
            <option>Backend Developer</option>
            <option>Full-Stack Developer</option>
            <option>Data Analyst</option>
            <option>Data Scientist</option>
            <option>Machine Learning Engineer</option>
            <option>DevOps Engineer</option>
            <option>Cybersecurity Analyst</option>
          </select>
        </div>
        <input placeholder="Available study time" value={form.availableStudyTime} onChange={(e) => setForm({ ...form, availableStudyTime: e.target.value })} />
        <textarea placeholder="Professional goals" value={form.professionalGoals} onChange={(e) => setForm({ ...form, professionalGoals: e.target.value })} />
        {status && <p className="alert success">{status}</p>}
        <button type="submit" className="button primary">Save profile</button>
      </form>
    </div>
  );
}

function CareerGoalsPage() {
  const goals = ['Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'Data Analyst', 'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer', 'Cybersecurity Analyst'];
  const [selected, setSelected] = useState(goals[0]);
  const [status, setStatus] = useState('');

  const saveGoal = async () => {
    try {
      await api('/api/career-goals/set', { method: 'POST', body: JSON.stringify({ customCareerGoal: selected }) });
      setStatus('Career goal updated.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to update goal.');
    }
  };

  return (
    <div className="page-section">
      <h2>Career goal selection</h2>
      <div className="goal-grid card">
        {goals.map((goal) => (
          <button key={goal} type="button" className={`goal-pill ${selected === goal ? 'selected' : ''}`} onClick={() => setSelected(goal)}>
            {goal}
          </button>
        ))}
      </div>
      {status && <p className="alert success">{status}</p>}
      <button className="button primary" type="button" onClick={saveGoal}>Save goal</button>
    </div>
  );
}

function AssessmentPage() {
  const [careerGoal, setCareerGoal] = useState('');
  const [result, setResult] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const goals = [
    'Frontend Developer',
    'Backend Developer',
    'Full-Stack Developer',
    'Data Analyst',
    'Data Scientist',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'Cybersecurity Analyst',
  ];

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => api<{ profile?: { preferredCareer?: string } }>('/api/profile'),
  });
  const selectedCareer = goals.includes(careerGoal)
    ? careerGoal
    : profileQuery.data?.profile?.preferredCareer ?? 'Frontend Developer';
  const questionQuery = useQuery({
    queryKey: ['assessment-questions', selectedCareer],
    queryFn: () => api<{ questions: { question: string; options: string[] }[] }>(
      `/api/assessments/questions?careerGoal=${encodeURIComponent(selectedCareer)}`,
    ),
    enabled: !profileQuery.isLoading,
  });
  const questions = questionQuery.data?.questions ?? [];

  const submit = async () => {
    if (submitting || questions.some((question) => !answers[question.question])) return;
    const payload = questions.map((question) => ({
      question: question.question,
      selectedOption: answers[question.question],
    }));
    setSubmitting(true);
    setResult(null);
    try {
      const response = await api<{ assessment: any }>('/api/assessments', {
        method: 'POST',
        body: JSON.stringify({ careerGoal: selectedCareer, answers: payload }),
      });
      setResult(response.assessment);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : 'Unable to submit assessment.' });
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = questions.filter((question) => answers[question.question]).length;

  return (
    <div className="page-section assessment-page">
      <header className="assessment-heading">
        <div>
          <span className="eyebrow">Skills check</span>
          <h2>Skill assessment</h2>
          <p>Answer every question to get a scored review tailored to your career goal.</p>
        </div>
        {!result?.answers && questions.length > 0 && (
          <div className="assessment-progress" aria-live="polite">
            <strong>{answeredCount}<span> / {questions.length}</span></strong>
            <small>answered</small>
          </div>
        )}
      </header>
      {!result?.answers ? (
        <div className="assessment-form">
          <div className="assessment-toolbar card">
            <label className="assessment-career-select">
              <span>Assess for career</span>
            <select
              value={selectedCareer}
              onChange={(event) => {
                setCareerGoal(event.target.value);
                setAnswers({});
                setResult(null);
              }}
            >
              {goals.map((goal) => <option key={goal}>{goal}</option>)}
            </select>
            </label>
            <p className="assessment-instructions">Choose the best answer for each question.</p>
          </div>
          {profileQuery.isLoading || questionQuery.isLoading ? (
            <div className="card assessment-loading" role="status">Loading assessment questions...</div>
          ) : null}
          {(profileQuery.error || questionQuery.error) && (
            <p className="alert error" role="alert">
              {profileQuery.error?.message ?? questionQuery.error?.message}
            </p>
          )}
          {questions.map((question, index) => (
            <fieldset className="assessment-question card" key={question.question}>
              <legend>
                <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
                <span>{question.question}</span>
              </legend>
              <div className="assessment-options">
                {question.options.map((option) => (
                  <label
                    key={option}
                    className={`assessment-option ${answers[question.question] === option ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={option}
                      checked={answers[question.question] === option}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.question]: option }))}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
          {result?.error && <p className="alert error" role="alert">{result.error}</p>}
          <div className="assessment-submit-row">
            <span>{answeredCount === questions.length && questions.length > 0 ? 'Ready to submit' : `${questions.length - answeredCount} unanswered`}</span>
            <button
              type="button"
              className="button primary"
              disabled={!questions.length || answeredCount !== questions.length || submitting}
              onClick={submit}
            >
              {submitting ? 'Submitting…' : 'Submit assessment'}
            </button>
          </div>
        </div>
      ) : (
        <div className="assessment-result card">
          <div className="assessment-result-summary">
            <div className="assessment-score">{result.score}<span>%</span></div>
            <div>
              <span className="eyebrow">Assessment complete</span>
              <h3>{result.careerGoal}</h3>
              <p>{result.resultSummary}</p>
            </div>
          </div>
          <h3 className="assessment-review-title">Answer review</h3>
          <div className="assessment-review-list">
            {result.answers.map((answer: { question: string; selectedOption: string; correctOption: string; isCorrect: boolean }, index: number) => (
              <article className={`assessment-review-item ${answer.isCorrect ? 'correct' : 'incorrect'}`} key={answer.question}>
                <span className="question-number">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{answer.question}</strong>
                  <p>Your answer: {answer.selectedOption}</p>
                  {!answer.isCorrect && <p>Correct answer: {answer.correctOption}</p>}
                </div>
                <span className="assessment-review-status">{answer.isCorrect ? 'Correct' : 'Review'}</span>
              </article>
            ))}
          </div>
          <button
            type="button"
            className="button secondary assessment-retake"
            onClick={() => {
              setAnswers({});
              setResult(null);
            }}
          >
            Take another assessment
          </button>
        </div>
      )}
    </div>
  );
}

function RoadmapPage() {
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => api<{ profile?: { preferredCareer?: string } }>('/api/profile'),
  });
  const roadmapQuery = useQuery({ queryKey: ['roadmaps'], queryFn: () => api<{ roadmaps: any[] }>('/api/roadmaps') });
  const careerGoal = profileQuery.data?.profile?.preferredCareer ?? 'Frontend Developer';

  const generate = async () => {
    setStatus('');
    setError('');
    try {
      const res = await api<{ roadmap: any }>('/api/roadmaps/generate', {
        method: 'POST',
        body: JSON.stringify({ careerGoal }),
      });
      setStatus(`Roadmap generated for ${res.roadmap.careerGoal}.`);
      await roadmapQuery.refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Roadmap generation failed.');
    }
  };

  return (
    <div className="page-section">
      <h2>Career roadmap</h2>
      <p>Personalized for: <strong>{careerGoal}</strong></p>
      <button type="button" className="button primary" disabled={profileQuery.isLoading} onClick={generate}>
        Generate roadmap
      </button>
      {status && <p className="alert success">{status}</p>}
      {error && <p className="alert error">{error}</p>}
      {roadmapQuery.error && <p className="alert error">{roadmapQuery.error.message}</p>}
      <div className="list-stack">
        {(roadmapQuery.data?.roadmaps ?? []).map((item) => (
          <div key={item._id} className="card">
            <h3>{item.careerGoal}</h3>
            <p>{item.summary}</p>
            {item.skillGaps?.length > 0 && <p>Focus areas: {item.skillGaps.join(', ')}</p>}
            {item.learningStages?.map((stage: { title: string; duration: string; topics: string[] }) => (
              <div key={stage.title}>
                <strong>{stage.title}</strong> · {stage.duration}
                <p>{stage.topics.join(', ')}</p>
              </div>
            ))}
            <ul className="mini-list">
              {(item.milestones ?? []).map((milestone: any) => (
                <li key={milestone.title}><strong>{milestone.title}</strong> - {milestone.completed ? 'Completed' : 'In progress'}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResumePage() {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const upload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const response = await fetch(`${API_BASE}/api/resumes/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message ?? 'Upload failed.');
      setMessage('Resume uploaded and analyzed successfully.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed.');
    }
  };

  return (
    <div className="page-section">
      <h2>Resume upload and analysis</h2>
      <div className="card stack-form">
        <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="button" className="button primary" onClick={upload}>Upload resume</button>
        {message && <p className="alert success">{message}</p>}
      </div>
    </div>
  );
}

function JobAnalysisPage() {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  const submit = async () => {
    try {
      await api('/api/job-analysis', {
        method: 'POST',
        body: JSON.stringify({ rawText: text, sourceType: 'paste', jobTitle: 'Frontend Developer' }),
      });
      setMessage('Job description analyzed successfully.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Job analysis failed.');
    }
  };

  return (
    <div className="page-section">
      <h2>Job description analysis</h2>
      <div className="card stack-form">
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a job description here..." />
        <button type="button" className="button primary" onClick={submit}>Analyze role</button>
        {message && <p className="alert success">{message}</p>}
      </div>
    </div>
  );
}

function InterviewPage() {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [interview, setInterview] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [answer, setAnswer] = useState('');
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => api<{ profile?: { preferredCareer?: string } }>('/api/profile'),
  });
  const [careerGoal, setCareerGoal] = useState('');
  const activeCareerGoal = careerGoal || profileQuery.data?.profile?.preferredCareer || 'Frontend Developer';

  const start = async () => {
    if (isWorking) return;
    setIsWorking(true);
    setMessage('');
    setError('');
    setReport(null);
    setInterview(null);
    try {
      const data = await api<{ interview: any }>('/api/interviews/start', {
        method: 'POST',
        body: JSON.stringify({ careerGoal: activeCareerGoal, difficulty: 'Medium', type: 'MIXED', questionCount: 3 }),
      });
      setInterview(data.interview);
      setAnswer('');
      setMessage('Interview started.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Interview creation failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const answerQuestion = async () => {
    if (!interview || isWorking || answer.trim().length < 10) return;
    setIsWorking(true);
    setMessage('');
    setError('');
    try {
      const data = await api<{ interview: any; evaluation: any }>('/api/interviews/' + interview._id + '/answer', {
        method: 'POST',
        body: JSON.stringify({ answer }),
      });
      setInterview(data.interview);
      setAnswer('');
      setMessage(data.evaluation?.overallSummary ?? 'Answer submitted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Answer submission failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const finalize = async () => {
    if (!interview || isWorking) return;
    setIsWorking(true);
    setError('');
    try {
      const data = await api<{ interview: any; report: any }>(`/api/interviews/${interview._id}/finalize`, {
        method: 'POST',
      });
      setInterview(data.interview);
      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create interview report.');
    } finally {
      setIsWorking(false);
    }
  };

  const startAnotherInterview = () => {
    setInterview(null);
    setReport(null);
    setAnswer('');
    setMessage('');
    setError('');
  };

  return (
    <div className="page-section">
      <h2>Mock interview</h2>
      <div className="card stack-form">
        {!interview && (
          <>
            <label>
              Career goal
              <input
                value={activeCareerGoal}
                onChange={(event) => setCareerGoal(event.target.value)}
                aria-label="Interview career goal"
              />
            </label>
            <button type="button" className="button primary" disabled={isWorking} onClick={start}>
              {isWorking ? 'Starting interview...' : 'Start interview'}
            </button>
          </>
        )}
        {interview && (
          <>
            {interview.currentQuestionIndex < interview.questionCount ? (
              <>
                <p><strong>Question {interview.currentQuestionIndex + 1} of {interview.questionCount}</strong></p>
                <p>{interview.questions?.[interview.currentQuestionIndex]?.question}</p>
                <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer (at least 10 characters)..." />
                <button type="button" className="button primary" disabled={isWorking || answer.trim().length < 10} onClick={answerQuestion}>
                  {isWorking ? 'Evaluating answer...' : 'Submit answer'}
                </button>
              </>
            ) : (
              !report && (
                <button type="button" className="button primary" disabled={isWorking} onClick={finalize}>
                  {isWorking ? 'Generating report...' : 'Generate interview report'}
                </button>
              )
            )}
            {report && (
              <div>
                <h3>Interview report · {report.overallScore}%</h3>
                <p>{report.summary}</p>
                <h4>Strengths</h4>
                <ul className="mini-list">{report.strengths.map((item: string) => <li key={item}>{item}</li>)}</ul>
                <h4>Areas to improve</h4>
                <ul className="mini-list">{report.improvements.map((item: string) => <li key={item}>{item}</li>)}</ul>
                <button type="button" className="button secondary" onClick={startAnotherInterview}>
                  Start another interview
                </button>
              </div>
            )}
          </>
        )}
        {message && <p className="alert success">{message}</p>}
        {error && <p className="alert error">{error}</p>}
      </div>
    </div>
  );
}

function AnalyticsPage() {
  const { data } = useQuery({ queryKey: ['analytics'], queryFn: () => api<{ metrics: any; scoreHistory: any[] }>('/api/analytics') });
  const metrics = data?.metrics ?? {};
  const history = data?.scoreHistory ?? [];

  return (
    <div className="page-section">
      <h2>Progress analytics</h2>
      <div className="stats-grid">
        <StatCard label="Roadmap milestones" value={metrics.totalMilestones ?? 0} accent="indigo" />
        <StatCard label="Completed" value={metrics.completedMilestones ?? 0} accent="green" />
        <StatCard label="Assessments" value={metrics.assessmentsCompleted ?? 0} accent="navy" />
        <StatCard label="Average score" value={`${metrics.averageInterviewScore ?? 0}%`} accent="amber" />
      </div>
      <div className="card">
        <h3>Interview score history</h3>
        <ul className="mini-list">
          {history.length ? history.map((item) => <li key={item.date}>{item.date}: {item.score}</li>) : <li>No recorded interview scores yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function AdminPage() {
  const { data } = useQuery({ queryKey: ['admin-stats'], queryFn: () => api<{ totalUsers: number; activeUsers: number; students: number; admins: number; auditLogs: number }>('/api/admin/stats') });

  return (
    <div className="page-section">
      <h2>Admin dashboard</h2>
      <div className="stats-grid">
        <StatCard label="Users" value={data?.totalUsers ?? 0} accent="indigo" />
        <StatCard label="Active" value={data?.activeUsers ?? 0} accent="green" />
        <StatCard label="Students" value={data?.students ?? 0} accent="navy" />
        <StatCard label="Audit events" value={data?.auditLogs ?? 0} accent="amber" />
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div className={`stat-card ${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="page-shell padded">
      <div className="card empty-state">
        <h2>Page not found</h2>
        <p>The page you requested does not exist or you do not have access.</p>
        <NavLink to="/" className="button primary">Go home</NavLink>
      </div>
    </div>
  );
}

export default App;
