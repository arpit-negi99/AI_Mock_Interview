import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BrainCircuit, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { Card } from '@/components/ui/Card';

const capabilities = [
  { title: 'Configure interviews', text: 'Pick role, seniority, skills, mode, duration, and response format.', icon: ClipboardCheck },
  { title: 'AI evaluation pipeline', text: 'Structured scoring, rubric alignment, and retry-friendly report states.', icon: BrainCircuit },
  { title: 'Progress intelligence', text: 'Practice plans and dashboards built for high-volume session history.', icon: BarChart3 },
];

export default function Home() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">AI Mock Interview Ecosystem</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-950 sm:text-6xl">Prepare, interview, evaluate, and improve in one production-ready workspace.</h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-600">A scalable frontend foundation for candidate practice, multimodal response submission, AI feedback, admin controls, and future backend integration.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700" to={ROUTES.REGISTER}>Start practicing <ArrowRight className="h-4 w-4" /></Link>
            <Link className="inline-flex items-center rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" to={ROUTES.FEATURES}>View features</Link>
          </div>
        </motion.div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
          <div className="rounded-md bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="font-semibold">Live Interview Session</span>
              <span className="rounded-full bg-teal-400/20 px-3 py-1 text-xs text-teal-100">AI ready</span>
            </div>
            <div className="mt-5 space-y-4">
              {['Question prompt', 'Text response editor', 'Audio/video submission', 'Evaluation queue'].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-md bg-white/8 p-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-teal-500 text-sm font-bold">{index + 1}</span>
                  <span className="text-sm text-slate-100">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {capabilities.map(({ title, text, icon: Icon }) => (
          <Card key={title}>
            <Icon className="h-6 w-6 text-teal-600" />
            <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
