import { useEffect, useState } from "react";
import { brand } from "../constants/brand";

let introPlayedThisLoad = false;

const INTRO_LOGO_SRC = "/images/logo/logo-pe-na-areia-header-legivel.png";
const HERO_BACKGROUND_SRC = "/images/hero-beach-tennis-raquete.png";
const MIN_LOGO_VISIBLE_MS = 1000;
const INTRO_EXIT_DURATION_MS = 1320;

function shouldPlayIntro() {
  if (typeof window === "undefined") return false;
  if (introPlayedThisLoad) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return true;
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function ensureImagePreload(src) {
  const linkId = `preload-${src.replace(/[^a-z0-9]+/gi, "-")}`;
  if (document.getElementById(linkId)) return;

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "preload";
  link.as = "image";
  link.href = src;

  if ("fetchPriority" in link) {
    link.fetchPriority = "high";
  }

  document.head.appendChild(link);
}

function preloadImage(src, options = {}) {
  const { decoding = "async", fetchPriority = "auto" } = options;

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.decoding = decoding;

    if ("fetchPriority" in image) {
      image.fetchPriority = fetchPriority;
    }

    image.onload = async () => {
      try {
        if (typeof image.decode === "function") {
          await image.decode();
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => {
      reject(new Error(`Failed to preload image: ${src}`));
    };

    image.src = src;
  });
}

export function PageIntro() {
  const [visible, setVisible] = useState(shouldPlayIntro);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;

    let active = true;
    let removeTimer;
    const root = document.documentElement;
    introPlayedThisLoad = true;
    root.classList.add("site-intro-active");

    ensureImagePreload(HERO_BACKGROUND_SRC);

    const logoReady = preloadImage(INTRO_LOGO_SRC, {
      decoding: "sync",
      fetchPriority: "high",
    }).catch(() => undefined);
    const heroReady = preloadImage(HERO_BACKGROUND_SRC, {
      fetchPriority: "high",
    }).catch(() => undefined);
    const minimumLogoVisible = logoReady.then(() => wait(MIN_LOGO_VISIBLE_MS));

    async function releaseIntro() {
      await Promise.all([logoReady, heroReady, minimumLogoVisible]);

      if (!active) return;

      setExiting(true);

      removeTimer = window.setTimeout(() => {
        if (!active) return;

        root.classList.remove("site-intro-active");
        setVisible(false);
      }, INTRO_EXIT_DURATION_MS);
    }

    releaseIntro();

    return () => {
      active = false;
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
          src={INTRO_LOGO_SRC}
          alt=""
          decoding="sync"
          fetchPriority="high"
        />
        <span>Sua partida começa aqui</span>
      </div>
    </div>
  );
}
