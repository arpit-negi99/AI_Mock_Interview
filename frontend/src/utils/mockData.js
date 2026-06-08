export const dashboardStats = [
  { label: 'Mock interviews', value: '18', change: '+4 this month' },
  { label: 'Average score', value: '82%', change: '+9% improvement' },
  { label: 'Practice streak', value: '12 days', change: 'Strong consistency' },
  { label: 'Pending actions', value: '3', change: 'Review feedback' },
];

export const recentInterviews = [
  { id: 1, role: 'Frontend Engineer', type: 'Technical', score: 86, status: 'Evaluated', date: '2026-06-05' },
  { id: 2, role: 'Product Analyst', type: 'Behavioral', score: 78, status: 'Needs review', date: '2026-06-02' },
  { id: 3, role: 'Data Scientist', type: 'Case Study', score: 83, status: 'Evaluated', date: '2026-05-29' },
];

export const questions = [
  { id: 'Q-1021', skill: 'React', difficulty: 'Medium', type: 'Technical', updatedAt: '2026-06-03' },
  { id: 'Q-1022', skill: 'System Design', difficulty: 'Hard', type: 'Architecture', updatedAt: '2026-06-01' },
  { id: 'Q-1023', skill: 'Leadership', difficulty: 'Medium', type: 'Behavioral', updatedAt: '2026-05-27' },
];

export const notifications = [
  { id: 1, title: 'Evaluation ready', body: 'Your Frontend Engineer mock interview report is available.', createdAt: '2026-06-06T09:00:00Z' },
  { id: 2, title: 'Practice plan updated', body: 'Two new communication drills were added to your plan.', createdAt: '2026-06-04T14:30:00Z' },
];

export const auditLogs = [
  { id: 'A-9081', actor: 'Admin', action: 'Added React question', status: 'Success', createdAt: '2026-06-07T08:20:00Z' },
  { id: 'A-9082', actor: 'System', action: 'Generated evaluation report', status: 'Success', createdAt: '2026-06-06T18:10:00Z' },
];
