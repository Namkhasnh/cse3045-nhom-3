import type { InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { id: string; label: string }

export function Input({ label, id, className = '', ...props }: InputProps) {
  return <div className="input-field">
    <label htmlFor={id}>{label}</label>
    <input id={id} className={`input ${className}`} {...props} />
  </div>
}
