import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, BarChart3, CalendarDays, CheckCircle2, Lightbulb, ListChecks, PlayCircle, Trophy, TrendingUp } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { interviewService } from '@/services/interviewService';
import { formatDate } from '@/utils/formatters';

const ranges = [
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'All time', value: 'all' },
];

const colors = ['#0d9488', '#2563eb', '#dc2626', '#7c3aed', '#ca8a04', '#0891b2'];

function points(values, width = 360, height = 120) {
  if (!values.length) return '';
  const max = 10;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  return values.map((value, index) => {
    const x = index * step;
    const y = height - (Math.max(0, Math.min(max, Number(value || 0))) / max) * height;
    return `${x},${y}`;
  }).join(' ');
}

function LineChart({ data = [], keys = ['overallScore'] }) {
  return (
    <svg viewBox="0 0 360 140" className="h-40 w-full overflow-visible" role="img" aria-label="Performance trend chart">
      {[0, 1, 2, 3].map((item) => <line key={item} x1="0" x2="360" y1={item * 40} y2={item * 40} stroke="var(--border-primary)" strokeWidth="1" />)}
      {keys.map((key, index) => (
        <polyline
          key={key}
          fill="none"
          stroke={colors[index % colors.length]}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points(data.map((item) => item[key]))}
        />
      ))}
    </svg>
  );
}

function SkillGrowthChart({ series = [] }) {
  const labels = series.slice(0, 5);
  return (
    <div>
      <svg viewBox="0 0 360 140" className="h-40 w-full overflow-visible" role="img" aria-label="Skill growth over time chart">
        {[0, 1, 2, 3].map((item) => <line key={item} x1="0" x2="360" y1={item * 40} y2={item * 40} stroke="var(--border-primary)" strokeWidth="1" />)}
        {labels.map((item, index) => (
          <polyline
            key={item.skill}
            fill="none"
            stroke={colors[index % colors.length]}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points((item.values || []).map((value) => value.score))}
          />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3">
        {labels.map((item, index) => (
          <span key={item.skill} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colors[index % colors.length] }} />
            {item.skill}
          </span>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data = [] }) {
  return (
    <div className="flex h-40 items-end gap-2">
      {data.slice(-8).map((item, index) => (
        <div key={`${item.date}-${index}`} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-md"
            style={{ height: `${Math.max(8, item.completionRate || 0)}%`, backgroundColor: colors[index % colors.length] }}
            title={`${item.completionRate}%`}
          />
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{item.completionRate}%</span>
        </div>
      ))}
    </div>
  );
}

function RadarChart({ data = [] }) {
  const size = 180;
  const center = size / 2;
  const radius = 70;
  const labels = data.slice(0, 6);
  const polygon = labels.map((item, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(labels.length, 1) - Math.PI / 2;
    const value = Math.max(0, Math.min(10, item.score || 0)) / 10;
    return `${center + Math.cos(angle) * radius * value},${center + Math.sin(angle) * radius * value}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-48 w-full" role="img" aria-label="Topic coverage radar chart">
      {[0.33, 0.66, 1].map((scale) => (
        <circle key={scale} cx={center} cy={center} r={radius * scale} fill="none" stroke="var(--border-primary)" />
      ))}
      {labels.map((item, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(labels.length, 1) - Math.PI / 2;
        return (
          <g key={item.topic}>
            <line x1={center} y1={center} x2={center + Math.cos(angle) * radius} y2={center + Math.sin(angle) * radius} stroke="var(--border-primary)" />
            <text x={center + Math.cos(angle) * (radius + 18)} y={center + Math.sin(angle) * (radius + 18)} textAnchor="middle" className="fill-current text-[10px]" style={{ color: 'var(--text-secondary)' }}>{item.topic.slice(0, 12)}</text>
          </g>
        );
      })}
      <polygon points={polygon} fill="rgba(13,148,136,0.2)" stroke="#0d9488" strokeWidth="3" />
    </svg>
  );
}

function PieChart({ strengths = 0, weaknesses = 0 }) {
  const total = Math.max(1, strengths + weaknesses);
  const strengthPct = strengths / total;
  const dash = `${strengthPct * 100} ${100 - strengthPct * 100}`;
  return (
    <div className="flex items-center justify-center gap-5">
      <svg viewBox="0 0 42 42" className="h-36 w-36 rotate-[-90deg]" role="img" aria-label="Strength versus weakness distribution">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#dc2626" strokeWidth="8" />
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#0d9488" strokeWidth="8" strokeDasharray={dash} strokeDashoffset="25" />
      </svg>
      <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <p><span className="mr-2 inline-block h-3 w-3 rounded-sm bg-[#0d9488]" />Strengths: {strengths}</p>
        <p><span className="mr-2 inline-block h-3 w-3 rounded-sm bg-[#dc2626]" />Weaknesses: {weaknesses}</p>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, suffix = '' }) {
  return (
    <Card animate={false} className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
          <p className="mt-1 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{value}{suffix}</p>
        </div>
        <Icon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
      </div>
    </Card>
  );
}

function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
        {description ? <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p> : null}
      </div>
    </div>
  );
}

function MiniList({ items = [], empty, renderItem }) {
  if (!items.length) return <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{empty}</p>;
  return <div className="space-y-3">{items.map(renderItem)}</div>;
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState('90d');
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    interviewService.getAnalytics({ range })
      .then((response) => {
        if (active) setAnalytics(response.data);
      })
      .catch(() => {
        if (active) setAnalytics(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [range]);

  const trendKeys = useMemo(() => ['overallScore', 'technicalScore', 'communicationScore', 'confidenceScore'], []);
  const summary = analytics?.summary || {};
  const hasHistory = Boolean(analytics?.interviewHistory?.length);
  const recentInterviews = useMemo(() => (analytics?.interviewHistory || []).slice(0, 4), [analytics]);
  const skillLeaderboard = useMemo(() => {
    const latestBySkill = (analytics?.skillGrowth || []).map((item) => ({
      skill: item.skill,
      score: item.values?.[item.values.length - 1]?.score || 0,
    }));
    const topicScores = (analytics?.topicCoverage || []).map((item) => ({ skill: item.topic, score: item.score || 0 }));
    return [...latestBySkill, ...topicScores]
      .reduce((acc, item) => (acc.some((entry) => entry.skill === item.skill) ? acc : [...acc, item]), [])
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [analytics]);
  const weakAreas = useMemo(() => skillLeaderboard.filter((item) => item.score < 7).slice(0, 4), [skillLeaderboard]);
  const aiRecommendations = useMemo(() => {
    if (!hasHistory) return ['Complete one mock interview to unlock personalized AI recommendations.'];
    const target = weakAreas[0]?.skill || analytics?.topicCoverage?.[0]?.topic || 'your weakest topic';
    return [
      `Spend one focused session on ${target} and prepare a concrete project example.`,
      'Practice answers with a metric, a tradeoff, and a debugging detail.',
      summary.improvementPercentage >= 0 ? 'Keep the current practice cadence and raise question difficulty gradually.' : 'Review your last report before starting the next interview.',
    ];
  }, [analytics, hasHistory, summary.improvementPercentage, weakAreas]);
  const roadmap = useMemo(() => {
    const firstWeak = weakAreas[0]?.skill || 'core fundamentals';
    const secondWeak = weakAreas[1]?.skill || 'communication clarity';
    return [
      { step: 'Next interview', detail: `Run a targeted mock interview on ${firstWeak}.` },
      { step: 'This week', detail: `Review missed concepts and write two STAR-style examples for ${secondWeak}.` },
      { step: 'Next milestone', detail: 'Aim for a readiness score above 80 and complete three interviews in the selected range.' },
    ];
  }, [weakAreas]);
  const upcomingInterviews = [];

  return (
    <>
      <PageHeader
        eyebrow="Candidate workspace"
        title="Interview analytics dashboard"
        description="Track interview history, skill growth, completion rate, topic coverage, and readiness trends."
        actions={<Link to={ROUTES.INTERVIEW_CONFIGURATION}><Button icon={PlayCircle}>New mock interview</Button></Link>}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {ranges.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setRange(item.value)}
            className="rounded-lg border px-3 py-2 text-sm font-medium"
            style={{
              borderColor: range === item.value ? 'var(--accent)' : 'var(--border-primary)',
              backgroundColor: range === item.value ? 'var(--accent-soft)' : 'var(--bg-secondary)',
              color: range === item.value ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {!isLoading && !hasHistory ? (
        <div className="space-y-5">
          <Card animate={false} className="p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--accent-text)' }}>Welcome back</p>
                <h2 className="mt-1 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Candidate'}</h2>
                <p className="mt-2 max-w-2xl text-sm" style={{ color: 'var(--text-secondary)' }}>Start a mock interview to generate performance trends, skill scores, recommendations, alerts, and a roadmap.</p>
              </div>
              <Link to={ROUTES.INTERVIEW_CONFIGURATION}><Button icon={PlayCircle}>Start first interview</Button></Link>
            </div>
          </Card>
          <Card className="p-8">
            <EmptyState title="No interview activity yet" description="Your completed sessions and AI feedback reports will appear here after you finish an interview." />
          </Card>
        </div>
      ) : (
        <div className="space-y-5">
          <Card animate={false} className="p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--accent-text)' }}>Welcome back</p>
                <h2 className="mt-1 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Candidate'}</h2>
                <p className="mt-2 max-w-3xl text-sm" style={{ color: 'var(--text-secondary)' }}>
                  You have completed {summary.interviewCount || 0} interviews in this view with an average score of {summary.averageScore || 0}/10.
                </p>
              </div>
              <div className="grid min-w-64 grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Best score</p>
                  <p className="mt-1 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{summary.bestScore || 0}/10</p>
                </div>
                <div className="rounded-lg border p-3" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>Improvement</p>
                  <p className="mt-1 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{summary.improvementPercentage || 0}%</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card animate={false}>
              <SectionTitle icon={CalendarDays} title="Upcoming interviews" description="Scheduled sessions and quick-start practice." />
              <MiniList
                items={upcomingInterviews}
                empty="No scheduled interviews yet. Start a mock interview whenever you are ready."
                renderItem={(item) => <div key={item.id}>{item.title}</div>}
              />
              <Link to={ROUTES.INTERVIEW_CONFIGURATION} className="mt-4 inline-flex">
                <Button variant="secondary" icon={PlayCircle}>Schedule practice</Button>
              </Link>
            </Card>

            <Card animate={false}>
              <SectionTitle icon={Activity} title="Recent interviews" description="Latest completed sessions." />
              <MiniList
                items={recentInterviews}
                empty="Completed interviews will appear here."
                renderItem={(item) => (
                  <Link key={item.sessionId} to={ROUTES.FEEDBACK_REPORT} state={{ sessionId: item.sessionId }} className="block rounded-lg border p-3" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{String(item.interviewType || '').replace(/_/g, ' ')}</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>{item.finalScore}/10</span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(item.date, 'MMM d, yyyy h:mm a')} · {item.duration} min</p>
                  </Link>
                )}
              />
            </Card>

            <Card animate={false}>
              <SectionTitle icon={Trophy} title="Skill leaderboard" description="Highest current skill scores." />
              <MiniList
                items={skillLeaderboard}
                empty="Skill scores unlock after your first completed interview."
                renderItem={(item, index) => (
                  <div key={item.skill} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)' }}>{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate" style={{ color: 'var(--text-primary)' }}>{item.skill}</span>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{Number(item.score || 0).toFixed(1)}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, Number(item.score || 0) * 10)}%`, backgroundColor: colors[index % colors.length] }} />
                      </div>
                    </div>
                  </div>
                )}
              />
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card animate={false}>
              <SectionTitle icon={Lightbulb} title="AI recommendations" description="Practice suggestions from recent performance." />
              <ul className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {aiRecommendations.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--accent)' }} />{item}</li>)}
              </ul>
            </Card>

            <Card animate={false}>
              <SectionTitle icon={AlertTriangle} title="Weak area alerts" description="Skills below the target threshold." />
              <MiniList
                items={weakAreas}
                empty="No weak-area alerts in the selected range."
                renderItem={(item) => (
                  <div key={item.skill} className="rounded-lg border p-3" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--danger-soft)' }}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.skill}</span>
                      <span style={{ color: 'var(--danger-text)' }}>{Number(item.score || 0).toFixed(1)}/10</span>
                    </div>
                  </div>
                )}
              />
            </Card>

            <Card animate={false}>
              <SectionTitle icon={ListChecks} title="Improvement roadmap" description="A short plan for the next practice cycle." />
              <div className="space-y-4">
                {roadmap.map((item, index) => (
                  <div key={item.step} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)' }}>{index + 1}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.step}</p>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle icon={BarChart3} title="Performance summary" description="Score, trend, coverage, and completion analytics." />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={CalendarDays} label="Interview count" value={summary.interviewCount || 0} />
            <MetricCard icon={Activity} label="Average score" value={summary.averageScore || 0} suffix="/10" />
            <MetricCard icon={BarChart3} label="Best score" value={summary.bestScore || 0} suffix="/10" />
            <MetricCard icon={TrendingUp} label="Improvement" value={summary.improvementPercentage || 0} suffix="%" />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card animate={false}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Overall performance trend</h2>
              <LineChart data={analytics?.trends || []} keys={['overallScore']} />
            </Card>
            <Card animate={false}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Skill growth over time</h2>
              <SkillGrowthChart series={analytics?.skillGrowth || []} />
            </Card>
            <Card animate={false}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Interview completion rate</h2>
              <BarChart data={analytics?.completionRates || []} />
            </Card>
            <Card animate={false}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Topic coverage</h2>
              <RadarChart data={analytics?.topicCoverage || []} />
            </Card>
            <Card animate={false}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Strength vs weakness distribution</h2>
              <PieChart strengths={analytics?.strengthWeaknessDistribution?.strengths || 0} weaknesses={analytics?.strengthWeaknessDistribution?.weaknesses || 0} />
            </Card>
            <Card animate={false}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Interview history</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead style={{ color: 'var(--text-secondary)' }}>
                    <tr>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium">Type</th>
                      <th className="pb-2 font-medium">Duration</th>
                      <th className="pb-2 font-medium">Final score</th>
                      <th className="pb-2 font-medium">Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics?.interviewHistory || []).map((item) => (
                      <tr key={item.sessionId} className="border-t" style={{ borderColor: 'var(--border-primary)' }}>
                        <td className="py-3">{formatDate(item.date, 'MMM d, yyyy h:mm a')}</td>
                        <td className="py-3 capitalize">{String(item.interviewType || '').replace(/_/g, ' ')}</td>
                        <td className="py-3">{item.duration} min</td>
                        <td className="py-3">{item.finalScore}/10</td>
                        <td className="py-3">
                          <Link className="font-medium" style={{ color: 'var(--accent-text)' }} to={ROUTES.FEEDBACK_REPORT} state={{ sessionId: item.sessionId }}>Open</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card animate={false}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Candidate progress graph</h2>
              <LineChart data={analytics?.trends || []} keys={trendKeys} />
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Overall, technical, communication, and confidence scores</p>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
