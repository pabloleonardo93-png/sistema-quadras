import { arenaInfo } from "../constants/arenaInfo";

export function whatsappLink(message) {
  return `https://wa.me/${arenaInfo.whatsapp}?text=${encodeURIComponent(message)}`;
}
