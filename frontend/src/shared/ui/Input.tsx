import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }

export function Input({ label, id, error, className = '', ...props }: InputProps) {
  return <div className="input-field">
    <label htmlFor={id}>{label}</label>
    <input id={id} className={`input ${className}`} {...props}
      aria-invalid={error ? true : props['aria-invalid']}
      aria-describedby={[props['aria-describedby'], error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined} />
    {error && <p id={`${id}-error`} className="field-error">{error}</p>}
  </div>
}
