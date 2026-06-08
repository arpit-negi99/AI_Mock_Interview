import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/common/PageHeader';

const features = ['Role-based routing', 'Mock-ready API services', 'Text, audio, and video response UI', 'Evaluation and feedback pages', 'Admin question bank and rubrics', 'Search, filters, pagination-ready tables'];

export default function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageHeader title="Platform Features" description="Every screen is structured so real APIs can replace dummy data without changing the user-facing flow." />
      <Card>
        <div className="grid gap-3 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature} className="flex items-center gap-3 rounded-md bg-slate-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-medium text-slate-700">{feature}</span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
