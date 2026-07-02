export function BrandMark({ className = "", title = "Pé na Areia" }) {
  return (
    <svg
      className={`brand-mark ${className}`}
      role="img"
      aria-label={title}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle className="brand-mark__sun" cx="43" cy="20" r="9" />
      <path
        className="brand-mark__line brand-mark__line--court"
        d="M14 34H52"
        pathLength="1"
      />
      <path
        className="brand-mark__line brand-mark__line--dune"
        d="M10 43C20 36 32 36 44 42C49 44.5 54 45 58 42"
        pathLength="1"
      />
      <path
        className="brand-mark__line brand-mark__line--sand"
        d="M16 50C27 46 39 46 51 50"
        pathLength="1"
      />
      <g className="brand-mark__foot">
        <ellipse cx="24" cy="25" rx="3.2" ry="5.3" transform="rotate(-18 24 25)" />
        <circle cx="18.6" cy="22.2" r="1.25" />
        <circle cx="21" cy="20.1" r="1.1" />
        <circle cx="23.7" cy="19.2" r="1" />
      </g>
      <circle className="brand-mark__ball" cx="53" cy="34" r="2.2" />
    </svg>
  );
}
