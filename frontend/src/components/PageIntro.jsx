import { useEffect, useState } from "react";
import { brand } from "../constants/brand";

let introPlayedThisLoad = false;

function shouldPlayIntro() {
  if (typeof window === "undefined") return false;
  if (introPlayedThisLoad) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

export function PageIntro() {
  const [visible, setVisible] = useState(shouldPlayIntro);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;

    const root = document.documentElement;
    introPlayedThisLoad = true;
    root.classList.add("site-intro-active");

    const exitTimer = window.setTimeout(() => setExiting(true), 260);
    const removeTimer = window.setTimeout(() => {
      root.classList.remove("site-intro-active");
      setVisible(false);
    }, 1580);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
      root.classList.remove("site-intro-active");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`site-intro ${exiting ? "site-intro--exiting" : ""}`}
      role="status"
      aria-label={`Carregando ${brand.name}`}
    >
      <div className="site-intro__grid" aria-hidden="true">
        <span className="site-intro__background" />
        <div className="site-intro__tiles">
          {Array.from({ length: 8 }, (_, index) => index + 1).map((tile) => (
            <span
              className={`site-intro__tile site-intro__tile--${tile}`}
              key={tile}
            />
          ))}
        </div>
      </div>

      <div className="site-intro__brand" aria-hidden="true">
        <img
          src="/images/logo/logo-pe-na-areia-header-legivel.png"
          alt=""
          decoding="sync"
        />
        <span>Sua partida começa aqui</span>
      </div>
    </div>
  );
}
