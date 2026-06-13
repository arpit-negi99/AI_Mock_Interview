import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, FileJson, FileText, Table } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ROUTES } from '@/constants/routes';
import { interviewService } from '@/services/interviewService';
import { formatDate } from '@/utils/formatters';

function ScoreBar({ label, value }) {
  const score = Math.max(0, Math.min(10, Number(value || 0)));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{score}/10</span>
      </div>
      <div className="h-2 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        <div className="h-2 rounded-full" style={{ width: `${score * 10}%`, backgroundColor: 'var(--accent)' }} />
      </div>
    </div>
  );
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function FeedbackReport() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = location.state?.sessionId;
  const [report, setReport] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(sessionId));
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    let active = true;
    setIsLoading(true);
    interviewService.getReport(sessionId)
      .then((response) => {
        if (!active) return;
        setReport(response.data?.interviewReport);
        setSession(response.data?.session);
      })
      .catch((error) => toast.error(error.message || 'Unable to load report'))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [sessionId]);

  const exportReport = async (format) => {
    try {
      setExporting(format);
      const blob = await interviewService.exportReport(sessionId, format);
      downloadBlob(blob, `interview-report.${format}`);
    } catch (error) {
      toast.error(error.message || `Unable to export ${format.toUpperCase()}`);
    } finally {
      setExporting('');
    }
  };

  if (!sessionId) {
    return (
      <>
        <PageHeader title="Feedback report" description="Choose a completed interview from your dashboard to open its report." />
        <Card className="p-8">
          <EmptyState title="No report selected" description="Open a completed interview report from the analytics dashboard." />
          <div className="mt-5">
            <Button icon={Download} onClick={() => navigate(ROUTES.CANDIDATE_DASHBOARD)}>Go to dashboard</Button>
          </div>
        </Card>
      </>
    );
  }

  if (isLoading) return <Loader label="Loading interview report" />;

  if (!report) {
    return (
      <>
        <PageHeader title="Feedback report" description="This interview does not have a completed report yet." />
        <Card className="p-8">
          <EmptyState title="Report unavailable" description="Complete the interview to generate a professional report." />
        </Card>
      </>
    );
  }

  const analysis = report.performanceAnalysis || {};

  return (
    <>
      <PageHeader
        eyebrow="Interview report"
        title={`${report.candidateInfo?.name || 'Candidate'} performance report`}
        description="Professional evaluation across skills, communication, confidence, clarity, domain expertise, and readiness."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={FileJson} isLoading={exporting === 'json'} onClick={() => exportReport('json')}>JSON</Button>
            <Button variant="secondary" icon={Table} isLoading={exporting === 'csv'} onClick={() => exportReport('csv')}>CSV</Button>
            <Button icon={FileText} isLoading={exporting === 'pdf'} onClick={() => exportReport('pdf')}>PDF</Button>
          </div>
        )}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card animate={false}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Interview type', String(report.interviewType || '').replace(/_/g, ' ')],
              ['Date & time', formatDate(report.startedAt, 'MMM d, yyyy h:mm a')],
              ['Total questions', report.totalQuestions],
              ['Duration', `${report.durationMinutes} min`],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                <p className="mt-1 font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card animate={false}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Interview readiness score</p>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-5xl font-semibold" style={{ color: 'var(--accent-text)' }}>{report.aiFeedback?.interviewReadinessScore || 0}</span>
            <span className="pb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>/100</span>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Final score: {report.finalScore}/10</p>
        </Card>

        <Card animate={false}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Performance analysis</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ScoreBar label="Technical knowledge" value={analysis.technicalKnowledge} />
            <ScoreBar label="Communication" value={analysis.communication} />
            <ScoreBar label="Problem solving" value={analysis.problemSolving} />
            <ScoreBar label="Confidence" value={analysis.confidence} />
            <ScoreBar label="Clarity" value={analysis.clarity} />
            <ScoreBar label="Domain expertise" value={analysis.domainExpertise} />
          </div>
        </Card>

        <Card animate={false}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Skills assessed</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(report.skillsAssessed || []).map((skill) => (
              <span key={skill} className="rounded-md px-2.5 py-1 text-sm" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)' }}>{skill}</span>
            ))}
          </div>
        </Card>

        <Card animate={false}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Skill breakdown</h2>
          <div className="mt-5 space-y-4">
            {(report.skillBreakdown || []).map((skill) => <ScoreBar key={skill.label} label={skill.label} value={skill.score} />)}
          </div>
        </Card>

        <Card animate={false}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>AI feedback</h2>
          <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{report.aiFeedback?.detailedFeedback}</p>
          <h3 className="mt-5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Suggested learning resources</h3>
          <ul className="mt-3 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {(report.aiFeedback?.suggestedLearningResources || []).map((resource) => <li key={resource}>{resource}</li>)}
          </ul>
        </Card>

        <Card animate={false}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Strengths</h2>
          <ul className="mt-4 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {(report.strengths || []).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Card>

        <Card animate={false}>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Areas for improvement</h2>
          <ul className="mt-4 space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {(report.areasForImprovement || []).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Card>
      </div>

      {session?.finalEvaluation?.summary ? (
        <p className="mt-5 text-sm" style={{ color: 'var(--text-tertiary)' }}>{session.finalEvaluation.summary}</p>
      ) : null}
    </>
  );
}
