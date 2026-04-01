import { SlidersHorizontal, X } from "lucide-react";
import type { CategoryDto } from "../../api/catalogApi";

interface Props {
  categories:        CategoryDto[];
  selectedCategory?: number;
  minPrice?:         number;
  maxPrice?:         number;
  onCategoryChange:  (id: number | undefined) => void;
  onMinPriceChange:  (val: number | undefined) => void;
  onMaxPriceChange:  (val: number | undefined) => void;
  onClear:           () => void;
}

export const FilterSidebar = ({
  categories,
  selectedCategory,
  minPrice,
  maxPrice,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onClear,
}: Props) => {
  const hasFilters = selectedCategory || minPrice || maxPrice;

  return (
    <div className="card p-5 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-primary" />
          <h3 className="font-bold text-primary text-sm">Filters</h3>
        </div>
        {hasFilters && (
          <button onClick={onClear}
            className="flex items-center gap-1 text-xs text-danger hover:underline">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Category */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Category
        </p>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio" name="cat" checked={!selectedCategory}
              onChange={() => onCategoryChange(undefined)}
              className="accent-primary"
            />
            <span className="text-sm text-gray-700 group-hover:text-primary transition-colors">
              All
            </span>
          </label>
          {categories.map(c => (
            <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio" name="cat" checked={selectedCategory === c.id}
                onChange={() => onCategoryChange(c.id)}
                className="accent-primary"
              />
              <span className="text-sm text-gray-700 group-hover:text-primary transition-colors">
                {c.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Price (₹)
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            defaultValue={minPrice}
            min={0}
            onBlur={e => onMinPriceChange(e.target.value ? Number(e.target.value) : undefined)}
            className="input-field text-xs py-1.5"
          />
          <input
            type="number"
            placeholder="Max"
            defaultValue={maxPrice}
            min={0}
            onBlur={e => onMaxPriceChange(e.target.value ? Number(e.target.value) : undefined)}
            className="input-field text-xs py-1.5"
          />
        </div>
      </div>
    </div>
  );
};