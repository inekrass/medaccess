const accessibilityToggle = document.querySelector(".accessibility-toggle");
const accessibilityPanel = document.querySelector("#accessibility-panel");
const liveRegion = document.querySelector("#live-region");

function setLiveMessage(message) {
  if (!liveRegion) {
    return;
  }

  liveRegion.textContent = message;
}

function openAccessibilityPanel() {
  if (!accessibilityPanel || !accessibilityToggle) {
    return;
  }

  accessibilityPanel.hidden = false;
  accessibilityToggle.setAttribute("aria-expanded", "true");
  accessibilityToggle.setAttribute("aria-label", "Закрыть настройки отображения");
  setLiveMessage("Панель настроек отображения открыта.");

  const firstPanelControl = accessibilityPanel.querySelector("input, button, select, textarea, a[href]");

  if (firstPanelControl) {
    firstPanelControl.focus();
  }
}

function closeAccessibilityPanel({ returnFocus = false } = {}) {
  if (!accessibilityPanel || !accessibilityToggle) {
    return;
  }

  accessibilityPanel.hidden = true;
  accessibilityToggle.setAttribute("aria-expanded", "false");
  accessibilityToggle.setAttribute("aria-label", "Открыть настройки отображения");
  setLiveMessage("Панель настроек отображения закрыта.");

  if (returnFocus) {
    accessibilityToggle.focus();
  }
}

if (accessibilityToggle && accessibilityPanel) {
  accessibilityToggle.addEventListener("click", () => {
    if (accessibilityPanel.hidden) {
      openAccessibilityPanel();
      return;
    }

    closeAccessibilityPanel();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !accessibilityPanel.hidden) {
      closeAccessibilityPanel({ returnFocus: true });
    }
  });
}
