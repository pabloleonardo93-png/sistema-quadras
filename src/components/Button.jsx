import { ArrowRight } from "lucide-react";

export function Button({
  children,
  className = "",
  variant = "primary",
  showArrow = false,
  ...props
}) {
  return (
    <button
      className={`button button--${variant} ${className}`}
      type="button"
      {...props}
    >
      <span>{children}</span>
      {showArrow && <ArrowRight aria-hidden="true" size={18} strokeWidth={2.4} />}
    </button>
  );
}
