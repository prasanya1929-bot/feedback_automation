import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/FeedbackForm.css'

const QUESTIONS = [
  {
    key: 'teachingQuality',
    title: 'Q1. Teaching Quality',
    options: [
      'Too Fast',
      'Too Slow',
      'Need More Examples',
      'Voice Not Audible',
      'No Issues',
      'Other',
    ],
  },
  {
    key: 'communication',
    title: 'Q2. Communication',
    options: [
      'Difficult to Understand',
      'Less Interactive',
      'Encourages Questions',
      'Good Communication',
      'No Issues',
      'Other',
    ],
  },
  {
    key: 'subjectKnowledge',
    title: 'Q3. Subject Knowledge',
    options: [
      'Excellent',
      'Good',
      'Average',
      'Need More Practical Applications',
      'No Issues',
      'Other',
    ],
  },
  {
    key: 'punctuality',
    title: 'Q4. Punctuality',
    options: [
      'Always On Time',
      'Frequently Late',
      'Ends Early',
      'No Issues',
      'Other',
    ],
  },
  {
    key: 'interaction',
    title: 'Q5. Interaction',
    options: [
      'Encourages Questions',
      'Solves Doubts Well',
      'Less Interaction',
      "Doesn't Encourage Questions",
      'No Issues',
      'Other',
    ],
  },
]

export default function FeedbackForm() {
  const navigate = useNavigate()

  const [selectedSubject, setSelectedSubject] = useState('')

  const [formData, setFormData] = useState({
    teachingQuality: '',
    communication: '',
    subjectKnowledge: '',
    punctuality: '',
    interaction: '',
    additionalComments: '',
  })

  const [otherResponses, setOtherResponses] = useState({
    teachingQuality: '',
    communication: '',
    subjectKnowledge: '',
    punctuality: '',
    interaction: '',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    const subject = localStorage.getItem('selectedSubject')

    if (!subject) {
      navigate('/dashboard', { replace: true })
      return
    }

    setSelectedSubject(subject)
  }, [navigate])

  const handleQuestionChange = (questionKey, value) => {
    setFormData((prev) => ({
      ...prev,
      [questionKey]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [questionKey]: '',
    }))
  }

  const handleOtherChange = (questionKey, value) => {
    setOtherResponses((prev) => ({
      ...prev,
      [questionKey]: value,
    }))
  }

  const handleCommentsChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      additionalComments: value,
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    QUESTIONS.forEach((q) => {
      if (!formData[q.key]) {
        newErrors[q.key] = 'Please select one option'
      }
    })

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const token = localStorage.getItem('token')

      if (!token) {
        alert('Login expired')
        navigate('/login')
        return
      }

      const payload = JSON.parse(atob(token.split('.')[1]))

      const feedbackData = {
        studentEmail: payload.email,
        rollNumber: payload.rollNumber,
        branch: payload.branch,
        year: payload.year,
        section: payload.section,
        subject: selectedSubject,

        q1:
          formData.teachingQuality === 'Other'
            ? otherResponses.teachingQuality
            : formData.teachingQuality,

        q2:
          formData.communication === 'Other'
            ? otherResponses.communication
            : formData.communication,

        q3:
          formData.subjectKnowledge === 'Other'
            ? otherResponses.subjectKnowledge
            : formData.subjectKnowledge,

        q4:
          formData.punctuality === 'Other'
            ? otherResponses.punctuality
            : formData.punctuality,

        q5:
          formData.interaction === 'Other'
            ? otherResponses.interaction
            : formData.interaction,

        comments: formData.additionalComments,
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/feedback/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackData),
        }
      )

      const data = await response.json()

      if (!data.success) {
        alert(data.message)
        return
      }

      navigate('/success')
    } catch (err) {
      console.error(err)
      alert('Submission Failed')
    }
  }

  if (!selectedSubject) return null

  return (
    <div className="feedback-page">
      <div className="feedback-container">
        <div className="feedback-header">
          <button
            type="button"
            className="feedback-back-btn"
            onClick={() => navigate('/dashboard')}
          >
            <span className="feedback-back-icon">←</span>
            <span>Back</span>
          </button>
          <h1 className="feedback-title">Course Feedback</h1>
          <div className="feedback-header-spacer" />
        </div>

        <div className="feedback-subject-info">
          <p className="feedback-subject-label">Selected Subject</p>
          <h2>{selectedSubject}</h2>
          <p className="feedback-subject-description">
            Share your experience with this course so we can improve it.
          </p>
        </div>

        <form className="feedback-form" onSubmit={handleSubmit}>
          {QUESTIONS.map((question) => {
            const selectedValue = formData[question.key]
            const fieldError = errors[question.key]

            return (
              <fieldset key={question.key} className="form-section">
                <legend className="form-legend">
                  <span className="question-number">{question.title.split('.')[0]}</span>
                  <span>{question.title.split('.').slice(1).join('.').trim()}</span>
                </legend>

                <div className="form-options">
                  {question.options.map((option) => {
                    const isSelected = selectedValue === option

                    return (
                      <label
                        key={option}
                        className={`form-option-card ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          className="form-radio"
                          type="radio"
                          name={question.key}
                          value={option}
                          checked={isSelected}
                          onChange={() => handleQuestionChange(question.key, option)}
                        />
                        <span className="form-option-text">{option}</span>
                      </label>
                    )
                  })}
                </div>

                {selectedValue === 'Other' && (
                  <input
                    className="form-other-input"
                    type="text"
                    placeholder="Please specify"
                    value={otherResponses[question.key]}
                    onChange={(e) => handleOtherChange(question.key, e.target.value)}
                  />
                )}

                {fieldError && <p className="form-error">{fieldError}</p>}
              </fieldset>
            )
          })}

          <div className="form-comments-card">
            <label className="form-label" htmlFor="additionalComments">
              Additional comments
            </label>
            <textarea
              id="additionalComments"
              className="form-textarea"
              rows="5"
              placeholder="Share any additional feedback or suggestions"
              value={formData.additionalComments}
              onChange={(e) => handleCommentsChange(e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="form-back-btn" onClick={() => navigate('/dashboard')}>
              Back
            </button>
            <button type="submit" className="form-submit-btn">
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}