function strongest(items = []) {
  return items.find(Boolean);
}

function qualityLevel(extraction = {}) {
  if (extraction.isVague || extraction.confidence < 0.42) return 'low';
  if (extraction.confidence >= 0.75 && extraction.achievements?.length) return 'high';
  return 'medium';
}

function technologyQuestion(technology, relatedSkill) {
  if (/redux/i.test(technology)) return 'How did Redux help manage application state, and what tradeoff did it introduce?';
  if (/node\.js/i.test(technology)) return 'How did Node.js integrate with the frontend, and what API boundary did you design?';
  if (/react/i.test(technology)) return 'What React performance optimizations did you implement, and how did you measure the impact?';
  if (/mongodb|postgresql|mysql/i.test(technology)) return `How did you design the data model around ${technology}, and what query or indexing issue did you handle?`;
  if (/docker|kubernetes|aws|azure|gcp/i.test(technology)) return `What deployment challenge did you face with ${technology}, and how did you debug it?`;
  return `You mentioned ${technology}${relatedSkill ? ` while discussing ${relatedSkill}` : ''}. What was the hardest technical decision you made there?`;
}

export const FollowUpQuestionGenerator = {
  generate({ session = {}, currentQuestion = {}, extraction = {}, memory = {}, relatedExchanges = [] }) {
    const canCross = Number(session.crossQuestionCount || 0) < Number(session.maxCrossQuestions || 2);
    const reachedLimit = Number(session.currentQuestionIndex || 0) + 1 >= Number(session.totalQuestions || 5);
    const quality = qualityLevel(extraction);
    const topic = currentQuestion?.topic || strongest(extraction.skills) || strongest(extraction.technologies) || session.currentTopic || 'that topic';
    const subject = currentQuestion?.subject || 'Interview follow-up';
    const related = relatedExchanges.find((item) => item.questionText !== currentQuestion?.questionText);
    const technology = strongest(extraction.technologies);
    const skill = strongest(extraction.skills);
    const project = strongest(extraction.projectNames);
    const weakness = strongest(extraction.weaknesses);
    const achievement = strongest(extraction.achievements);

    if (reachedLimit) {
      return {
        decision: 'END_INTERVIEW',
        questionText: null,
        questionType: 'closing',
        topic,
        subject,
        expectedConcepts: [],
        reasoning: 'Question limit reached after processing contextual memory.',
      };
    }

    if (!canCross) {
      return null;
    }

    if (quality === 'low') {
      return {
        decision: 'ASK_CLARIFICATION',
        questionText: `Can you make that more concrete for ${topic}: what did you personally do, what constraint mattered most, and what was the result?`,
        questionType: 'clarification',
        topic,
        subject,
        expectedConcepts: ['specific ownership', 'constraint', 'result'],
        reasoning: 'Answer was vague or low-confidence after keyword extraction.',
      };
    }

    if (weakness) {
      return {
        decision: 'ASK_FOLLOWUP',
        questionText: `You mentioned ${weakness}. How did you isolate the root cause, and what would you do differently now?`,
        questionType: 'followup',
        topic,
        subject,
        expectedConcepts: ['debugging', 'root cause', 'reflection'],
        reasoning: 'Candidate surfaced a challenge that should be explored for depth.',
      };
    }

    if (achievement) {
      return {
        decision: 'ASK_FOLLOWUP',
        questionText: `You claimed ${achievement}. How did you measure that impact, and what alternative explanation did you rule out?`,
        questionType: 'followup',
        topic,
        subject,
        expectedConcepts: ['metrics', 'validation', 'tradeoffs'],
        reasoning: 'Candidate made an achievement claim that needs evidence.',
      };
    }

    if (technology) {
      return {
        decision: 'ASK_FOLLOWUP',
        questionText: technologyQuestion(technology, skill),
        questionType: 'followup',
        topic: technology,
        subject,
        expectedConcepts: [skill, technology, 'tradeoffs'].filter(Boolean),
        reasoning: 'Candidate introduced a technology worth probing contextually.',
      };
    }

    if (project) {
      return {
        decision: 'ASK_FOLLOWUP',
        questionText: `For ${project}, what was the most important architecture decision you owned, and what went wrong before it worked?`,
        questionType: 'followup',
        topic: project,
        subject,
        expectedConcepts: ['ownership', 'architecture', 'failure handling'],
        reasoning: 'Candidate mentioned a project name that should be explored.',
      };
    }

    if (related) {
      return {
        decision: 'ASK_FOLLOWUP',
        questionText: `Earlier you discussed ${related.topic || 'a related area'}. How does that connect to your answer about ${topic}?`,
        questionType: 'followup',
        topic,
        subject,
        expectedConcepts: ['connection', 'comparison', 'tradeoff'],
        reasoning: 'Semantic retrieval found a related prior exchange.',
      };
    }

    return null;
  },
};
