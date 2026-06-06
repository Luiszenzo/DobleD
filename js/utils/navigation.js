import { appState } from "../state.js";
import { inicializarDashboard } from "../modules/dashboard.js";
import { cargarListadoEmpleados } from "../modules/empleados.js";
import { cargarFormularioGastos } from "../modules/gastos.js";
import { cargarFormularioVentas } from "../modules/ventas.js";
import { ejecutarReporte } from "../modules/reportes.js";

export function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item, .mobile-nav-item");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tabId = item.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // Exponer al scope global para que los botones rápidos funcionen
  window.switchTab = switchTab;
}

export async function switchTab(tabId) {
  if (tabId === appState.activeTab) return;

  appState.activeTab = tabId;

  // Actualizar clases activas en sidebar y mobile bar
  document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(item => {
    if (item.getAttribute("data-tab") === tabId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Cambiar visibilidad de las vistas con animación suave
  document.querySelectorAll(".tab-view").forEach(view => {
    view.classList.remove("active-view");
  });

  const activeView = document.getElementById(`view-${tabId}`);
  if (activeView) {
    activeView.classList.add("active-view");
  }

  // Actualizar Título y Subtítulo de cabecera
  const viewTitle = document.getElementById("view-title");
  const viewSubtitle = document.getElementById("view-subtitle");

  switch (tabId) {
    case "dashboard":
      if (viewTitle) viewTitle.innerText = "Resumen de Finanzas";
      if (viewSubtitle) viewSubtitle.innerText = "Monitoreo general y balances diarios";
      await inicializarDashboard();
      break;
    case "empleados":
      if (viewTitle) viewTitle.innerText = "Administración de Personal";
      if (viewSubtitle) viewSubtitle.innerText = "Altas, bajas y control de salarios diarios";
      await cargarListadoEmpleados();
      break;
    case "gastos":
      if (viewTitle) viewTitle.innerText = "Registrar Gastos";
      if (viewSubtitle) viewSubtitle.innerText = "Ingresa viáticos, compras de la central y nóminas";
      await cargarFormularioGastos(document.getElementById("gasto-fecha-input").value);
      break;
    case "ventas":
      if (viewTitle) viewTitle.innerText = "Registrar Ventas";
      if (viewSubtitle) viewSubtitle.innerText = "Ingresa las ventas de caja y horas de jornada";
      await cargarFormularioVentas(document.getElementById("venta-fecha-input").value);
      break;
    case "reportes":
      if (viewTitle) viewTitle.innerText = "Reportes y Auditoría";
      if (viewSubtitle) viewSubtitle.innerText = "Análisis e impresión de utilidades e históricos";
      await ejecutarReporte();
      break;
  }
}
