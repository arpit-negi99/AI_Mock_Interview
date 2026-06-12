import { INTERVIEW_TYPES } from '../../constants/interviewTypes.js';

export const sampleSyllabus = [
  {
    interviewType: INTERVIEW_TYPES.CORE_CSE,
    subject: 'Operating Systems',
    topics: ['Process Scheduling', 'Memory Management', 'Deadlocks', 'File Systems', 'Virtual Memory'],
    difficulty: 'medium',
    description: 'Assess conceptual clarity and ability to connect OS mechanisms with real systems.',
    sampleConcepts: ['process vs thread', 'CPU scheduling tradeoffs', 'deadlock prevention', 'paging'],
  },
  {
    interviewType: INTERVIEW_TYPES.DSA,
    subject: 'Arrays and Strings',
    topics: ['Two Pointers', 'Sliding Window', 'Hashing', 'Prefix Sums'],
    difficulty: 'medium',
    description: 'Focus on problem solving, complexity analysis, and edge cases.',
    sampleConcepts: ['time complexity', 'space complexity', 'edge cases', 'optimization'],
  },
  {
    interviewType: INTERVIEW_TYPES.BEHAVIORAL,
    subject: 'Leadership Scenarios',
    topics: ['Conflict Resolution', 'Ownership', 'Communication', 'Learning From Failure'],
    difficulty: 'easy',
    description: 'Probe STAR-format storytelling and self-awareness.',
    sampleConcepts: ['situation', 'task', 'action', 'result', 'reflection'],
  },
  {
    interviewType: INTERVIEW_TYPES.RESUME,
    subject: 'Resume Deep Dive',
    topics: ['Skills', 'Internships', 'Achievements', 'Tradeoffs'],
    difficulty: 'medium',
    description: 'Ask the candidate to defend resume claims with concrete evidence.',
    sampleConcepts: ['impact', 'ownership', 'metrics', 'technical depth'],
  },
  {
    interviewType: INTERVIEW_TYPES.PROJECT,
    subject: 'Project Architecture',
    topics: ['System Design', 'Data Model', 'Scalability', 'Debugging', 'Deployment'],
    difficulty: 'medium',
    description: 'Evaluate project depth, architecture choices, and production reasoning.',
    sampleConcepts: ['architecture', 'constraints', 'tradeoffs', 'failure handling'],
  },
];
