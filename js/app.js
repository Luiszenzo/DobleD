import { setupCurrentDate } from "./utils/date.js";
import { setupTheme } from "./utils/theme.js";
import { setupNavigation } from "./utils/navigation.js";
import { setupModals } from "./utils/modals.js";
import { setupEmpleadosModule, cargarEmpleadosCache } from "./modules/empleados.js";
import { setupGastosModule } from "./modules/gastos.js";
import { setupVentasModule } from "./modules/ventas.js";
import { setupReportesModule } from "./modules/reportes.js";
import { inicializarDashboard } from "./modules/dashboard.js";

// ==========================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  // Inicializar utilidades
  setupCurrentDate();
  setupTheme();
  setupNavigation();
  setupModals();

  // Configurar listeners de los módulos
  setupEmpleadosModule();
  setupGastosModule();
  setupVentasModule();
  setupReportesModule();

  // Cargar datos iniciales de base de datos
  await cargarEmpleadosCache();
  await inicializarDashboard();
});
