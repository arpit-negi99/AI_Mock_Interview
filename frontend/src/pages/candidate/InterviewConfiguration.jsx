import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ROUTES } from '@/constants/routes';
import { voiceInterviewService } from '@/services/voiceInterviewService';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DifficultySelector } from '@/components/voice/DifficultySelector';

const typeOptions = [
  { value: 'core_cse', label: 'Core CSE Subjects' },
  { value: 'dsa', label: 'DSA Interview' },
  { value: 'behavioral', label: 'Behavioral Interview' },
  { value: 'resume', label: 'Resume-Based Interview' },
  { value: 'project', label: 'Project-Based Interview' },
];

export default function InterviewConfiguration() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { interviewType: 'core_cse', difficulty: 'medium', duration: 15 },
  });

  async function onSubmit(values) {
    try {
      const response = await voiceInterviewService.start({
        interviewType: values.interviewType,
        selectedSubjects: [],
        selectedTopics: [],
        difficulty: values.difficulty,
        totalQuestions: 5,
        duration: Number(values.duration),
      });
      const data = response.data || response;
      const sessionId = data.session.id || data.session._id;
      navigate(ROUTES.INTERVIEW_SESSION, { state: { sessionId, firstQuestion: data.question?.text || data.firstQuestion, tts: data.tts, duration: Number(values.duration) } });
    } catch (error) {
      toast.error(error.message || 'Could not start interview');
    }
  }

  return (
    <>
      <PageHeader title="Voice interview setup" description="Choose the interview format and session length. The AI will select relevant questions from the active syllabus." />
      <Card>
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Select label="Interview category" {...register('interviewType', { required: true })} options={typeOptions} />
          <DifficultySelector {...register('difficulty')} />
          <Input label="Duration in minutes" type="number" min="1" max="180" {...register('duration', { required: 'Duration is required' })} error={errors.duration?.message} />
          <div className="md:col-span-2"><Button type="submit" isLoading={isSubmitting}>Start Voice Interview</Button></div>
        </form>
      </Card>
    </>
  );
}
