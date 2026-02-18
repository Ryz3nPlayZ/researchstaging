interface ProjectFiltersProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

const filters = ['All', 'Active', 'Planning', 'Archived'];

export function ProjectFilters({ activeFilter, onFilterChange }: ProjectFiltersProps) {
    return (
        <div className="flex items-center gap-2">
            {filters.map((filter) => (
                <button
                    key={filter}
                    onClick={() => onFilterChange(filter)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 font-ui ${filter === activeFilter
                        ? 'bg-[#DEF4C6] text-[#1C7C54] shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                >
                    {filter}
                </button>
            ))}
        </div>
    );
}
