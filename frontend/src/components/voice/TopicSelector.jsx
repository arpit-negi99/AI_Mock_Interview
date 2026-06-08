import { Select } from '@/components/ui/Select';

const topics = [
  { value: 'Operating Systems', label: 'Operating Systems' },
  { value: 'DBMS', label: 'DBMS' },
  { value: 'Arrays', label: 'Arrays' },
  { value: 'Communication questions', label: 'Communication questions' },
  { value: 'Resume projects', label: 'Resume projects' },
];

export function TopicSelector(props) {
  return <Select label="Topic" options={topics} {...props} />;
}
