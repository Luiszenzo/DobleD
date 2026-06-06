import { appState } from "../state.js";
import { showToast } from "../utils/notifications.js";
import { inicializarDashboard } from "./dashboard.js";
import { getVentasDia, saveVentasDia, deleteVentasDia } from "../db.js";

// Muestra/oculta el botón de eliminar según si hay datos para la fecha
function toggleBtnEliminarVenta(visible) {
  const btn = document.getElementById("btn-eliminar-venta");
  if (btn) btn.style.display = visible ? "inline-flex" : "none";
}

export async function cargarFormularioVentas(fechaStr) {
  const form = document.getElementById("venta-form");
  if (!form) return;
  
  form.reset();
  
  document.getElementById("venta-total").value = "";
  document.getElementById("venta-horas").value = "";
  document.getElementById("venta-notas").value = "";
  toggleBtnEliminarVenta(false);
  
  const record = await getVentasDia(fechaStr);
  
  if (record.exists) {
    document.getElementById("venta-total").value = record.data.totalVenta || "";
    document.getElementById("venta-horas").value = record.data.horasTrabajadas || "";
    document.getElementById("venta-notas").value = record.data.notas || "";
    toggleBtnEliminarVenta(true);
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
        toggleBtnEliminarVenta(true);
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

  // Botón Eliminar Registro de Ventas
  const btnEliminar = document.getElementById("btn-eliminar-venta");
  if (btnEliminar) {
    btnEliminar.addEventListener("click", () => {
      const fechaStr = document.getElementById("venta-fecha-input").value;
      showConfirmModal(
        `¿Deseas eliminar permanentemente el registro de ventas del <strong>${fechaStr}</strong>? Esta acción no se puede deshacer.`,
        async () => {
          const res = await deleteVentasDia(fechaStr);
          if (res.success) {
            showToast("Registro Eliminado", `El registro de ventas del ${fechaStr} fue eliminado.`, "success");
            // Limpiar formulario
            const vTotal = document.getElementById("venta-total");
            const vHoras = document.getElementById("venta-horas");
            const vNotas = document.getElementById("venta-notas");
            if (vTotal) vTotal.value = "";
            if (vHoras) vHoras.value = "";
            if (vNotas) vNotas.value = "";
            toggleBtnEliminarVenta(false);
            if (fechaStr === appState.currentDate) {
              await inicializarDashboard();
            }
          } else {
            showToast("Error", "No se pudo eliminar el registro.", "error");
          }
        }
      );
    });
  }
}

// ——————————————————————————————————————
// Modal de confirmación reutilizable
// ——————————————————————————————————————
let _confirmCallback = null;

export function showConfirmModal(mensaje, onConfirm) {
  const modal = document.getElementById("confirm-modal");
  const msgEl = document.getElementById("confirm-modal-message");
  if (!modal || !msgEl) return;

  msgEl.innerHTML = mensaje;
  _confirmCallback = onConfirm;
  modal.classList.add("active");
}

export function setupConfirmModal() {
  const modal = document.getElementById("confirm-modal");
  const btnClose = document.getElementById("btn-close-confirm-modal");
  const btnCancel = document.getElementById("btn-cancel-confirm");
  const btnAccept = document.getElementById("btn-accept-confirm");

  const cerrar = () => {
    if (modal) modal.classList.remove("active");
    _confirmCallback = null;
  };

  if (btnClose) btnClose.addEventListener("click", cerrar);
  if (btnCancel) btnCancel.addEventListener("click", cerrar);
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) cerrar(); });

  if (btnAccept) {
    btnAccept.addEventListener("click", async () => {
      cerrar();
      if (typeof _confirmCallback === "function") {
        await _confirmCallback();
      }
    });
  }
}
