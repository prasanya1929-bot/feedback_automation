/**
 * Rule-based AI summary generator.
 * Produces professional 2–4 sentence summaries from feedback response data.
 * No external API required.
 */

// Predefined options per question (must match FeedbackForm.jsx)
const PREDEFINED_OPTIONS = {
  q1: ['Too Fast', 'Too Slow', 'Need More Examples', 'Voice Not Audible', 'No Issues'],
  q2: ['Difficult to Understand', 'Less Interactive', 'Encourages Questions', 'Good Communication', 'No Issues'],
  q3: ['Excellent', 'Good', 'Average', 'Need More Practical Applications', 'No Issues'],
  q4: ['Always On Time', 'Frequently Late', 'Ends Early', 'No Issues'],
  q5: ['Encourages Questions', 'Solves Doubts Well', 'Less Interaction', "Doesn't Encourage Questions", 'No Issues'],
}

// Classify options as positive, negative, or neutral
const SENTIMENT = {
  // q1
  'Too Fast':                    'negative',
  'Too Slow':                    'negative',
  'Need More Examples':          'suggestion',
  'Voice Not Audible':           'negative',
  // q2
  'Difficult to Understand':     'negative',
  'Less Interactive':            'negative',
  'Encourages Questions':        'positive',
  'Good Communication':          'positive',
  // q3
  'Excellent':                   'positive',
  'Good':                        'positive',
  'Average':                     'neutral',
  'Need More Practical Applications': 'suggestion',
  // q4
  'Always On Time':              'positive',
  'Frequently Late':             'negative',
  'Ends Early':                  'negative',
  // q5
  'Solves Doubts Well':          'positive',
  'Less Interaction':            'negative',
  "Doesn't Encourage Questions": 'negative',
  'No Issues':                   'positive',
}

// Human-readable descriptions for building sentences
const OPTION_PHRASES = {
  // q1
  'Too Fast':                    'the pace is too fast',
  'Too Slow':                    'the pace is too slow',
  'Need More Examples':          'more examples would be helpful',
  'Voice Not Audible':           'voice clarity is a concern',
  // q2
  'Difficult to Understand':     'explanations are sometimes difficult to follow',
  'Less Interactive':            'the sessions could be more interactive',
  'Encourages Questions':        'the faculty encourages student questions',
  'Good Communication':          'communication is clear and effective',
  // q3
  'Excellent':                   'subject knowledge is excellent',
  'Good':                        'subject knowledge is good',
  'Average':                     'subject knowledge is average',
  'Need More Practical Applications': 'more practical applications are needed',
  // q4
  'Always On Time':              'the faculty is always punctual',
  'Frequently Late':             'punctuality needs improvement',
  'Ends Early':                  'sessions tend to end early',
  // q5
  'Encourages Questions':        'the faculty encourages student participation',
  'Solves Doubts Well':          'doubts are addressed effectively',
  'Less Interaction':            'interaction with students could be improved',
  "Doesn't Encourage Questions": 'student questions are not sufficiently encouraged',
  'No Issues':                   'no significant issues were noted',
}

const CATEGORY_INTROS = {
  q1: 'Regarding teaching quality',
  q2: 'In terms of communication',
  q3: 'On the topic of subject knowledge',
  q4: 'Regarding punctuality',
  q5: 'In terms of student interaction',
}

/**
 * Generate a summary for a single question category.
 * @param {string} questionKey  - "q1" … "q5"
 * @param {string} questionLabel - Human label e.g. "Teaching Quality"
 * @param {Array<{answer: string, count: number}>} answers - predefined option counts
 * @param {string[]} otherComments - free-text "Other" responses
 * @param {number} total - total responses
 * @returns {string} 2–4 sentence summary
 */
export function generateQuestionSummary(questionKey, questionLabel, answers, otherComments, total) {
  if (!total || total === 0) {
    return `No feedback has been submitted for ${questionLabel} yet.`
  }

  const predefined = PREDEFINED_OPTIONS[questionKey] || []
  const intro = CATEGORY_INTROS[questionKey] || `Regarding ${questionLabel}`

  // Sort answers by count descending, exclude "Other"
  const sorted = [...answers]
    .filter(a => a.answer !== 'Other' && predefined.includes(a.answer))
    .sort((a, b) => b.count - a.count)

  if (sorted.length === 0) {
    const hasOthers = otherComments.length > 0
    if (hasOthers) {
      return `${intro}, all student responses were open-ended. Students shared ${otherComments.length} individual comment${otherComments.length > 1 ? 's' : ''} which can be reviewed in detail.`
    }
    return `No predefined responses were recorded for ${questionLabel}.`
  }

  const positives = sorted.filter(a => SENTIMENT[a.answer] === 'positive')
  const negatives = sorted.filter(a => SENTIMENT[a.answer] === 'negative')
  const suggestions = sorted.filter(a => SENTIMENT[a.answer] === 'suggestion')
  const top = sorted[0]
  const topPct = Math.round((top.count / total) * 100)

  const sentences = []

  // Sentence 1 — dominant response
  const topPhrase = OPTION_PHRASES[top.answer] || top.answer.toLowerCase()
  if (SENTIMENT[top.answer] === 'positive') {
    sentences.push(`${intro}, the majority of students (${topPct}%) reported that ${topPhrase}.`)
  } else if (SENTIMENT[top.answer] === 'negative') {
    sentences.push(`${intro}, a notable portion of students (${topPct}%) indicated that ${topPhrase}.`)
  } else {
    sentences.push(`${intro}, ${topPct}% of students responded that ${topPhrase}.`)
  }

  // Sentence 2 — positives summary (if top wasn't already positive)
  if (positives.length > 0 && SENTIMENT[top.answer] !== 'positive') {
    const posCount = positives.reduce((s, a) => s + a.count, 0)
    const posPct = Math.round((posCount / total) * 100)
    const posPhrase = positives.slice(0, 2).map(a => OPTION_PHRASES[a.answer] || a.answer.toLowerCase()).join(' and ')
    sentences.push(`On a positive note, ${posPct}% of responses highlighted that ${posPhrase}.`)
  } else if (positives.length > 1) {
    // Multiple positives worth mentioning
    const second = positives[1]
    const secondPct = Math.round((second.count / total) * 100)
    const secondPhrase = OPTION_PHRASES[second.answer] || second.answer.toLowerCase()
    if (secondPct >= 10) {
      sentences.push(`Additionally, ${secondPct}% of students noted that ${secondPhrase}.`)
    }
  }

  // Sentence 3 — negatives / suggestions
  const issueItems = [...negatives, ...suggestions]
  if (issueItems.length > 0) {
    const issueCount = issueItems.reduce((s, a) => s + a.count, 0)
    const issuePct = Math.round((issueCount / total) * 100)
    if (issuePct >= 5) {
      const issuePhrases = issueItems.slice(0, 2).map(a => OPTION_PHRASES[a.answer] || a.answer.toLowerCase())
      if (issuePhrases.length === 1) {
        sentences.push(`Some students suggested that ${issuePhrases[0]}.`)
      } else {
        sentences.push(`Some students suggested that ${issuePhrases[0]}, and ${issuePhrases[1]}.`)
      }
    }
  }

  // Sentence 4 — others mention
  if (otherComments.length > 0) {
    sentences.push(`${otherComments.length} student${otherComments.length > 1 ? 's' : ''} provided additional written feedback which can be reviewed individually.`)
  }

  return sentences.slice(0, 4).join(' ')
}

/**
 * Generate an overall summary from Additional Comments.
 * @param {string[]} comments - array of additional comment strings
 * @returns {string} 2–4 sentence summary
 */
export function generateOverallSummary(comments) {
  const filtered = comments.filter(c => c && c.trim().length > 0)

  if (filtered.length === 0) {
    return 'No additional comments have been submitted by students yet.'
  }

  if (filtered.length === 1) {
    return `One student submitted an additional comment. The feedback can be reviewed in detail below.`
  }

  // Simple keyword analysis for common themes
  const lower = filtered.map(c => c.toLowerCase())
  const total = filtered.length

  const themes = {
    positive:    ['excellent', 'great', 'good', 'amazing', 'best', 'helpful', 'friendly', 'clear', 'appreciate', 'wonderful', 'fantastic'],
    notes:       ['notes', 'slides', 'material', 'upload', 'share', 'pdf', 'handout'],
    practical:   ['practical', 'example', 'coding', 'project', 'lab', 'hands-on', 'real-life', 'application'],
    pace:        ['fast', 'slow', 'speed', 'pace', 'quickly', 'slowly'],
    interaction: ['interaction', 'interactive', 'doubt', 'question', 'approachable', 'available'],
    improvement: ['improve', 'better', 'more', 'need', 'suggest', 'should', 'could', 'recommend'],
  }

  const themeCounts = {}
  for (const [theme, keywords] of Object.entries(themes)) {
    themeCounts[theme] = lower.filter(c => keywords.some(k => c.includes(k))).length
  }

  const sentences = []

  // Sentence 1 — volume
  sentences.push(`A total of ${total} student${total > 1 ? 's' : ''} submitted additional comments regarding this faculty.`)

  // Sentence 2 — positive feedback
  if (themeCounts.positive >= 1) {
    const posPct = Math.round((themeCounts.positive / total) * 100)
    if (posPct >= 20) {
      sentences.push(`Many students expressed appreciation for the faculty's teaching approach and overall engagement.`)
    } else {
      sentences.push(`Several students provided positive remarks about the faculty's teaching style.`)
    }
  }

  // Sentence 3 — common suggestion themes
  const suggestionThemes = []
  if (themeCounts.practical >= 1) suggestionThemes.push('more practical examples')
  if (themeCounts.notes >= 1) suggestionThemes.push('sharing study materials in advance')
  if (themeCounts.pace >= 1) suggestionThemes.push('adjusting the teaching pace')
  if (themeCounts.interaction >= 1) suggestionThemes.push('increased student interaction')

  if (suggestionThemes.length > 0) {
    const listed = suggestionThemes.slice(0, 3).join(', ')
    sentences.push(`Common suggestions include ${listed}.`)
  } else if (themeCounts.improvement >= 1) {
    sentences.push(`Some students offered constructive suggestions for further improvement.`)
  }

  // Sentence 4
  if (sentences.length < 3) {
    sentences.push(`All individual comments are available for detailed review below.`)
  }

  return sentences.slice(0, 4).join(' ')
}
