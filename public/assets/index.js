document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".macos9-window[id] .macos9-window-titlebar button")
    .forEach((el) => {
      if (!(el instanceof HTMLButtonElement)) {
        return;
      }
      el.addEventListener("click", () => {
        const action = el.dataset.action;
        if (action === "collapse") {
          el.closest(".macos9-window")?.classList.toggle("collapsed");
        } else if (action === "zoom") {
          el.closest(".macos9-window")?.classList.toggle("zoomed");
        }
      });
    });
});
