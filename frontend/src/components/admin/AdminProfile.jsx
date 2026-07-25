import { ChevronDown, LogOut } from "lucide-react";
import { useState } from "react";

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "EA";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function roleLabel(admin) {
  const role = admin?.funcao || admin?.cargo || admin?.permissao || "Equipe";
  return String(role).charAt(0).toUpperCase() + String(role).slice(1);
}

export default function AdminProfile({ admin, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const adminName = admin?.nome || admin?.email || "Equipe";
  const adminRole = roleLabel(admin);

  return (
    <div className="admin-profile">
      <button
        className="admin-profile__button"
        type="button"
        aria-expanded={profileOpen}
        onClick={() => setProfileOpen((current) => !current)}
      >
        <span className="admin-profile__avatar">{initialsFromName(adminName)}</span>
        <span className="admin-profile__meta">
          <strong>{adminName}</strong>
          <small>{adminRole}</small>
        </span>
        <ChevronDown aria-hidden="true" size={18} />
      </button>
      {profileOpen && (
        <div className="admin-profile__menu">
          <div className="admin-profile__menu-header">
            <strong>{adminName}</strong>
            <small>{adminRole}</small>
          </div>
          <button type="button" onClick={onLogout}>
            <LogOut aria-hidden="true" size={17} />
            <span>Sair</span>
          </button>
        </div>
      )}
    </div>
  );
}
