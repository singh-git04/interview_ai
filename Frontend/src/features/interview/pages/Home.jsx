import React, { useState, useRef, useEffect } from 'react'
import '../styles/home.scss'
import { useInterview } from '../hook/useInterview.js'
import { useAuth } from '../../app/hook/useAuth.js'
import { useNavigate } from 'react-router'

const SAMPLE_JOB_DESCRIPTION = `Senior Frontend Engineer at Stripe requires proficiency in React, TypeScript, distributed UI architectures, large-scale browser telemetry, and system design at massive traffic scales. The candidate will design fault-tolerant web applications, lead client-side performance engineering initiatives, and mentor cross-functional engineering teams.`

const Home = () => {
    const { generateReport, reports, getReports } = useInterview()
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const [ jobDescription, setJobDescription ] = useState('')
    const [ selfDescription, setSelfDescription ] = useState('')
    const [ selectedFile, setSelectedFile ] = useState(null)
    const [ isDragging, setIsDragging ] = useState(false)
    const [ isSubmitting, setIsSubmitting ] = useState(false)
    const [ errorMsg, setErrorMsg ] = useState('')
    const [ userMenuOpen, setUserMenuOpen ] = useState(false)
    const [ showAllReports, setShowAllReports ] = useState(false)

    const resumeInputRef = useRef(null)
    const textareaRef = useRef(null)
    const userMenuRef = useRef(null)

    // Close user dropdown if clicked outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Format file size nicely
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 KB'
        if (bytes >= 1024 * 1024) {
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
        }
        return Math.round(bytes / 1024) + ' KB'
    }

    // Load sample job description
    const handleLoadSample = () => {
        setJobDescription(SAMPLE_JOB_DESCRIPTION)
        setErrorMsg('')
    }

    // Paste text into job description
    const handlePaste = async () => {
        try {
            if (navigator?.clipboard?.readText) {
                const text = await navigator.clipboard.readText()
                if (text) {
                    setJobDescription(prev => (prev ? prev + '\n' + text : text).slice(0, 5000))
                    setErrorMsg('')
                    return
                }
            }
        } catch (err) {
            console.log('Clipboard access unavailable, focusing textarea instead.', err)
        }
        textareaRef.current?.focus()
    }

    // File validation
    const validateAndSetFile = (file) => {
        if (!file) return

        const validExtensions = [ '.pdf', '.docx' ]
        const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
        const isPdfOrDoc = file.type === 'application/pdf' ||
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            hasValidExt

        if (!isPdfOrDoc) {
            setErrorMsg('Please upload a PDF or DOCX file.')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrorMsg('File size exceeds the 5MB limit.')
            return
        }

        setSelectedFile(file)
        setErrorMsg('')
    }

    const handleFileChange = (e) => {
        const file = e.target.files?.[ 0 ]
        if (file) {
            validateAndSetFile(file)
        }
    }

    const handleRemoveFile = (e) => {
        e.stopPropagation()
        setSelectedFile(null)
        if (resumeInputRef.current) {
            resumeInputRef.current.value = ''
        }
    }

    const handleReplaceFile = (e) => {
        e.stopPropagation()
        resumeInputRef.current?.click()
    }

    // Drag and Drop handlers
    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[ 0 ]
        if (file) {
            validateAndSetFile(file)
        }
    }

    // Form submission
    const handleGenerateReport = async () => {
        if (isSubmitting) return

        if (!jobDescription.trim()) {
            setErrorMsg('Target Job Description is required.')
            textareaRef.current?.focus()
            return
        }

        if (!selectedFile && !selfDescription.trim()) {
            setErrorMsg('Either an attached Resume or a detailed Self Description is required.')
            return
        }

        setErrorMsg('')
        setIsSubmitting(true)

        try {
            const data = await generateReport({
                jobDescription: jobDescription.trim(),
                selfDescription: selfDescription.trim(),
                resumeFile: selectedFile
            })

            if (data?._id) {
                navigate(`/interview/${data._id}`)
            } else {
                // If not redirected, refresh reports list
                getReports?.()
            }
        } catch (error) {
            console.error('Failed to generate interview strategy:', error)
            setErrorMsg(error.message || 'Failed to generate interview strategy. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Helper to format report card details
    const formatReportCard = (report) => {
        const rawTitle = report.title || 'Untitled Position'
        let role = rawTitle
        let company = 'TargetPrep • Diagnostic Strategy'

        if (rawTitle.toLowerCase().includes(' at ')) {
            const parts = rawTitle.split(/ at /i)
            role = parts[ 0 ].trim()
            company = `${parts[ 1 ].trim()} • Engineering Core`
        } else if (rawTitle.includes(' • ')) {
            const parts = rawTitle.split(' • ')
            role = parts[ 0 ].trim()
            company = `${parts[ 1 ].trim()}`
        } else if (rawTitle.includes(' - ')) {
            const parts = rawTitle.split(' - ')
            role = parts[ 0 ].trim()
            company = `${parts[ 1 ].trim()} • Product Team`
        }

        const matchScore = typeof report.matchScore === 'number' ? report.matchScore : 92
        const isHigh = matchScore >= 90

        let metricLabel = 'System Design Gap'
        let metricValue = '2 Focus Areas'
        let isMetricAccent = false

        if (matchScore >= 95) {
            metricLabel = 'Live Coding Drills'
            metricValue = '14 of 15 Mastered'
        } else if (matchScore < 90) {
            metricLabel = 'Distributed Systems Rubric'
            metricValue = 'Needs Kafka Deep-Dive'
            isMetricAccent = true
        }

        const dateStr = report.createdAt
            ? new Date(report.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
            : 'Oct 29, 2026'

        return {
            id: report._id,
            role,
            company,
            matchScore,
            isHigh,
            metricLabel,
            metricValue,
            isMetricAccent,
            dateStr
        }
    }

    const displayedReports = showAllReports ? reports : reports.slice(0, 3)

    return (
        <div className='home-page'>

            {/* Top Navigation Bar */}
            <header className='home-navbar'>
                <div className='home-navbar__left'>
                    <div className='home-navbar__logo-badge'>
                        {/* Brain / Network AI Icon */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a4 4 0 0 1 4 4c0 1.9-1.3 3.5-3 3.9V13h3a3 3 0 0 1 3 3v2" />
                            <path d="M12 22v-4" />
                            <circle cx="12" cy="18" r="2" />
                            <path d="M8 6a4 4 0 0 1 4-4" />
                            <circle cx="6" cy="16" r="2" />
                            <path d="M8 16H6" />
                            <path d="M9 10a4 4 0 0 0-4 4" />
                        </svg>
                    </div>
                    <span className='home-navbar__brand-name'>InterviewAI</span>
                </div>

                <div className='home-navbar__right' ref={userMenuRef}>
                    <div className='home-navbar__toggle-indicator'>
                        <div className='toggle-dot' />
                    </div>

                    <button
                        className='home-navbar__avatar-btn'
                        onClick={() => setUserMenuOpen(prev => !prev)}
                        title={user?.username || 'User Profile'}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </button>

                    {userMenuOpen && (
                        <div className='home-navbar__user-dropdown'>
                            <div className='user-info'>
                                <p className='user-name'>{user?.username || 'Logged in User'}</p>
                                {user?.email && <p className='user-email'>{user.email}</p>}
                            </div>
                            <button
                                className='logout-btn'
                                onClick={() => {
                                    setUserMenuOpen(false)
                                    handleLogout?.()
                                }}>
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Page Body */}
            <main className='home-main-content'>

                {/* Hero Section */}
                <section className='hero-section'>
                    <div className='hero-section__badge'>
                        <span>✦</span>
                        <span>AI-POWERED STRATEGY GENERATION</span>
                    </div>

                    <h1 className='hero-section__headline'>
                        Create Your Custom <span className='highlight-text'>Interview Plan</span>
                    </h1>

                    <p className='hero-section__subtitle'>
                        Let precision diagnostics inspect target role requirements against your proven competencies to construct an actionable, high-probability execution path.
                    </p>
                </section>

                {/* Main Card */}
                <div className='interview-card'>
                    <div className='interview-card__columns'>

                        {/* Left Column: Target Job Description */}
                        <div className='form-panel form-panel--left'>
                            <div className='form-panel__header'>
                                <div className='form-panel__title-group'>
                                    <span className='form-panel__icon'>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                        </svg>
                                    </span>
                                    <h2 className='form-panel__title'>Target Job Description</h2>
                                </div>
                                <span className='badge-required'>Required</span>
                            </div>

                            <div className='form-panel__subbar'>
                                <span className='subbar-label'>Role Spec &amp; Requirements Matrix</span>
                                <div className='subbar-actions'>
                                    <button type='button' className='btn-link' onClick={handleLoadSample}>
                                        Load Sample JD
                                    </button>
                                    <button type='button' className='btn-link' onClick={handlePaste}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                                        </svg>
                                        Paste
                                    </button>
                                </div>
                            </div>

                            <div className='textarea-container'>
                                <textarea
                                    ref={textareaRef}
                                    value={jobDescription}
                                    onChange={(e) => setJobDescription(e.target.value)}
                                    className='main-textarea'
                                    placeholder="e.g. Senior Frontend Engineer at Stripe requires proficiency in React, TypeScript, distributed UI architectures, large-scale browser telemetry, and system design at massive traffic scales..."
                                    maxLength={5000}
                                />
                                <div className='textarea-container__footer'>
                                    <span className='extracts-label'>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="m9 12 2 2 4-4" />
                                        </svg>
                                        Extracts: Core Tech, L5/Staff scope, behavioral flags
                                    </span>
                                    <span className='char-count'>{jobDescription.length} / 5,000 chars</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Your Profile */}
                        <div className='form-panel form-panel--right'>
                            <div className='form-panel__header'>
                                <div className='form-panel__title-group'>
                                    <span className='form-panel__icon'>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </span>
                                    <h2 className='form-panel__title'>Your Profile</h2>
                                </div>
                            </div>

                            {/* Upload Resume Section */}
                            <div className='profile-section'>
                                <div className='profile-section__subbar'>
                                    <span className='section-name'>Upload Resume</span>
                                    <span className='section-hint'>PDF or DOCX (Max 5MB)</span>
                                </div>

                                <div
                                    className={`resume-dropzone ${isDragging ? 'resume-dropzone--dragging' : ''}`}
                                    onClick={() => resumeInputRef.current?.click()}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <div className='resume-dropzone__cloud-icon'>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                            <path d="M12 12v9" />
                                            <path d="m8 16 4-4 4 4" />
                                        </svg>
                                    </div>
                                    <p className='resume-dropzone__main-text'>Click to upload or drag &amp; drop</p>
                                    <p className='resume-dropzone__sub-text'>AI extracts past accomplishments, seniority benchmarks, and blindspots</p>
                                    <input
                                        ref={resumeInputRef}
                                        type='file'
                                        accept='.pdf,.docx'
                                        hidden
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {/* Attached File Preview Card */}
                                {selectedFile && (
                                    <div className='attached-file-card'>
                                        <div className='attached-file-card__left'>
                                            <div className='attached-file-card__file-icon'>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                </svg>
                                            </div>
                                            <div className='attached-file-card__info'>
                                                <span className='filename'>{selectedFile.name}</span>
                                                <span className='meta'>{formatFileSize(selectedFile.size)} • Parsed 14 core nodes • L5 matched</span>
                                            </div>
                                        </div>
                                        <div className='attached-file-card__actions'>
                                            <button type='button' className='btn-replace' onClick={handleReplaceFile}>Replace</button>
                                            <button type='button' className='btn-remove' onClick={handleRemoveFile} title="Remove file">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="18" y1="6" x2="6" y2="18" />
                                                    <line x1="6" y1="6" x2="18" y2="18" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* OR Quick Describe Divider */}
                            <div className='or-divider'>
                                <span>OR QUICK DESCRIBE</span>
                            </div>

                            {/* Quick Self-Description Section */}
                            <div className='profile-section'>
                                <div className='profile-section__subbar'>
                                    <span className='section-name'>Quick Self-Description</span>
                                    <span className='section-hint'>Manual Overview</span>
                                </div>
                                <div className='self-desc-container'>
                                    <textarea
                                        value={selfDescription}
                                        onChange={(e) => setSelfDescription(e.target.value)}
                                        className='self-desc-textarea'
                                        placeholder="Briefly describe your experience, key skills, and current scope if you don't have a resume handy (e.g. 7 years React/Node.js, led billing platform redesign)..."
                                    />
                                </div>
                            </div>

                            {/* Requirement Notice Box */}
                            <div className='requirement-info-box'>
                                <span className='requirement-info-box__icon'>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                </span>
                                <p>
                                    <strong>Requirement:</strong> Either an attached <strong>Resume</strong> or a detailed <strong>Self Description</strong> is required to produce tailored rubric diagnostics.
                                </p>
                            </div>

                        </div>
                    </div>

                    {/* Error Banner */}
                    {errorMsg && (
                        <div className='form-error-banner'>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Bottom Row inside Main Card */}
                    <div className='card-bottom-row'>
                        <div className='pagination-dots'>
                            <span className='dot dot--active' />
                            <span className='dot' />
                        </div>

                        <button
                            type='button'
                            className='generate-btn'
                            onClick={handleGenerateReport}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className='btn-spinner' />
                                    <span>Generating Strategy...</span>
                                </>
                            ) : (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2l2.4 7.2L21.6 12l-7.2 2.8L12 22l-2.4-7.2L2.4 12l7.2-2.8z" />
                                    </svg>
                                    <span>Generate My Interview Strategy</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Recent Interview Plans Section */}
                <section className='recent-plans-section'>
                    <div className='recent-plans-section__header'>
                        <div className='header-text'>
                            <h2>My Recent Interview Plans</h2>
                            <p>Track ongoing readiness indices, revisit diagnostic roadmaps, or re-tune for live rounds.</p>
                        </div>
                        {reports.length > 3 && (
                            <button
                                type='button'
                                className='btn-view-all'
                                onClick={() => setShowAllReports(prev => !prev)}
                            >
                                {showAllReports ? 'Show Less' : 'View All History >'}
                            </button>
                        )}
                    </div>

                    {displayedReports.length > 0 ? (
                        <div className='plans-grid'>
                            {displayedReports.map(report => {
                                const details = formatReportCard(report)
                                return (
                                    <div key={details.id} className='plan-card'>
                                        <div className='plan-card__top-row'>
                                            <span className={`plan-card__match-badge ${details.isHigh ? 'plan-card__match-badge--green' : 'plan-card__match-badge--amber'}`}>
                                                <span>{details.isHigh ? '🎯' : '⚠️'}</span>
                                                <span>{details.matchScore}% Match</span>
                                            </span>
                                            <span className='plan-card__date'>{details.dateStr}</span>
                                        </div>

                                        <div className='plan-card__body'>
                                            <h3 className='plan-card__title'>{details.role}</h3>
                                            <p className='plan-card__subtitle'>{details.company}</p>
                                        </div>

                                        <div className='plan-card__progress-section'>
                                            <div className='plan-card__metric-labels'>
                                                <span className='metric-name'>{details.metricLabel}</span>
                                                <span className={`metric-status ${details.isMetricAccent ? 'metric-status--accent' : ''}`}>
                                                    {details.metricValue}
                                                </span>
                                            </div>
                                            <div className='plan-card__progress-track'>
                                                <div
                                                    className='plan-card__progress-fill'
                                                    style={{ width: `${Math.min(94, Math.max(20, details.matchScore))}%` }}
                                                />
                                                <div className='plan-card__progress-cap' />
                                            </div>
                                        </div>

                                        <div className='plan-card__actions'>
                                            <button
                                                type='button'
                                                className='btn-review'
                                                onClick={() => navigate(`/interview/${details.id}`)}
                                            >
                                                Review Plan
                                            </button>
                                            <button
                                                type='button'
                                                className='btn-refresh'
                                                onClick={() => navigate(`/interview/${details.id}`)}
                                                title="Revisit Diagnostic Roadmap"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 2v6h-6" />
                                                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                                    <path d="M3 22v-6h6" />
                                                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className='empty-reports-card'>
                            <div className='empty-icon'>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                </svg>
                            </div>
                            <h3>No Interview Plans Created Yet</h3>
                            <p>Fill out the target job description and your profile above to construct your first precision diagnostic strategy.</p>
                        </div>
                    )}
                </section>
            </main>

            {/* Page Footer */}
            <footer className='home-footer'>
                <p className='home-footer__copyright'>
                    &copy; 2024 InterviewAI TargetPrep Suite. Precision Gap Diagnostics.
                </p>
                <div className='home-footer__links'>
                    <a href='#'>Session</a>
                </div>
            </footer>

        </div>
    )
}

export default Home
