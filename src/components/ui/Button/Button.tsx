import type { ButtonHTMLAttributes } from 'react';
import { cx } from '@/cx';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  small?: boolean;
  block?: boolean;
};

export function Button({
  variant = 'primary',
  small,
  block,
  className,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={cx(
        'btn',
        `btn--${variant}`,
        small && 'btn--small',
        block && 'btn--block',
        className,
      )}
      {...rest}
    />
  );
}
