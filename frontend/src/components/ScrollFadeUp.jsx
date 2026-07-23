import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollFadeUp({ watchKey }) {
  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        {
          desktop: "(min-width: 761px) and (prefers-reduced-motion: no-preference)",
          mobile: "(max-width: 760px) and (prefers-reduced-motion: no-preference)",
          reduceMotion: "(prefers-reduced-motion: reduce)",
        },
        ({ conditions }) => {
          const sections = gsap.utils.toArray("[data-scroll-fade-section]");
          const sectionItems = sections
            .map((section) =>
              gsap.utils
                .toArray("[data-scroll-fade]", section)
                .filter((item) => item.getBoundingClientRect().height > 0),
            )
            .filter((items) => items.length > 0);
          const allItems = sectionItems.flat();

          if (!allItems.length) return undefined;

          if (!conditions.desktop && !conditions.mobile) {
            gsap.set(allItems, {
              autoAlpha: 1,
              y: 0,
              clearProps: "opacity,visibility,transform,willChange",
            });
            return undefined;
          }

          const distance = conditions.mobile ? 26 : 58;
          const duration = conditions.mobile ? 0.48 : 0.78;
          const stagger = conditions.mobile ? 0.045 : 0.085;
          const triggers = [];

          const hideItems = (items) => {
            gsap.set(items, {
              autoAlpha: 0,
              y: distance,
              willChange: "transform, opacity",
            });
          };

          const showItems = (items) => {
            gsap.to(items, {
              autoAlpha: 1,
              y: 0,
              duration,
              ease: "power3.out",
              stagger,
              overwrite: true,
              onComplete: () => {
                gsap.set(items, { clearProps: "willChange" });
              },
            });
          };

          const showVisibleItems = () => {
            const viewportHeight = window.innerHeight;
            const visibleItems = allItems.filter((item) => {
              const rect = item.getBoundingClientRect();
              return rect.top < viewportHeight * 0.88 && rect.bottom > 0;
            });

            if (visibleItems.length) showItems(visibleItems);
          };

          hideItems(allItems);

          sectionItems.forEach((items) => {
            const batchTriggers = ScrollTrigger.batch(items, {
              interval: 0.08,
              batchMax: conditions.mobile ? 2 : 4,
              start: "top 88%",
              onEnter: showItems,
              onEnterBack: showItems,
              onLeaveBack: hideItems,
            });
            triggers.push(...batchTriggers);
          });

          const refresh = () => {
            ScrollTrigger.refresh();
            showVisibleItems();
          };
          const frameId = window.requestAnimationFrame(refresh);
          const refreshId = window.setTimeout(refresh, 180);
          window.addEventListener("load", refresh, { once: true });

          return () => {
            window.cancelAnimationFrame(frameId);
            window.clearTimeout(refreshId);
            window.removeEventListener("load", refresh);
            triggers.forEach((trigger) => trigger.kill());
            gsap.killTweensOf(allItems);
            gsap.set(allItems, {
              clearProps: "opacity,visibility,transform,willChange",
            });
          };
        },
      );
    });

    return () => {
      media.revert();
      context.revert();
    };
  }, [watchKey]);

  return null;
}
