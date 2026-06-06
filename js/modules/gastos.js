import { appState } from "../state.js";
import { showToast } from "../utils/notifications.js";
import { inicializarDashboard } from "./dashboard.js";
import {
  getEmpleadosActivos,
  getGastosDia,
  saveGastosDia
} from "../db.js";

export async function cargarFormularioGastos(fechaStr) {
  const form = document.getElementById("gasto-form");
  if (!form) return;

  form.reset();

  // Limpiar campos numéricos
  document.getElementById("gasto-central").value = "";
  document.getElementById("gasto-comida-bebida").value = "";
  document.getElementById("gasto-gasolina").value = "";
  document.getElementById("gasto-otros").value = "";
  document.getElementById("gasto-otros-detalle").value = "";

  // Cargar todos los empleados activos para control de asistencia
  const listaAsistencia = document.getElementById("asistencia-payroll-list");
  if (!listaAsistencia) return;

  listaAsistencia.innerHTML = `
    <div style="text-align: center; padding: 24px; color: var(--text-muted);">
      <i class="fa-solid fa-spinner fa-spin"></i> Cargando personal activo...
    </div>
  `;

  const activos = await getEmpleadosActivos();

  if (activos.length === 0) {
    listaAsistencia.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: var(--radius-sm);">
        <i class="fa-solid fa-user-xmark" style="font-size: 24px; margin-bottom: 8px;"></i>
        <p>No hay empleados activos. Ve a la sección de <strong>Empleados</strong> para dar de alta.</p>
      </div>
    `;
    recalcularTotalGastosPreview();
    return;
  }

  // Buscar si ya existen gastos guardados para esta fecha
  const record = await getGastosDia(fechaStr);
  const gastosPreexistentes = record.exists ? record.data : null;

  listaAsistencia.innerHTML = "";

  activos.forEach(emp => {
    const item = document.createElement("div");

    // Determinar si ya existía un registro de asistencia para este empleado en esta fecha
    let asistioVal = true; // Por defecto hoy sí vino
    let sueldoVal = emp.sueldoDiario;

    if (gastosPreexistentes && gastosPreexistentes.nominas && gastosPreexistentes.nominas[emp.id]) {
      asistioVal = gastosPreexistentes.nominas[emp.id].asistio;
      sueldoVal = gastosPreexistentes.nominas[emp.id].monto;
    }

    item.className = `payroll-item ${asistioVal ? 'present-item' : 'absent-item'}`;
    item.setAttribute("data-id", emp.id);
    item.setAttribute("data-nombre", emp.nombre);
    item.setAttribute("data-sueldo", sueldoVal);

    const inicial = emp.nombre[0].toUpperCase();
    const formattedSueldo = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(sueldoVal);

    item.innerHTML = `
      <div class="payroll-item-left">
        <div class="payroll-item-avatar">${inicial}</div>
        <div class="payroll-item-info">
          <h4>${emp.nombre}</h4>
          <p>${emp.puesto || 'Ayudante'}</p>
        </div>
      </div>
      
      <div class="payroll-item-right">
        <div class="payroll-wage-tag">${formattedSueldo}</div>
        <label class="switch" aria-label="Asistencia para ${emp.nombre}">
          <input type="checkbox" class="asistencia-switch" ${asistioVal ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      </div>
    `;

    // Listener para cambiar estilos y recalcular nóminas en tiempo real
    item.querySelector(".asistencia-switch").addEventListener("change", (e) => {
      const check = e.target.checked;
      if (check) {
        item.className = "payroll-item present-item";
      } else {
        item.className = "payroll-item absent-item";
      }
      recalcularTotalGastosPreview();
    });

    listaAsistencia.appendChild(item);
  });

  // Pre-rellenar formulario si ya existían gastos
  if (gastosPreexistentes) {
    document.getElementById("gasto-central").value = gastosPreexistentes.central || "";

    // Carga con retrocompatibilidad (sumar comidas y bebidas legadas si no existe comidaBebida)
    const comidaBebidaVal = (gastosPreexistentes.comidaBebida !== undefined)
      ? gastosPreexistentes.comidaBebida
      : ((parseFloat(gastosPreexistentes.comidas) || 0) + (parseFloat(gastosPreexistentes.bebidas) || 0));

    document.getElementById("gasto-comida-bebida").value = comidaBebidaVal || "";
    document.getElementById("gasto-gasolina").value = gastosPreexistentes.gasolina || "";
    document.getElementById("gasto-otros").value = gastosPreexistentes.otros || "";
    document.getElementById("gasto-otros-detalle").value = gastosPreexistentes.otrosDetalle || "";

    showToast("Gastos Cargados", `Se recuperaron los gastos del día ${fechaStr} para edición.`, "warning");
  }

  recalcularTotalGastosPreview();
}

export function recalcularTotalGastosPreview() {
  const central = parseFloat(document.getElementById("gasto-central").value) || 0;
  const comidaBebida = parseFloat(document.getElementById("gasto-comida-bebida").value) || 0;
  const gasolina = parseFloat(document.getElementById("gasto-gasolina").value) || 0;
  const otros = parseFloat(document.getElementById("gasto-otros").value) || 0;

  let totalNominas = 0;
  document.querySelectorAll(".payroll-item").forEach(item => {
    const asistio = item.querySelector(".asistencia-switch").checked;
    const sueldo = parseFloat(item.getAttribute("data-sueldo")) || 0;
    if (asistio) {
      totalNominas += sueldo;
    }
  });

  const totalGasto = central + comidaBebida + gasolina + otros + totalNominas;
  const formatted = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalGasto);

  const calcElem = document.getElementById("gasto-total-calc");
  if (calcElem) {
    calcElem.innerText = formatted;
  }
}

export function setupGastosModule() {
  // Listener para inputs de gastos que disparan el recálculo interactivo
  const inputsCalculo = ["gasto-central", "gasto-comida-bebida", "gasto-gasolina", "gasto-otros"];
  inputsCalculo.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", recalcularTotalGastosPreview);
  });

  // Selector de fecha en gastos
  const dateInput = document.getElementById("gasto-fecha-input");
  if (dateInput) {
    dateInput.addEventListener("change", async (e) => {
      await cargarFormularioGastos(e.target.value);
    });
  }

  // Guardar Gastos Form
  const form = document.getElementById("gasto-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fechaStr = document.getElementById("gasto-fecha-input").value;

      // Recopilar nóminas
      const nominas = {};
      document.querySelectorAll(".payroll-item").forEach(item => {
        const empId = item.getAttribute("data-id");
        const nombre = item.getAttribute("data-nombre");
        const sueldo = parseFloat(item.getAttribute("data-sueldo")) || 0;
        const asistio = item.querySelector(".asistencia-switch").checked;

        nominas[empId] = {
          nombre,
          monto: sueldo,
          asistio
        };
      });

      const datosGasto = {
        central: document.getElementById("gasto-central").value,
        comidaBebida: document.getElementById("gasto-comida-bebida").value,
        gasolina: document.getElementById("gasto-gasolina").value,
        otros: document.getElementById("gasto-otros").value,
        otrosDetalle: document.getElementById("gasto-otros-detalle").value,
        nominas
      };

      const res = await saveGastosDia(fechaStr, datosGasto);
      if (res.success) {
        showToast("Gastos Guardados", `Se guardaron correctamente los gastos para el día ${fechaStr}. Total: $${res.totalGastos.toFixed(2)}`, "success");
        if (fechaStr === appState.currentDate) {
          await inicializarDashboard();
        }
      } else {
        showToast("Error", "No se pudieron guardar los gastos.", "error");
      }
    });
  }

  // Botón Limpiar Formulario Gastos
  const btnLimpiar = document.getElementById("btn-limpiar-gastos");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      const gCentral = document.getElementById("gasto-central");
      const gComidaBebida = document.getElementById("gasto-comida-bebida");
      const gGasolina = document.getElementById("gasto-gasolina");
      const gOtros = document.getElementById("gasto-otros");
      const gOtrosDetalle = document.getElementById("gasto-otros-detalle");

      if (gCentral) gCentral.value = "";
      if (gComidaBebida) gComidaBebida.value = "";
      if (gGasolina) gGasolina.value = "";
      if (gOtros) gOtros.value = "";
      if (gOtrosDetalle) gOtrosDetalle.value = "";

      // Resetear asistencia a todos presentes
      document.querySelectorAll(".payroll-item").forEach(item => {
        item.className = "payroll-item present-item";
        const sw = item.querySelector(".asistencia-switch");
        if (sw) sw.checked = true;
      });

      recalcularTotalGastosPreview();
      showToast("Formulario Limpiado", "Se han borrado los campos de gastos.", "info");
    });
  }
}
