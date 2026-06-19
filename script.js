/* ===========================================================
   Max Drone — logique du scroll qui pilote la vidéo
   =========================================================== */

(() => {
  "use strict";

  const video      = document.getElementById("concept-video");
  const concept    = document.getElementById("concept");
  const loader     = document.getElementById("loader");
  const fallback   = document.getElementById("video-fallback");
  const progressBar = document.getElementById("progress-bar");
  const steps      = Array.from(document.querySelectorAll(".step"));

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Apparition des textes selon la progression ---------- */
  function updateSteps(progress) {
    // progress : 0 → 1. On répartit les paliers sur toute l'ascension.
    const index = Math.min(steps.length - 1, Math.floor(progress * steps.length));
    steps.forEach((step, i) => step.classList.toggle("is-active", i === index));
  }

  /* ---------- 2. Mode réduit : pas de scrub, textes empilés ---------- */
  if (reduceMotion) {
    hideLoader();
    steps.forEach((s) => s.classList.add("is-active"));
    // On laisse la vidéo jouer doucement en boucle, sans dépendre du scroll.
    video.loop = true;
    video.play().catch(() => {});
    video.addEventListener("error", showFallback);
    return;
  }

  /* ---------- 3. Préparation : on attend que la vidéo soit prête ---------- */
  let duration = 0;
  let ready = false;
  let rafStarted = false;

  // On récupère la durée dès les métadonnées…
  function grabDuration() {
    if (duration) return;
    const d = video.duration || 0;
    if (d && isFinite(d)) duration = d;
  }

  // …mais on n'active le scrub que lorsque la vidéo est suffisamment
  // mise en mémoire tampon : scruber sur une zone non téléchargée saccade.
  function enableScrub() {
    grabDuration();
    if (ready || !duration) return;
    ready = true;
    hideLoader();
    onScroll();                       // position initiale correcte
    if (!rafStarted) { rafStarted = true; rafLoop(); }
  }

  video.addEventListener("loadedmetadata", grabDuration);
  video.addEventListener("canplaythrough", enableScrub);
  // Repli : si canplaythrough tarde (réseau lent), on active dès canplay.
  video.addEventListener("canplay", () => setTimeout(enableScrub, 1200));
  video.addEventListener("error", showFallback);

  // Filet de sécurité : si rien ne se charge après 10s, on affiche le repli.
  const safety = setTimeout(() => { if (!ready) showFallback(); }, 10000);

  /* ---------- 4. Calcul de la progression du scroll ---------- */
  let targetTime = 0;

  function getProgress() {
    const rect = concept.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight; // distance scrollable interne
    if (scrollable <= 0) return 0;
    // -rect.top = distance déjà parcourue dans la section sticky
    return Math.min(1, Math.max(0, -rect.top / scrollable));
  }

  function onScroll() {
    const progress = getProgress();
    if (ready) targetTime = progress * duration;
    if (progressBar) progressBar.style.width = (progress * 100).toFixed(1) + "%";
    updateSteps(progress);
  }

  /* ---------- 5. Lissage : on rapproche currentTime de la cible (lerp) ---------- */
  let currentTime = 0;

  function rafLoop() {
    if (ready) {
      // interpolation douce vers la cible (suivi fluide du scroll)
      currentTime += (targetTime - currentTime) * 0.16;
      if (Math.abs(targetTime - currentTime) < 0.004) currentTime = targetTime;
      // On ne lance un nouveau seek QUE si le précédent est terminé :
      // empiler des seeks pendant un scroll rapide est la cause des saccades.
      if (!video.seeking && Math.abs(video.currentTime - currentTime) > 0.015) {
        try { video.currentTime = currentTime; } catch (_) {}
      }
    }
    requestAnimationFrame(rafLoop);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  // iOS/Safari : un geste utilisateur peut être requis pour autoriser le seek.
  video.play().then(() => video.pause()).catch(() => {});

  /* ---------- Utilitaires ---------- */
  function hideLoader() {
    clearTimeout(safety);
    loader.classList.add("is-hidden");
  }

  function showFallback() {
    clearTimeout(safety);
    ready = false;
    hideLoader();
    video.hidden = true;
    fallback.hidden = false;
  }

  /* ---------- 6. Lien de nav actif selon la section visible ---------- */
  const navLinks = Array.from(document.querySelectorAll(".nav__link"));
  const sections = navLinks
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) =>
          l.setAttribute(
            "aria-current",
            l.getAttribute("href") === "#" + entry.target.id ? "true" : "false"
          )
        );
      });
    },
    { rootMargin: "-45% 0px -45% 0px" }
  );
  sections.forEach((s) => navObserver.observe(s));
})();

/* ===========================================================
   Formulaire de contact (démo — aucun envoi réel)
   =========================================================== */
(() => {
  const form   = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get("name") || "").toString().trim();
    const email = (data.get("email") || "").toString().trim();
    const message = (data.get("message") || "").toString().trim();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !emailOk || !message) {
      status.textContent = "Merci de remplir tous les champs avec un email valide.";
      status.className = "form__status is-error";
      return;
    }

    status.textContent = `Merci ${name} ! Votre message a bien été envoyé. L'équipe Max Drone vous répondra vite.`;
    status.className = "form__status is-ok";
    form.reset();
  });
})();
