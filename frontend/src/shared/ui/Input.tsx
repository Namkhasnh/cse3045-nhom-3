import type { InputHTMLAttributes, ReactNode } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string; icon?: ReactNode; trailing?: ReactNode }

export function Input({ label, id, error, className = '', icon, trailing, ...props }: InputProps) {
  const input = <input id={id} className={`input ${className}`} {...props}
    aria-invalid={error ? true : props['aria-invalid']}
    aria-describedby={[props['aria-describedby'], error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined} />
  return <div className="input-field">
    <label htmlFor={id}>{label}</label>
    {icon || trailing ? <div className="input-control">{icon && <span className="input-control__icon" aria-hidden="true">{icon}</span>}{input}{trailing}</div> : input}
    {error && <p id={`${id}-error`} className="field-error">{error}</p>}
  </div>
}
