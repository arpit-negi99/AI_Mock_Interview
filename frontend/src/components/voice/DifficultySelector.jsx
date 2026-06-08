import { Select } from '@/components/ui/Select';

export function DifficultySelector(props) {
  return <Select label="Difficulty" options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'Hard'.toLowerCase(), label: 'Hard' }]} {...props} />;
}
