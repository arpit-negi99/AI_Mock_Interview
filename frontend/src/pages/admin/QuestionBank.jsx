import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { questions } from '@/utils/mockData';
import { formatDate } from '@/utils/formatters';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/common/PageHeader';
import { DataToolbar } from '@/components/common/DataToolbar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function QuestionBank() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const debouncedSearch = useDebounce(search);
  const filteredQuestions = useMemo(() => questions.filter((item) => {
    const matchesSearch = item.skill.toLowerCase().includes(debouncedSearch.toLowerCase()) || item.type.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchesFilter = filter === 'all' || item.difficulty.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  }), [debouncedSearch, filter]);

  return (
    <>
      <PageHeader title="Question bank" description="Searchable and filterable content table ready for server-side pagination." actions={<Link to={ROUTES.ADD_QUESTION}><Button icon={Plus}>Add question</Button></Link>} />
      <Card className="p-5">
        <DataToolbar search={search} onSearchChange={setSearch} filter={filter} onFilterChange={setFilter} filterOptions={[{ value: 'all', label: 'All difficulties' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }]} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>
              <tr><th className="p-3">ID</th><th className="p-3">Skill</th><th className="p-3">Type</th><th className="p-3">Difficulty</th><th className="p-3">Updated</th></tr>
            </thead>
            <tbody style={{ color: 'var(--text-secondary)' }}>
              {filteredQuestions.map((item) => (
                <tr key={item.id} className="border-t transition-colors duration-150" style={{ borderColor: 'var(--border-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td className="p-3 font-medium" style={{ color: 'var(--text-primary)' }}>{item.id}</td><td className="p-3">{item.skill}</td><td className="p-3">{item.type}</td>
                  <td className="p-3"><Badge tone={item.difficulty === 'Hard' ? 'rose' : 'amber'}>{item.difficulty}</Badge></td>
                  <td className="p-3">{formatDate(item.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
