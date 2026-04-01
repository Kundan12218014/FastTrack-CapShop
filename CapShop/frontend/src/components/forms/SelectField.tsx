import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";

interface Option {
  value: string | number;
  label: string;
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:       string;
  error?:       string;
  options:      Option[];
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, options, placeholder, className = "", ...rest }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label}
          {rest.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={`input-field ${error ? "input-error" : ""} ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-danger">{error}</p>
      )}
    </div>
  )
);

SelectField.displayName = "SelectField";