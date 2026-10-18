(() => {
  const root = document.documentElement;
  if (!root.classList.contains("brand-intro-active")) return;

  const logo = document.querySelector(".hero-logo");
  const portrait = document.querySelector(".hero-portrait img");
  const cover = document.querySelector(".brand-intro");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const animations = [];
  const completions = [];
  const interruptions = ["pointerdown", "keydown", "wheel", "touchstart", "resize", "pagehide", "brandintro:timeout"];
  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(window.brandIntroTimeout);
    root.classList.remove("brand-intro-active", "brand-intro-preparing");
    animations.forEach(animation => animation.cancel());
    interruptions.forEach(event => window.removeEventListener(event, finish));
    document.removeEventListener("visibilitychange", onVisibilityChange);
    preference.removeEventListener("change", finish);
  }

  function onVisibilityChange() {
    if (document.hidden) finish();
  }

  function animate(element, keyframes, options) {
    const animation = element.animate(keyframes, { fill: "both", ...options });
    animations.push(animation);
    const completion = animation.finished;
    completions.push(completion);
    completion.catch(() => {});
    return animation;
  }

  interruptions.forEach(event => window.addEventListener(event, finish, { passive: true }));
  document.addEventListener("visibilitychange", onVisibilityChange);
  preference.addEventListener("change", finish);

  async function play() {
    try {
      await logo.decode();
      if (finished) return;

      const entrance = animate(logo, [{ opacity: 0 }, { opacity: 1 }], {
        duration: 180,
        easing: "cubic-bezier(.22,1,.36,1)"
      });
      await Promise.allSettled([
        entrance.finished,
        Promise.race([portrait.decode(), new Promise(resolve => setTimeout(resolve, 1100))])
      ]);
      if (finished || !root.classList.contains("brand-intro-active")) return finish();

      const hold = animate(logo, [{ opacity: 1 }, { opacity: 1 }], { duration: 1500 });
      await hold.finished;
      if (finished || !root.classList.contains("brand-intro-active")) return finish();

      // FLIP: medir o logo no centro e no destino; animar apenas transform e opacity.
      const first = logo.getBoundingClientRect();
      root.classList.remove("brand-intro-preparing");
      entrance.cancel();
      hold.cancel();
      const last = logo.getBoundingClientRect();
      const opacity = getComputedStyle(logo).opacity;
      const dx = first.x + first.width / 2 - last.x - last.width / 2;
      const dy = first.y + first.height / 2 - last.y - last.height / 2;
      const scale = first.width / last.width;

      animate(logo, [
        { transform: `translateX(-50%) translate(${dx}px,${dy}px) scale(${scale})`, opacity: 1 },
        { transform: "translateX(-50%) translate(0px,0px) scale(1)", opacity }
      ], { duration: 820, easing: "cubic-bezier(.76,0,.24,1)" });

      animate(cover, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 440, delay: 160, easing: "cubic-bezier(.22,1,.36,1)"
      });
      animate(document.querySelector(".hero-portrait"), [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0px)" }
      ], { duration: 480, delay: 320, easing: "cubic-bezier(.22,1,.36,1)" });

      document.querySelectorAll(".hero-intro,.hero-appointment").forEach(element => {
        animate(element, [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0px)" }
        ], { duration: 420, delay: 440, easing: "cubic-bezier(.22,1,.36,1)" });
      });
      await Promise.allSettled(completions);
    } finally {
      finish();
    }
  }

  play().catch(finish);
})();
