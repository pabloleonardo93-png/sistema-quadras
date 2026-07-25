import { Search } from "lucide-react";

export default function AdminSearch({ isOpen, onChange, value }) {
  return (
    <label className={`admin-search admin-search--premium${isOpen ? " is-open" : ""}`}>
      <Search aria-hidden="true" size={19} />
      <input
        type="search"
        placeholder="Buscar reservas, clientes, quadras..."
        value={value ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}
