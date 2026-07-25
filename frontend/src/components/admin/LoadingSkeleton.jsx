export default function LoadingSkeleton({ blocks = 4, className = "" }) {
  return (
    <div className={`admin-loading-skeleton${className ? ` ${className}` : ""}`} aria-label="Carregando">
      {Array.from({ length: blocks }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}
