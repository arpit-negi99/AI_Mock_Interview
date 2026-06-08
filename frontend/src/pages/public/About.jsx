import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/common/PageHeader';

export default function About() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageHeader title="About InterviewAI" description="A frontend architecture for realistic mock interview workflows, evaluation reports, and operational administration." />
      <div className="grid gap-4 lg:grid-cols-3">
        {['Candidate-first practice', 'AI-ready evaluation', 'Admin governance'].map((title) => (
          <Card key={title}>
            <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">Built with reusable React components, protected routes, role guards, service boundaries, and scalable data views.</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
