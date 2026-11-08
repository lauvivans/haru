import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx } from '@/cx';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: ReactNode };

export function Field({ label, hint, className, ...rest }: Props) {
  const id = useId();
  return (
    <div className={cx('field', className)}>
      <label htmlFor={id}>{label}</label>
      <input
        className="input"
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {hint && (
        <span className="field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
    </div>
  );
}
