import Feedback from '../models/Feedback.js'
import FacultyAssignment from '../models/FacultyAssignment.js'

// ─────────────────────────────────────────────────────────────
// Helper: build a regex that matches the trimmed value exactly,
// allowing any surrounding whitespace/newlines in the stored field.
// This handles cases where data was inserted with trailing \n or
// leading/trailing spaces without requiring a data migration.
// ─────────────────────────────────────────────────────────────
function exactTrimmed(value) {
  // Escape regex special characters in the value
  const escaped = value.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // ^\s* ... \s*$  — allow surrounding whitespace in the stored string
  return new RegExp(`^\\s*${escaped}\\s*$`, 'i')
}

// ─────────────────────────────────────────────────────────────
// GET /admin/faculties?year=&branch=&section=
// ─────────────────────────────────────────────────────────────
export const getFaculties = async (req, res) => {
  try {
    const { year, branch, section } = req.query

    if (!year || !branch || !section) {
      return res.status(400).json({
        success: false,
        message: 'year, branch, and section are required',
      })
    }

    const numericYear = Number(year)
    const assignments = await FacultyAssignment.find({
      year:    { $in: [numericYear, String(numericYear)] },
      branch:  exactTrimmed(branch),
      section: exactTrimmed(section),
    }).select('subject faculty -_id')

    const faculties = assignments.map((a) => ({
      label:   `${a.subject.trim()} - ${a.faculty.trim()}`,
      faculty: a.faculty.trim(),
      subject: a.subject.trim(),
    }))

    return res.json({ success: true, faculties })
  } catch (error) {
    console.error('getFaculties error:', error.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /admin/analytics?year=&branch=&section=&subject=&faculty=
// ─────────────────────────────────────────────────────────────

const QUESTION_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5']

const QUESTION_LABELS = {
  q1: 'Q1. Teaching Quality',
  q2: 'Q2. Communication',
  q3: 'Q3. Subject Knowledge',
  q4: 'Q4. Punctuality',
  q5: 'Q5. Interaction',
}

export const getFeedbackAnalytics = async (req, res) => {
  try {
    const { year, branch, section, subject, faculty } = req.query

    if (!year || !branch || !section || !subject || !faculty) {
      return res.status(400).json({
        success: false,
        message: 'year, branch, section, subject, and faculty are required',
      })
    }

    const numericYear = Number(year)

    // Use exactTrimmed() for all string fields so stored values with
    // trailing newlines (\n) or extra whitespace still match correctly.
    // year uses $in to handle Number vs String storage difference.
    const matchFilter = {
      year:    { $in: [numericYear, String(numericYear)] },
      branch:  exactTrimmed(branch),
      section: exactTrimmed(section),
      subject: exactTrimmed(subject),
      faculty: exactTrimmed(faculty),
    }

    // Count matching documents
    const totalResponses = await Feedback.countDocuments(matchFilter)

    if (totalResponses === 0) {
      return res.json({
        success: true,
        totalResponses: 0,
        questions: QUESTION_KEYS.map((key) => ({
          key,
          label: QUESTION_LABELS[key],
          answers: [],
        })),
      })
    }

    // Aggregate per question in parallel — all counting in MongoDB
    const results = await Promise.all(
      QUESTION_KEYS.map((key) =>
        Feedback.aggregate([
          { $match: matchFilter },
          { $group: { _id: `$${key}`, count: { $sum: 1 } } },
          { $sort:  { count: -1 } },
        ])
      )
    )

    const questions = QUESTION_KEYS.map((key, i) => ({
      key,
      label:   QUESTION_LABELS[key],
      answers: results[i].map((item) => ({
        answer: item._id,
        count:  item.count,
      })),
    }))

    return res.json({ success: true, totalResponses, questions })
  } catch (error) {
    console.error('getFeedbackAnalytics error:', error.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /admin/responses?year=&branch=&section=&subject=&faculty=
//
// Returns per-question predefined option counts (excl. "Other"),
// per-question "Other" free-text comments, all additional comments,
// and AI-generated summaries for each question + overall.
// ─────────────────────────────────────────────────────────────
import { generateQuestionSummary, generateOverallSummary } from '../utils/summaryGenerator.js'

const PREDEFINED_OPTIONS_MAP = {
  q1: ['Too Fast', 'Too Slow', 'Need More Examples', 'Voice Not Audible', 'No Issues'],
  q2: ['Difficult to Understand', 'Less Interactive', 'Encourages Questions', 'Good Communication', 'No Issues'],
  q3: ['Excellent', 'Good', 'Average', 'Need More Practical Applications', 'No Issues'],
  q4: ['Always On Time', 'Frequently Late', 'Ends Early', 'No Issues'],
  q5: ['Encourages Questions', 'Solves Doubts Well', 'Less Interaction', "Doesn't Encourage Questions", 'No Issues'],
}

const QUESTION_LABELS_SHORT = {
  q1: 'Teaching Quality',
  q2: 'Communication',
  q3: 'Subject Knowledge',
  q4: 'Punctuality',
  q5: 'Interaction',
}

export const getResponses = async (req, res) => {
  try {
    const { year, branch, section, subject, faculty } = req.query

    if (!year || !branch || !section || !subject || !faculty) {
      return res.status(400).json({
        success: false,
        message: 'year, branch, section, subject, and faculty are required',
      })
    }

    const numericYear = Number(year)
    const matchFilter = {
      year:    { $in: [numericYear, String(numericYear)] },
      branch:  exactTrimmed(branch),
      section: exactTrimmed(section),
      subject: exactTrimmed(subject),
      faculty: exactTrimmed(faculty),
    }

    const allFeedback = await Feedback.find(matchFilter)
      .select('q1 q2 q3 q4 q5 comments -_id')
      .lean()

    const total = allFeedback.length

    // Build per-question data
    const questions = QUESTION_KEYS.map((key) => {
      const predefined = PREDEFINED_OPTIONS_MAP[key]
      const label = QUESTION_LABELS_SHORT[key]

      // Count each predefined option
      const countMap = {}
      predefined.forEach((opt) => { countMap[opt] = 0 })

      const otherComments = []

      allFeedback.forEach((fb) => {
        const val = fb[key]
        if (!val) return
        const trimmed = val.trim()
        if (predefined.includes(trimmed)) {
          countMap[trimmed] = (countMap[trimmed] || 0) + 1
        } else {
          // Not a predefined option → treat as "Other" free-text
          otherComments.push(trimmed)
        }
      })

      const answers = predefined
        .map((opt) => ({ answer: opt, count: countMap[opt] }))
        .filter((a) => a.count > 0)
        .sort((a, b) => b.count - a.count)

      const summary = generateQuestionSummary(key, label, answers, otherComments, total)

      return { key, label, answers, otherComments, summary }
    })

    // Additional comments (overall)
    const additionalComments = allFeedback
      .map((fb) => (fb.comments || '').trim())
      .filter((c) => c.length > 0)

    const overallSummary = generateOverallSummary(additionalComments)

    return res.json({
      success: true,
      totalResponses: total,
      questions,
      additionalComments,
      overallSummary,
    })
  } catch (error) {
    console.error('getResponses error:', error.message)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}
