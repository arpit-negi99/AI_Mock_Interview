import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export function DataToolbar({ search, onSearchChange, filter, onFilterChange, filterOptions = [] }) {
  return (
    <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
      <Input label="Search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search records" />
      <Select label="Filter" value={filter} onChange={(event) => onFilterChange(event.target.value)} options={filterOptions} />
    </div>
  );
}
