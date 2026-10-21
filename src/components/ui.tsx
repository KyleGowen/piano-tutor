import { Slot } from '@radix-ui/react-slot';
import * as Tabs from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

// shadcn/ui's composable Button pattern, adapted to this app's CSS tokens.
const buttonVariants = cva('button', {
  variants: {
    variant: { default: 'button-primary', outline: 'button-outline', ghost: 'button-ghost' },
    size: { default: '', small: 'button-small', icon: 'button-icon' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});
export function Button({
  className,
  variant,
  size,
  asChild,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Component = asChild ? Slot : 'button';
  return <Component className={buttonVariants({ variant, size, className })} {...props} />;
}
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
}) {
  return (
    <Tabs.Root value={value} onValueChange={(v) => onChange(v as T)}>
      <Tabs.List className="segmented" aria-label={label}>
        {options.map((option) => (
          <Tabs.Trigger className="segment" key={option.value} value={option.value}>
            {option.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {children}
    </div>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
    </header>
  );
}
