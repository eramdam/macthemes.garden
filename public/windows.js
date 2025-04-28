document.querySelectorAll(".macos9-window").forEach((windowElement) => {
  const id = windowElement.getAttribute("id");
  const storageKey = `macthemes-window-${id}`;
  const windowState = JSON.parse(
    localStorage.getItem(storageKey) || `{"collapsed": false,"zoomed": false}`,
  );
  if (windowState.collapsed) {
    windowElement.classList.add("collapsed");
  } else if (windowState.zoomed) {
    windowElement.classList.add("zoomed");
  }

  function setWindowState(state) {
    const currentState = JSON.parse(
      localStorage.getItem(storageKey) ||
        `{"collapsed": false,"zoomed": false}`,
    );

    currentState.collapsed =
      state === "collapsed" ? !currentState.collapsed : currentState.collapsed;
    currentState.zoomed =
      state === "zoomed" ? !currentState.zoomed : currentState.zoomed;

    localStorage.setItem(storageKey, JSON.stringify(currentState));
  }

  windowElement.querySelectorAll("button").forEach((button) => {
    if (button.dataset.action === "collapse") {
      const titlebar = windowElement.querySelector(".macos9-window-titlebar");
      if (titlebar) {
        titlebar.addEventListener("dblclick", (e) => {
          if (e.target instanceof HTMLButtonElement) {
            return;
          }

          windowElement.classList.toggle("collapsed");
          setWindowState("collapsed");
          window.getSelection()?.empty();
        });
      }
    }
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "collapse") {
        windowElement.classList.toggle("collapsed");
        setWindowState("collapsed");
      } else if (action === "zoom") {
        windowElement.classList.toggle("zoomed");
        setWindowState("zoomed");
      }
    });
  });
});
