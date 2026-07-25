export default function IconButton({ children, className = "", label, ...props }) {
  return (
    <button
      className={`admin-icon-button${className ? ` ${className}` : ""}`}
      type="button"
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
