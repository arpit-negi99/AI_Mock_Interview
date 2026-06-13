export function QuestionCard({ question }) {
  return (
    <div className="border border-slate-800 bg-slate-950/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Current question</p>
      <h2 className="mt-3 text-xl font-semibold leading-snug text-slate-50 sm:text-2xl">{question || 'Start a voice interview to receive your first question.'}</h2>
    </div>
  );
}
