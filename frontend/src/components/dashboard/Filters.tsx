import { Button, Select } from '../ui';

interface FilterProps {
  type: string;
  status: string;
  direction: string;
}

interface FiltersComponentProps {
  filters: FilterProps;
  onFiltersChange: (filters: FilterProps) => void;
}

export default function Filters({ filters, onFiltersChange }: FiltersComponentProps) {
  const handleFilterChange = (key: keyof FilterProps, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({ type: "", status: "", direction: "" });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select
          label="Filter by Type"
          value={filters.type}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleFilterChange('type', e.target.value)
          }
          options={[
            { value: "", label: "All Types" },
            { value: "cheque", label: "Cheque" },
            { value: "cash", label: "Cash" },
          ]}
        />
        <Select
          label="Filter by Status"
          value={filters.status}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleFilterChange('status', e.target.value)
          }
          options={[
            { value: "", label: "All Status" },
            { value: "pending", label: "Pending" },
            { value: "cleared", label: "Cleared" },
            { value: "bounced", label: "Bounced" },
            { value: "deposited", label: "Deposited" },
          ]}
        />
        <Select
          label="Filter by Direction"
          value={filters.direction}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            handleFilterChange('direction', e.target.value)
          }
          options={[
            { value: "", label: "All Directions" },
            { value: "incoming", label: "Incoming" },
            { value: "outgoing", label: "Outgoing" },
          ]}
        />
        <div className="flex items-end">
          <Button variant="secondary" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
}