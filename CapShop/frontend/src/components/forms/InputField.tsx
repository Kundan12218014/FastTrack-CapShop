import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?:       string;
  error?:       string;
  helperText?:  string;
}

/**
 * Reusable controlled input field with label, error, and helper text.
 * Uses forwardRef so it works seamlessly with react-hook-form's register().
 *
 * Usage:
 *   <InputField
 *     label="Email address"
 *     type="email"
 *     error={errors.email?.message}
 *     {...register("email")}
 *   />
 */
export const InputField = forwardRef<HTMLInputElement, Props>(
  ({ label, error, helperText, className = "", ...rest }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label}
          {rest.required && <span className="text-danger ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={`input-field ${error ? "input-error" : ""} ${className}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-xs text-danger">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs text-gray-400">{helperText}</p>
      )}
    </div>
  )
);

InputField.displayName = "InputField";