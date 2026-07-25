import { BrandMark } from "../BrandMark";

export default function AdminLogo({ brand }) {
  return (
    <a className="admin-header-logo" href="/" aria-label={`${brand?.name || "Pe na Areia"}, inicio`}>
      <BrandMark />
    </a>
  );
}
