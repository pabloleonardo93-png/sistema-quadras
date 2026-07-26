export const INITIAL_BOOT_INTRO_ID = "initial-boot-intro";

export function removeInitialBootIntro() {
  if (typeof document === "undefined") return;

  document.getElementById(INITIAL_BOOT_INTRO_ID)?.remove();
  document.body.classList.remove("boot-intro-active");
}
