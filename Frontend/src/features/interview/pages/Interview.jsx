import React, { useState, useEffect } from 'react'
import '../styles/interview.scss'
import { useInterview } from '../hook/useInterview'
import { useAuth } from '../../app/hook/useAuth'
import { useNavigate, useParams } from 'react-router'

// ── Smart Tag & Context Derivation Helper ────────────────────────────────────
const getQuestionTags = (questionText, index, type) => {
    const text = (questionText || '').toLowerCase()

    if (type === 'behavioral') {
        if (text.includes('conflict') || text.includes('disagree')) {
            return { category: 'CONFLICT RESOLUTION', context: 'Team Dynamics' }
        }
        if (text.includes('lead') || text.includes('initiative') || text.includes('project')) {
            return { category: 'LEADERSHIP & INITIATIVE', context: 'Project Ownership' }
        }
        if (text.includes('deadline') || text.includes('pressure') || text.includes('stress')) {
            return { category: 'PRESSURE & DELIVERY', context: 'Execution Velocity' }
        }
        if (text.includes('fail') || text.includes('mistake') || text.includes('learn')) {
            return { category: 'GROWTH MINDSET', context: 'Continuous Learning' }
        }
        const fallbackCats = [
            { category: 'CROSS-FUNCTIONAL', context: 'Stakeholder Alignment' },
            { category: 'CULTURE & IMPACT', context: 'Organizational Value' },
            { category: 'TECHNICAL ADVOCACY', context: 'Engineering Strategy' }
        ]
        return fallbackCats[ index % fallbackCats.length ]
    }

    // Technical categories
    if (text.includes('jwt') || text.includes('auth') || text.includes('token') || text.includes('cookie') || text.includes('security')) {
        return { category: 'SECURITY & AUTH', context: 'Project: Snitch E-Commerce' }
    }
    if (text.includes('redux') || text.includes('state') || text.includes('context') || text.includes('store') || text.includes('toolkit')) {
        return { category: 'STATE ARCHITECTURE', context: 'Client Side' }
    }
    if (text.includes('mongodb') || text.includes('aggregation') || text.includes('sql') || text.includes('database') || text.includes('query')) {
        return { category: 'DATABASE PERFORMANCE', context: 'Data Modeling' }
    }
    if (text.includes('optimistic') || text.includes('real-time') || text.includes('telemetry') || text.includes('socket') || text.includes('ux')) {
        return { category: 'REAL-TIME UX', context: 'Project: Perplexity AI clone' }
    }
    if (text.includes('react') || text.includes('hook') || text.includes('render') || text.includes('component')) {
        return { category: 'CORE FRONTEND', context: 'React Performance' }
    }
    if (text.includes('api') || text.includes('microservice') || text.includes('node') || text.includes('express') || text.includes('backend')) {
        return { category: 'SYSTEM ARCHITECTURE', context: 'Node.js Core' }
    }

    const fallbacks = [
        { category: 'SYSTEM ARCHITECTURE', context: 'Distributed Core' },
        { category: 'PERFORMANCE OPTIMIZATION', context: 'High-Throughput Services' },
        { category: 'CODE RELIABILITY', context: 'Fault Tolerance & CI' }
    ]
    return fallbacks[ index % fallbacks.length ]
}

// ── Smart Helper to parse intention into structured expectation bullets ──────
const getExpectationsList = (intention) => {
    if (!intention) return []
    if (intention.includes('\n')) {
        return intention.split('\n').map(s => s.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean)
    }
    if (intention.includes('•')) {
        return intention.split('•').map(s => s.trim()).filter(Boolean)
    }
    const sentences = intention.split(/(?<=[.?!])\s+/).filter(Boolean)
    return sentences.length > 0 ? sentences : [ intention ]
}

// ── Question Card Component (Accordion with Answer Prep) ─────────────────────
const QuestionCard = ({ item, index, type, reportId, reportTitle }) => {
    // Open the first question by default like the reference screenshot
    const [ open, setOpen ] = useState(index === 0)
    const [ saved, setSaved ] = useState(false)

    const storageKey = `answer_notes_${reportId}_${type}_${index}`
    const [ notes, setNotes ] = useState(() => {
        try {
            return localStorage.getItem(storageKey) || item.answer || ''
        } catch {
            return item.answer || ''
        }
    })

    const { category, context } = getQuestionTags(item.question, index, type, reportTitle)
    const expectations = getExpectationsList(item.intention)

    const handleSave = (e) => {
        e.stopPropagation()
        try {
            localStorage.setItem(storageKey, notes)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error('Failed to save notes to localStorage', err)
        }
    }

    return (
        <div className={`question-card ${open ? 'question-card--expanded' : ''}`}>
            <div className='question-card__header' onClick={() => setOpen(o => !o)}>
                <div className='question-card__meta-row'>
                    <div className='question-card__badges'>
                        <span className={`question-card__q-num ${open ? 'question-card__q-num--active' : ''}`}>
                            Q{index + 1}
                        </span>
                        <span className='question-card__cat-badge'>{category}</span>
                        <span className='question-card__context-badge'>{context}</span>
                    </div>

                    <span className={`question-card__chevron ${open ? 'question-card__chevron--open' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </span>
                </div>

                <h3 className='question-card__title'>{item.question}</h3>
            </div>

            {open && (
                <div className='question-card__expanded-body'>
                    {/* Evaluator Key Expectations */}
                    <div className='question-card__expectations-section'>
                        <p className='section-label'>Evaluator Key Expectations</p>
                        <ul className='expectations-list'>
                            {expectations.map((exp, i) => (
                                <li key={i}>{exp}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Candidate Answer Prep / Talking Points */}
                    <div className='question-card__talking-points-box'>
                        <p className='talking-points-label'>Your Answer Prep / Talking Points</p>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className='talking-points-textarea'
                            placeholder="Outline your answer structure: 1. Sign-in flow -> 2. In-memory token storage -> 3. Silent refresh via Axios interceptor..."
                        />
                    </div>

                    {/* Footer Row */}
                    <div className='question-card__footer-row'>
                        <span className='context-tag'>
                            {context.includes(':') ? context : `Context: ${context}`}
                        </span>

                        <button
                            type='button'
                            className={`btn-save-notes ${saved ? 'btn-save-notes--saved' : ''}`}
                            onClick={handleSave}
                        >
                            {saved ? (
                                <>
                                    <span>✓</span>
                                    <span>Saved</span>
                                </>
                            ) : (
                                <span>Save Bullet Points</span>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Prep Roadmap Day Card ────────────────────────────────────────────────────
const RoadMapDay = ({ day }) => (
    <div className='roadmap-card'>
        <div className='roadmap-card__header'>
            <span className='roadmap-card__badge'>Day {day.day}</span>
            <h3 className='roadmap-card__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-card__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <span className='task-bullet' />
                    <span>{task}</span>
                </li>
            ))}
        </ul>
    </div>
)

// ── Main Interview Assessment Page ───────────────────────────────────────────
const Interview = () => {
    const [ activeNav, setActiveNav ] = useState('technical')
    const { report, getReportById, loading, getResumePdf } = useInterview()
    const { user } = useAuth()
    const { interviewId } = useParams()
    const navigate = useNavigate()
    const [ downloading, setDownloading ] = useState(false)

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ interviewId ])

    if (loading || !report) {
        return (
            <main className='interview-loading-screen'>
                <div className='loading-spinner' />
                <h2>Loading your interview plan...</h2>
            </main>
        )
    }

    const matchScore = report.matchScore ?? 94

    // Circular gauge calculations (diameter: 120, radius: 60, stroke: 10)
    const radius = 52
    const stroke = 9
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (Math.min(100, Math.max(0, matchScore)) / 100) * circumference

    // User initials
    const initials = user?.username
        ? user.username.slice(0, 2).toUpperCase()
        : 'AC'

    const handleDownloadResume = async () => {
        if (downloading) return
        setDownloading(true)
        try {
            await getResumePdf(interviewId)
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className='interview-page'>

            {/* Top Navigation Bar */}
            <header className='interview-navbar'>
                <div className='interview-navbar__left' onClick={() => navigate('/')}>
                    <div className='interview-navbar__logo-badge'>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a4 4 0 0 1 4 4c0 1.9-1.3 3.5-3 3.9V13h3a3 3 0 0 1 3 3v2" />
                            <path d="M12 22v-4" />
                            <circle cx="12" cy="18" r="2" />
                            <path d="M8 6a4 4 0 0 1 4-4" />
                            <circle cx="6" cy="16" r="2" />
                            <path d="M8 16H6" />
                            <path d="M9 10a4 4 0 0 0-4 4" />
                        </svg>
                    </div>
                    <span className='interview-navbar__brand-name'>InterviewAI</span>
                    <span className='interview-navbar__tag-pill'>TARGETPREP</span>
                </div>

                <div className='interview-navbar__right'>
                    <div className='interview-navbar__match-pill'>
                        <span className='pill-dot' />
                        <span>Target Match: {matchScore}%</span>
                    </div>

                    <div className='interview-navbar__avatar' title={user?.username || 'User Profile'}>
                        {initials}
                    </div>
                </div>
            </header>

            {/* 3-Column Main Assessment Dashboard Layout */}
            <div className='assessment-dashboard'>

                {/* ── Left Sidebar ── */}
                <aside className='assessment-sidebar-left'>
                    <div className='nav-sections-card'>
                        <span className='nav-sections-card__title'>Sections</span>

                        {/* Technical Questions Nav */}
                        <button
                            type='button'
                            className={`nav-tab-btn ${activeNav === 'technical' ? 'nav-tab-btn--active' : ''}`}
                            onClick={() => setActiveNav('technical')}
                        >
                            <div className='nav-tab-btn__left'>
                                <span className='nav-tab-btn__icon'>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="16 18 22 12 16 6" />
                                        <polyline points="8 6 2 12 8 18" />
                                    </svg>
                                </span>
                                <span>Technical Questions</span>
                            </div>
                            <span className='nav-tab-btn__count-pill'>
                                {report.technicalQuestions?.length || 0}
                            </span>
                        </button>

                        {/* Behavioral Questions Nav */}
                        <button
                            type='button'
                            className={`nav-tab-btn ${activeNav === 'behavioral' ? 'nav-tab-btn--active' : ''}`}
                            onClick={() => setActiveNav('behavioral')}
                        >
                            <div className='nav-tab-btn__left'>
                                <span className='nav-tab-btn__icon'>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </span>
                                <span>Behavioral Questions</span>
                            </div>
                            <span className='nav-tab-btn__count-pill'>
                                {report.behavioralQuestions?.length || 0}
                            </span>
                        </button>

                        {/* Prep Roadmap Nav */}
                        <button
                            type='button'
                            className={`nav-tab-btn ${activeNav === 'roadmap' ? 'nav-tab-btn--active' : ''}`}
                            onClick={() => setActiveNav('roadmap')}
                        >
                            <div className='nav-tab-btn__left'>
                                <span className='nav-tab-btn__icon'>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="3 11 22 2 13 21 11 13 3 11" />
                                    </svg>
                                </span>
                                <span>Prep Roadmap</span>
                            </div>
                            <span className='nav-tab-btn__count-pill'>
                                {report.preparationPlan?.length ? `${report.preparationPlan.length}d` : 'L5 Scope'}
                            </span>
                        </button>
                    </div>

                    {/* Download Tailored Resume CTA */}
                    <button
                        type='button'
                        className='btn-download-resume'
                        onClick={handleDownloadResume}
                        disabled={downloading}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>{downloading ? 'Downloading...' : 'Download Resume'}</span>
                    </button>
                </aside>

                {/* ── Center Content Area ── */}
                <main className='assessment-center-content'>

                    {/* Technical Questions Section */}
                    {activeNav === 'technical' && (
                        <section className='assessment-section'>
                            <div className='section-topbar'>
                                <div className='section-topbar__left'>
                                    <div className='section-topbar__heading-row'>
                                        <h1>Technical Questions</h1>
                                        <span className='section-topbar__count-badge'>
                                            {report.technicalQuestions?.length || 0} questions
                                        </span>
                                    </div>
                                    <p className='section-topbar__description'>
                                        Curated by deep-inspecting target role requirements against your proven competencies.
                                    </p>
                                </div>
                                <span className='section-topbar__action-icon' title="Expand View">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="15 3 21 3 21 9" />
                                        <polyline points="9 21 3 21 3 15" />
                                        <line x1="21" y1="3" x2="14" y2="10" />
                                        <line x1="3" y1="21" x2="10" y2="14" />
                                    </svg>  
                                </span>
                            </div>

                            <div className='assessment-section__scroll-area'>
                                <div className='questions-list'>
                                    {report.technicalQuestions?.map((q, i) => (
                                        <QuestionCard
                                            key={i}
                                            item={q}
                                            index={i}
                                            type='technical'
                                            reportId={interviewId}
                                            reportTitle={report.title}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Behavioral Questions Section */}
                    {activeNav === 'behavioral' && (
                        <section className='assessment-section'>
                            <div className='section-topbar'>
                                <div className='section-topbar__left'>
                                    <div className='section-topbar__heading-row'>
                                        <h1>Behavioral Questions</h1>
                                        <span className='section-topbar__count-badge'>
                                            {report.behavioralQuestions?.length || 0} questions
                                        </span>
                                    </div>
                                    <p className='section-topbar__description'>
                                        Structured behavioral scenarios assessing ownership, collaboration, and high-stakes problem resolution.
                                    </p>
                                </div>
                            </div>

                            <div className='assessment-section__scroll-area'>
                                <div className='questions-list'>
                                    {report.behavioralQuestions?.map((q, i) => (
                                        <QuestionCard
                                            key={i}
                                            item={q}
                                            index={i}
                                            type='behavioral'
                                            reportId={interviewId}
                                            reportTitle={report.title}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Prep Roadmap Section */}
                    {activeNav === 'roadmap' && (
                        <section className='assessment-section'>
                            <div className='section-topbar'>
                                <div className='section-topbar__left'>
                                    <div className='section-topbar__heading-row'>
                                        <h1>Preparation Road Map</h1>
                                        <span className='section-topbar__count-badge'>
                                            {report.preparationPlan?.length || 0}-day plan
                                        </span>
                                    </div>
                                    <p className='section-topbar__description'>
                                        Targeted day-by-day technical execution plan to bridge identified capability gaps.
                                    </p>
                                </div>
                            </div>

                            <div className='assessment-section__scroll-area'>
                                <div className='roadmap-days-list'>
                                    {report.preparationPlan?.map((day) => (
                                        <RoadMapDay key={day.day} day={day} />
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                </main>

                {/* ── Right Sidebar ── */}
                <aside className='assessment-sidebar-right'>

                    {/* Match Score Card */}
                    <div className='match-score-card'>
                        <span className='match-score-card__header'>MATCH SCORE</span>

                        <div className='match-score-card__gauge'>
                            <svg width={radius * 2 + stroke * 2} height={radius * 2 + stroke * 2}>
                                <circle
                                    stroke="#e2e8f0"
                                    fill="transparent"
                                    strokeWidth={stroke}
                                    r={radius}
                                    cx={radius + stroke}
                                    cy={radius + stroke}
                                />
                                <circle
                                    stroke="#1a3d32"
                                    fill="transparent"
                                    strokeWidth={stroke}
                                    strokeDasharray={`${circumference} ${circumference}`}
                                    style={{ strokeDashoffset }}
                                    strokeLinecap="round"
                                    r={radius}
                                    cx={radius + stroke}
                                    cy={radius + stroke}
                                />
                            </svg>
                            <div className='gauge-center-text'>
                                <span className='score-value'>{matchScore}%</span>
                                <span className='score-label'>FIT INDEX</span>
                            </div>
                        </div>

                        <div className={`match-score-card__status-pill ${matchScore >= 80 ? 'match-score-card__status-pill--high' : matchScore >= 60 ? 'match-score-card__status-pill--mid' : 'match-score-card__status-pill--low'}`}>
                            <span>{matchScore >= 80 ? '✓' : '⚠️'}</span>
                            <span>{matchScore >= 80 ? 'Strong match for this role' : matchScore >= 60 ? 'Moderate match for this role' : 'Skill focus recommended'}</span>
                        </div>
                    </div>

                    {/* Identified Skill Gaps Card */}
                    <div className='skill-gaps-card'>
                        <div className='skill-gaps-card__header'>
                            <h3>IDENTIFIED SKILL GAPS</h3>
                            <span className='flags-count'>{report.skillGaps?.length || 0} Flags</span>
                        </div>

                        <div className='skill-gaps-card__list'>
                            {report.skillGaps?.map((gap, i) => {
                                const severity = gap.severity || (i === 0 ? 'high' : i === 1 ? 'medium' : 'low')
                                return (
                                    <div key={i} className={`gap-item-card gap-item-card--${severity}`}>
                                        <span className='gap-item-card__icon'>
                                            {severity === 'high' ? (
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                                    <line x1="12" y1="9" x2="12" y2="13" />
                                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                                </svg>
                                            ) : severity === 'medium' ? (
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10" />
                                                    <line x1="12" y1="16" x2="12" y2="12" />
                                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                                </svg>
                                            ) : (
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </svg>
                                            )}
                                        </span>
                                        <div className='gap-item-card__content'>
                                            <span className='gap-name'>{gap.skill}</span>
                                            <span className='gap-desc'>
                                                {severity === 'high'
                                                    ? 'e.g., Jest, React Testing Library drills missing in portfolio'
                                                    : severity === 'medium'
                                                        ? 'Generics & strict boundary type inference'
                                                        : 'Docker containerization & AWS deployment pipeline'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </aside>

            </div>


        </div>
    )
}

export default Interview
