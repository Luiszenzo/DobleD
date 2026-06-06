import { appState } from "../state.js";
import { showToast } from "../utils/notifications.js";
import { inicializarDashboard } from "./dashboard.js";
import { getVentasDia, saveVentasDia } from "../db.js";

export async function cargarFormularioVentas(fechaStr) {
  const form = document.getElementById("venta-form");
  if (!form) return;
  
  form.reset();
  
  document.getElementById("venta-total").value = "";
  document.getElementById("venta-horas").value = "";
  document.getElementById("venta-notas").value = "";
  
  const record = await getVentasDia(fechaStr);
  
  if (record.exists) {
    document.getElementById("venta-total").value = record.data.totalVenta || "";
    document.getElementById("venta-horas").value = record.data.horasTrabajadas || "";
    document.getElementById("venta-notas").value = record.data.notas || "";
    
    showToast("Venta Cargada", `Se recuperaron las ventas del día ${fechaStr} para edición.`, "warning");
  }
}

export function setupVentasModule() {
  // Selector de fecha en ventas
  const dateInput = document.getElementById("venta-fecha-input");
  if (dateInput) {
    dateInput.addEventListener("change", async (e) => {
      await cargarFormularioVentas(e.target.value);
    });
  }

  // Guardar Ventas Form
  const form = document.getElementById("venta-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fechaStr = document.getElementById("venta-fecha-input").value;
      
      const datosVenta = {
        totalVenta: document.getElementById("venta-total").value,
        horasTrabajadas: document.getElementById("venta-horas").value,
        notas: document.getElementById("venta-notas").value
      };

      const res = await saveVentasDia(fechaStr, datosVenta);
      if (res.success) {
        showToast("Ventas Guardadas", `Se registró la venta de $${parseFloat(datosVenta.totalVenta).toFixed(2)} para el día ${fechaStr}.`, "success");
        if (fechaStr === appState.currentDate) {
          await inicializarDashboard();
        }
      } else {
        showToast("Error", "No se pudo registrar la venta.", "error");
      }
    });
  }

  // Botón Limpiar Formulario
  const btnLimpiar = document.getElementById("btn-limpiar-ventas");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      const vTotal = document.getElementById("venta-total");
      const vHoras = document.getElementById("venta-horas");
      const vNotas = document.getElementById("venta-notas");
      if (vTotal) vTotal.value = "";
      if (vHoras) vHoras.value = "";
      if (vNotas) vNotas.value = "";
      showToast("Formulario Limpiado", "Se han borrado los campos de venta.", "info");
    });
  }
}
