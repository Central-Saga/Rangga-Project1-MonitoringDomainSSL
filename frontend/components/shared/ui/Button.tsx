import type { ButtonHTMLAttributes, FC, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-r from-accent to-accent-2 text-on-accent shadow-card hover:shadow-pop",
  secondary: "border border-line bg-card text-ink hover:bg-subtle",
  ghost: "text-soft hover:bg-subtle hover:text-ink",
  danger: "border border-danger-line bg-danger-soft text-danger hover:brightness-95",
};

/**
 * Komponen presentational murni: tidak pernah melakukan fetch/effects.
 * Minimum tinggi 44px sesuai touch target (audit 7.10).
 */
export const Button: FC<ButtonProps> = ({
  variant = "primary",
  loading = false,
  icon,
  className = "",
  children,
  disabled,
  type = "button",
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-4 focus:ring-accent/25 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    {...rest}
  >
    {loading ? <span aria-hidden className="animate-spin">◌</span> : icon}
    {children}
  </button>
);
