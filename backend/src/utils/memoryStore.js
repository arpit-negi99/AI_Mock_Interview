export const memoryStore = {
  users: [],
  sessions: [],
  messages: [],
  syllabus: [],
  questions: [
    {
      id: 'q-os-1',
      subject: 'Operating Systems',
      topic: 'Processes',
      difficulty: 'easy',
      questionText: 'What is the difference between a process and a thread?',
      expectedConcepts: ['address space', 'scheduling', 'resource sharing'],
      questionType: 'MAIN',
      isActive: true,
    },
    {
      id: 'q-dsa-1',
      subject: 'DSA',
      topic: 'Arrays',
      difficulty: 'medium',
      questionText: 'Given an array, how would you find two numbers that add up to a target?',
      expectedConcepts: ['hash map', 'time complexity', 'edge cases'],
      questionType: 'MAIN',
      isActive: true,
    },
  ],
  resumes: [],
  auditLogs: [],
};

export function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
