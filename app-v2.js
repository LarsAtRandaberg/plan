(() => {
  if (!document.body.classList.contains("page-v2")) return;

  const body = document.body;
  const sidebar = document.getElementById("sidebar");
  const menuBtn = document.getElementById("menuBtn");
  const sidebarCloseBtn = document.getElementById("sidebarCloseBtn");
  const pageOverlay = document.getElementById("pageOverlay");
  const peekButton = document.getElementById("peekButton");
  const peekButtonLabel = document.getElementById("peekButtonLabel");
  const modeBadge = document.getElementById("mode-badge");
  const modeSummary = document.getElementById("mode-summary");
  const modeIntroCard = document.getElementById("mode-intro-card");
  const sidebarModeLabel = document.getElementById("sidebar-mode-label");
  const sidebarPanelTitle = document.getElementById("sidebar-panel-title");
  const modeButtons = Array.from(document.querySelectorAll("[data-mode-target]"));

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");
    syncOverlay();
  }

  function syncOverlay() {
    if (!pageOverlay || !sidebar) return;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const isOpen = sidebar.classList.contains("open");
    pageOverlay.hidden = !(isMobile && isOpen);
  }

  function setMode(mode) {
    const isReport = mode === "rapport";
    body.dataset.mode = isReport ? "rapport" : "plan";

    modeButtons.forEach(function(button) {
      const active = button.dataset.modeTarget === body.dataset.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (modeBadge) modeBadge.textContent = isReport ? "Rapportmodus" : "Planmodus";
    if (sidebarModeLabel) sidebarModeLabel.textContent = isReport ? "Rapport" : "Plan";
    if (sidebarPanelTitle) sidebarPanelTitle.textContent = isReport ? "Rapportmeny" : "Planmeny";
    if (peekButtonLabel) peekButtonLabel.textContent = isReport ? "Rapport" : "Plan";

    if (modeSummary) {
      modeSummary.textContent = isReport
        ? "Rapportmodus prioriterer økonomi, avvik og årsoppfølging fremfor full målrapportering i tertial."
        : "Planinnhold og navigasjon følger valgt mål.";
    }

    if (modeIntroCard) {
      modeIntroCard.innerHTML = isReport
        ? "<div class=\"mode-intro-kicker\">Rapport</div><div class=\"mode-intro-title\">Styring og oppfølging</div><p>Rapportmodus skal ikke skape forventning om tertialrapportering på alle mål. Her er fokus økonomi, avvik, risiko og prioriterte forhold.</p>"
        : "<div class=\"mode-intro-kicker\">Plan</div><div class=\"mode-intro-title\">Planstruktur og mål</div><p>I planmodus er planhierarkiet primærnavigasjon. På mobil blir toppbaren komprimert til en trygg, synlig stripe når du scroller ned.</p>";
    }

    closeSidebar();
  }

  modeButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      setMode(button.dataset.modeTarget);
    });
  });

  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener("click", closeSidebar);
  if (pageOverlay) pageOverlay.addEventListener("click", closeSidebar);
  if (peekButton) peekButton.addEventListener("click", function() {
    if (menuBtn) menuBtn.click();
  });

  if (sidebar) {
    const observer = new MutationObserver(syncOverlay);
    observer.observe(sidebar, { attributes: true, attributeFilter: ["class"] });
  }

  window.addEventListener("resize", syncOverlay);
  syncOverlay();
  setMode(body.dataset.mode || "plan");
})();
