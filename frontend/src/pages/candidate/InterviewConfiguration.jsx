import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import {
  BriefcaseBusiness,
  BrainCircuit,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  MessageSquare,
  Play,
  Upload,
} from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { voiceInterviewService } from '@/services/voiceInterviewService';
import { apiClient } from '@/services/apiClient';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/utils/classNames';

const typeOptions = [
  { value: 'core_cse', label: 'Core CSE', icon: Database, tone: '#2563eb' },
  { value: 'dsa', label: 'DSA', icon: Code2, tone: '#7c3aed' },
  { value: 'behavioral', label: 'Behavioral', icon: MessageSquare, tone: '#dc2626' },
  { value: 'resume', label: 'Resume', icon: FileText, tone: '#0891b2' },
  { value: 'project', label: 'Project', icon: BriefcaseBusiness, tone: '#0d9488' },
];

function projectCount(resume) {
  return resume?.parsedProjects?.length || 0;
}

export default function InterviewConfiguration() {
  const navigate = useNavigate();
  const [resumeFile, setResumeFile] = useState(null);
  const [latestResume, setLatestResume] = useState(null);
  const [isLoadingResume, setIsLoadingResume] = useState(true);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { interviewType: 'core_cse', duration: 15, experienceLevel: 'intermediate', difficulty: 'medium', totalQuestions: 5, maxCrossQuestions: 2 },
  });
  const selectedType = useWatch({ control, name: 'interviewType' });
  const needsResume = ['resume', 'project'].includes(selectedType);

  useEffect(() => {
    let mounted = true;
    apiClient.get('/resume/me')
      .then((response) => {
        if (mounted) setLatestResume((response.data || response)?.resume || null);
      })
      .catch(() => {
        if (mounted) setLatestResume(null);
      })
      .finally(() => {
        if (mounted) setIsLoadingResume(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function uploadSelectedResume() {
    if (!resumeFile) return latestResume;

    const formData = new FormData();
    formData.append('resume', resumeFile);
    setIsUploadingResume(true);
    try {
      const response = await apiClient.post('/resume/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const uploaded = (response.data || response)?.resume;
      setLatestResume(uploaded);
      setResumeFile(null);
      return uploaded;
    } finally {
      setIsUploadingResume(false);
    }
  }

  async function onSubmit(values) {
    try {
      if (needsResume && !latestResume && !resumeFile) {
        toast.error('Upload a resume before starting this interview.');
        return;
      }

      const resume = needsResume ? await uploadSelectedResume() : latestResume;
      if (selectedType === 'project' && !projectCount(resume)) {
        toast.error('No projects were found in the resume. Upload a resume that lists your projects.');
        return;
      }

      const response = await voiceInterviewService.start({
        interviewType: values.interviewType,
        selectedSubjects: [],
        selectedTopics: [],
        difficulty: values.difficulty,
        experienceLevel: values.experienceLevel,
        totalQuestions: Number(values.totalQuestions),
        maxCrossQuestions: Number(values.maxCrossQuestions),
        duration: Number(values.duration),
      });
      const data = response.data || response;
      const sessionId = data.session.id || data.session._id;
      navigate(`${ROUTES.INTERVIEW_SESSION}?session=${encodeURIComponent(sessionId)}`, {
        state: {
          sessionId,
          firstQuestion: data.question?.text || data.firstQuestion,
          tts: data.tts,
          duration: Number(values.duration),
        },
      });
    } catch (error) {
      toast.error(error.message || 'Could not start interview');
    }
  }

  return (
    <>
      <PageHeader eyebrow="YOUR NEXT OPPORTUNITY STARTS HERE" title="Practice with purpose." description="A thoughtful conversation, questions that go deeper, and feedback you can act on. Build an interview around your next step." />
      <Card className="p-0">
        <form className="grid gap-0 lg:grid-cols-[1fr_20rem]" onSubmit={handleSubmit(onSubmit)}>
          <section className="p-5 sm:p-6">
            <input type="hidden" {...register('interviewType', { required: true })} />
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
                <BrainCircuit className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Interview format</h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pick the track you want to practice.</p>
              </div>
            </div>


            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {typeOptions.map((option) => {
                const Icon = option.icon;
                const active = selectedType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setValue('interviewType', option.value, { shouldValidate: true })}
                    className={cn(
                      'flex min-h-24 items-start gap-3 rounded-lg border p-4 text-left transition-all duration-200',
                      active && 'shadow-md',
                    )}
                    style={{
                      backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-primary)',
                      borderColor: active ? 'var(--accent)' : 'var(--border-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${option.tone}18`, color: option.tone }}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="mt-1 block text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                        {option.value === 'project' ? 'Resume projects' : option.value === 'resume' ? 'Resume claims' : option.value === 'dsa' ? 'Algorithms' : option.value === 'behavioral' ? 'Stories' : 'CS fundamentals'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Select label="Your experience" {...register('experienceLevel')} options={[{ value: 'fresher', label: 'Entry level / student' }, { value: 'intermediate', label: 'Mid-level professional' }, { value: 'advanced', label: 'Senior / experienced' }]} />
              <Select label="Starting difficulty" {...register('difficulty')} options={[{ value: 'easy', label: 'Build my foundations' }, { value: 'medium', label: 'Challenge my understanding' }, { value: 'hard', label: 'Pressure-test my expertise' }]} />
            </div>
            <div className="mt-8 grid gap-5 border-t pt-6 sm:grid-cols-3" style={{ borderColor: 'var(--border-primary)' }}>
              {[['01', 'A real conversation', 'Follow-ups explore your reasoning and the examples you share.'], ['02', 'Your pace, your voice', 'Speak or type. Review each answer before submitting.'], ['03', 'A useful next step', 'Review your exchanges, strengths, gaps, and practice plan.']].map(([step, title, copy]) => <div key={step}><span className="text-xs font-semibold" style={{ color: 'var(--accent-text)' }}>{step}</span><h3 className="mt-2 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-6" style={{ color: 'var(--text-secondary)' }}>{copy}</p></div>)}
            </div>
          </section>

          <aside className="border-t p-5 sm:p-6 lg:border-l lg:border-t-0" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-primary)' }}>
            <div className="space-y-5">
              <Input
                label="Duration in minutes"
                type="number"
                min="1"
                max="180"
                {...register('duration', { required: 'Duration is required', min: { value: 1, message: 'At least 1 minute' }, max: { value: 180, message: 'Up to 180 minutes' } })}
                error={errors.duration?.message}
              />
              <Select label="Main questions" {...register('totalQuestions')} options={[3, 5, 8, 10].map((value) => ({ value, label: `${value} questions` }))} />
              <Select label="Follow-up depth" {...register('maxCrossQuestions')} options={[{ value: 0, label: 'Main questions only' }, { value: 1, label: 'One follow-up per question' }, { value: 2, label: 'Up to two follow-ups' }, { value: 3, label: 'Deep dive: up to three' }]} />
              <p className="text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>Browser voice input and playback require no paid speech service. If AI is unavailable, you can continue with clearly labeled local practice questions.</p>

              {needsResume && (
                <div className="rounded-lg border p-4" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" style={{ color: 'var(--accent-text)' }} />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Resume</span>
                    </div>
                    {latestResume && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent-text)' }}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Ready
                      </span>
                    )}
                  </div>

                  <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Resume file
                    <input
                      className="mt-2 block w-full rounded-lg border p-2 text-sm"
                      style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
                    />
                  </label>

                  <div className="mt-3 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                    {isLoadingResume
                      ? 'Checking resume...'
                      : latestResume
                        ? `${projectCount(latestResume)} project${projectCount(latestResume) === 1 ? '' : 's'} detected`
                        : 'No resume uploaded'}
                  </div>
                </div>
              )}

              <Button className="w-full" type="submit" icon={needsResume ? Upload : Play} isLoading={isSubmitting || isUploadingResume}>
                {needsResume && resumeFile ? 'Upload and Start' : 'Start Interview'}
              </Button>
            </div>
          </aside>
        </form>
      </Card>
    </>
  );
}
