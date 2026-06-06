import { appState } from "../state.js";
import { showToast } from "../utils/notifications.js";
import { configurarFechasReporteSemanales } from "../utils/date.js";
import { getDatosRango } from "../db.js";

// Informe / auditoría histórica
export async function ejecutarReporte() {
  const inicioEl = document.getElementById("reporte-fecha-inicio");
  const finEl = document.getElementById("reporte-fecha-fin");
  if (!inicioEl || !finEl) return;

  const inicio = inicioEl.value;
  const fin = finEl.value;
  
  if (!inicio || !fin) {
    showToast("Campos Vacíos", "Por favor ingresa fechas de inicio y fin válidas.", "warning");
    return;
  }

  const { ventas, gastos } = await getDatosRango(inicio, fin);
  
  // Generar lista única de fechas en el rango
  const fechasLista = [];
  const dInicio = new Date(inicio + "T12:00:00");
  const dFin = new Date(fin + "T12:00:00");
  
  for (let d = new Date(dInicio); d <= dFin; d.setDate(d.getDate() + 1)) {
    const fmt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    fechasLista.push(fmt);
  }

  // Ordenar fechas cronológicamente de forma descendente (más recientes primero) para el listado de la tabla
  fechasLista.sort((a, b) => new Date(b) - new Date(a));

  const cuerpoTabla = document.getElementById("reporte-tabla-cuerpo");
  if (!cuerpoTabla) return;
  cuerpoTabla.innerHTML = "";

  let totalVentas = 0;
  let totalGastos = 0;
  let totalGanancias = 0;

  if (fechasLista.length === 0) {
    cuerpoTabla.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted);">
          No se encontraron datos registrados en el rango de fechas.
        </td>
      </tr>
    `;
    return;
  }

  const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  let huboRegistros = false;

  fechasLista.forEach(fechaStr => {
    const v = ventas[fechaStr];
    const g = gastos[fechaStr];

    // Ignorar si no hay registros en absoluto para ese día
    if (!v && !g) return;

    huboRegistros = true;

    const vMonto = v ? v.totalVenta : 0;
    const gCentral = g ? g.central : 0;
    const gNomina = g ? g.totalNominas : 0;
    
    // Retrocompatibilidad para reportes
    const gComidaBebida = g
      ? (g.comidaBebida !== undefined
        ? (g.comidaBebida || 0)
        : ((parseFloat(g.comidas) || 0) + (parseFloat(g.bebidas) || 0)))
      : 0;
    const gGasolina = g ? (g.gasolina || 0) : 0;
    const gOtros = g ? (g.otros || 0) : 0;
    const gOtrosDetalle = g ? (g.otrosDetalle || "") : "";

    const gVarios = gComidaBebida + gGasolina + gOtros;
    const gTotal = g ? g.totalGastos : 0;
    const nGanancia = vMonto - gTotal;

    totalVentas += vMonto;
    totalGastos += gTotal;
    totalGanancias += nGanancia;

    const tr = document.createElement("tr");
    
    let breakdownHtml = "";
    if (gVarios > 0) {
      breakdownHtml = `
        <div class="report-gastos-varios-breakdown" style="font-size: 11px; color: var(--text-secondary); margin-top: 6px; border-top: 1px solid var(--border-color); padding-top: 4px; display: flex; flex-direction: column; gap: 2px; line-height: 1.3;">
          ${gComidaBebida > 0 ? `<div><span style="color: var(--text-muted);">Comida/Bebida:</span> <strong>${mxn.format(gComidaBebida)}</strong></div>` : ''}
          ${gGasolina > 0 ? `<div><span style="color: var(--text-muted);">Gasolina:</span> <strong>${mxn.format(gGasolina)}</strong></div>` : ''}
          ${gOtros > 0 ? `<div><span style="color: var(--text-muted);">Otros:</span> <strong>${mxn.format(gOtros)}</strong>${gOtrosDetalle ? ` <span style="font-style: italic; color: var(--text-muted);">(${gOtrosDetalle})</span>` : ''}</div>` : ''}
        </div>
      `;
    }

    tr.innerHTML = `
      <td><strong>${fechaStr}</strong></td>
      <td style="color: var(--primary); font-weight: 700;">${mxn.format(vMonto)}</td>
      <td>${mxn.format(gCentral)}</td>
      <td>${mxn.format(gNomina)}</td>
      <td>
        <div><strong>${mxn.format(gVarios)}</strong></div>
        ${breakdownHtml}
      </td>
      <td style="color: var(--danger); font-weight: 600;">${mxn.format(gTotal)}</td>
      <td style="font-weight: 700; color: ${nGanancia >= 0 ? 'var(--primary)' : 'var(--danger)'};">
        ${mxn.format(nGanancia)}
      </td>
    `;
    cuerpoTabla.appendChild(tr);
  });

  if (!huboRegistros) {
    cuerpoTabla.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
          No hay transacciones (ventas o gastos) guardadas en esta fecha.
        </td>
      </tr>
    `;
  }

  // Actualizar indicadores principales de reporte
  const repTotalVentas = document.getElementById("rep-total-ventas");
  const repTotalGastos = document.getElementById("rep-total-gastos");
  const repGananciaNeta = document.getElementById("rep-ganancia-neta");
  const repGananciaBox = document.getElementById("rep-ganancia-box");

  if (repTotalVentas) repTotalVentas.innerText = mxn.format(totalVentas);
  if (repTotalGastos) repTotalGastos.innerText = mxn.format(totalGastos);
  
  if (repGananciaNeta) {
    repGananciaNeta.innerText = mxn.format(totalGanancias);
    if (repGananciaBox) {
      if (totalGanancias >= 0) {
        repGananciaBox.className = "summary-box positive-box";
        repGananciaNeta.style.color = "var(--primary)";
      } else {
        repGananciaBox.className = "summary-box negative-box";
        repGananciaNeta.style.color = "var(--danger)";
      }
    }
  }
}

export function setupReportesModule() {
  // Filtros de Reportes
  const selectTipo = document.getElementById("reporte-tipo");
  if (selectTipo) {
    selectTipo.addEventListener("change", (e) => {
      const val = e.target.value;
      const gInicio = document.getElementById("group-fecha-inicio");
      const gFin = document.getElementById("group-fecha-fin");
      
      if (!gInicio || !gFin) return;

      if (val === "personalizado") {
        gInicio.style.display = "flex";
        gFin.style.display = "flex";
      } else {
        gInicio.style.display = "none";
        gFin.style.display = "none";
        
        const hoy = new Date();
        const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        
        if (val === "diario") {
          document.getElementById("reporte-fecha-inicio").value = fmt(hoy);
          document.getElementById("reporte-fecha-fin").value = fmt(hoy);
        } else if (val === "semanal") {
          configurarFechasReporteSemanales();
        } else if (val === "mensual") {
          const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
          const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
          document.getElementById("reporte-fecha-inicio").value = fmt(primerDia);
          document.getElementById("reporte-fecha-fin").value = fmt(ultimoDia);
        }
      }
    });
  }

  const btnConsultar = document.getElementById("btn-consultar-reporte");
  if (btnConsultar) {
    btnConsultar.addEventListener("click", ejecutarReporte);
  }

  const btnImprimir = document.getElementById("btn-imprimir-reporte");
  if (btnImprimir) {
    btnImprimir.addEventListener("click", () => {
      window.print();
    });
  }
}
