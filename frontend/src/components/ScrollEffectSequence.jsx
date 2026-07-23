import { Children, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollEffectSequence({ children }) {
  const rootRef = useRef(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        {
          canAnimate: "(min-width: 761px) and (prefers-reduced-motion: no-preference)",
          reduceMotion: "(max-width: 760px), (prefers-reduced-motion: reduce)",
        },
        ({ conditions }) => {
          const panels = gsap.utils
            .toArray(".scroll-effect-sequence__panel", root)
            .filter(
              (panel) =>
                panel.children.length > 0 &&
                panel.getBoundingClientRect().height > 1,
            );
          const transitionPanel = panels[0];

          if (!conditions.canAnimate || !transitionPanel) {
            gsap.set(panels, { clearProps: "all" });
            return undefined;
          }

          panels.forEach((panel) => {
            panel.classList.remove("scroll-effect-sequence__panel--transition");
          });
          transitionPanel.classList.add("scroll-effect-sequence__panel--transition");

          gsap.set(panels, { clearProps: "all" });
          gsap.set(transitionPanel, {
            zIndex: 8,
            willChange: "transform, opacity",
          });

          const transitionTween = gsap.fromTo(
            transitionPanel,
            {
              autoAlpha: 1,
              y: () => Math.min(window.innerHeight * 0.62, 520),
            },
            {
              autoAlpha: 1,
              y: 0,
              ease: "none",
              scrollTrigger: {
                trigger: transitionPanel,
                start: "top bottom+=28%",
                end: "top 16%",
                scrub: 0.65,
                invalidateOnRefresh: true,
              },
            },
          );

          return () => {
            transitionTween.scrollTrigger?.kill();
            transitionTween.kill();
            transitionPanel.classList.remove("scroll-effect-sequence__panel--transition");
          };
        },
      );
    }, root);

    return () => {
      media.revert();
      context.revert();
    };
  }, [children]);

  return (
    <div className="scroll-effect-sequence" ref={rootRef}>
      {Children.map(children, (child) => (
        <div className="scroll-effect-sequence__panel">
          {child}
        </div>
      ))}
    </div>
  );
}
