export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  inverse = false,
}) {
  return (
    <div
      className={`section-heading section-heading--${align} ${
        inverse ? "section-heading--inverse" : ""
      }`}
    >
      <span className="section-heading__eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
