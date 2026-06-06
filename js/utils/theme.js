import { appState } from "../state.js";
import { showToast } from "./notifications.js";

export function setupTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  appState.theme = savedTheme;
  document.documentElement.setAttribute("data-theme", savedTheme);
  
  const themeIcon = document.getElementById("theme-icon");
  if (themeIcon) {
    if (savedTheme === "dark") {
      themeIcon.className = "fa-solid fa-sun";
    } else {
      themeIcon.className = "fa-solid fa-moon";
    }
  }

  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const nextTheme = appState.theme === "dark" ? "light" : "dark";
      appState.theme = nextTheme;
      document.documentElement.setAttribute("data-theme", nextTheme);
      localStorage.setItem("theme", nextTheme);
      
      const icon = document.getElementById("theme-icon");
      if (icon) {
        if (nextTheme === "dark") {
          icon.className = "fa-solid fa-sun";
          showToast("Tema Oscuro", "Cambiado a modo noche", "success");
        } else {
          icon.className = "fa-solid fa-moon";
          showToast("Tema Claro", "Cambiado a modo día", "success");
        }
      }
      
      // Forzar actualización de gráficas para adaptar colores
      if (appState.charts.weekly) appState.charts.weekly.update();
      if (appState.charts.expenses) appState.charts.expenses.update();
    });
  }
}
