export function BrandMark({ className = "", title = "Pé na Areia" }) {
  return (
    <img
      className={`brand-mark ${className}`}
      src="/images/logo/logo-pe-na-areia-header-white.png"
      alt={title}
    />
  );
}
