export const INTERVIEW_TYPES = {
  CORE_CSE: 'core_cse',
  DSA: 'dsa',
  BEHAVIORAL: 'behavioral',
  RESUME: 'resume',
  PROJECT: 'project',
};

export const INTERVIEW_TOPICS = {
  [INTERVIEW_TYPES.CORE_CSE]: ['Operating Systems', 'DBMS', 'OOPS', 'Computer Networks', 'Software Engineering', 'System Design basics'],
  [INTERVIEW_TYPES.DSA]: ['Arrays', 'Strings', 'Linked List', 'Stack and Queue', 'Trees', 'Graphs', 'Dynamic Programming', 'Searching and Sorting'],
  [INTERVIEW_TYPES.BEHAVIORAL]: ['HR questions', 'Communication questions', 'Situational questions', 'Strengths and weaknesses', 'Teamwork and leadership'],
  [INTERVIEW_TYPES.RESUME]: ['Skills', 'Internships', 'Achievements', 'Resume projects'],
  [INTERVIEW_TYPES.PROJECT]: ['Technical explanation', 'Architecture', 'Challenges faced', 'Improvements and scalability'],
};

export const DIFFICULTIES = ['easy', 'medium', 'hard'];
