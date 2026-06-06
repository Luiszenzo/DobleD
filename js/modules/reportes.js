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
        // Para personalizado el usuario elige las fechas manualmente
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

        // Auto-ejecutar reporte al cambiar periodo rápido
        ejecutarReporte();
      }
    });
  }

  // Auto-ejecutar cuando cambien las fechas de inicio/fin en modo personalizado
  const inputInicio = document.getElementById("reporte-fecha-inicio");
  const inputFin = document.getElementById("reporte-fecha-fin");
  if (inputInicio) {
    inputInicio.addEventListener("change", () => {
      if (inputInicio.value && inputFin && inputFin.value) {
        ejecutarReporte();
      }
    });
  }
  if (inputFin) {
    inputFin.addEventListener("change", () => {
      if (inputFin.value && inputInicio && inputInicio.value) {
        ejecutarReporte();
      }
    });
  }

  // Botón imprimir: genera una ventana de impresión optimizada para móvil y desktop
  const btnImprimir = document.getElementById("btn-imprimir-reporte");
  if (btnImprimir) {
    btnImprimir.addEventListener("click", () => {
      const inicio = document.getElementById("reporte-fecha-inicio")?.value || "";
      const fin = document.getElementById("reporte-fecha-fin")?.value || "";
      const titulo = `Reporte Doble D — ${inicio} al ${fin}`;

      const tablaEl = document.getElementById("reportes-tabla");
      const sumBoxes = document.querySelector(".report-summary-boxes");
      const tablaHTML = tablaEl ? tablaEl.outerHTML : "";
      const sumHTML = sumBoxes ? sumBoxes.outerHTML : "";

      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${titulo}</title>
          <style>
            *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 13px;
              color: #111;
              background: #fff;
              padding: 20px;
            }
            h1 {
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 4px;
              color: #1a1a1a;
            }
            .subtitle {
              font-size: 12px;
              color: #666;
              margin-bottom: 20px;
            }
            .summary-boxes {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 20px;
            }
            .report-summary-boxes {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              margin-bottom: 20px;
            }
            .summary-box {
              flex: 1;
              min-width: 120px;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 12px;
              text-align: center;
            }
            .summary-box h4 {
              font-size: 11px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 6px;
            }
            .summary-box p {
              font-size: 18px;
              font-weight: 700;
              color: #111;
            }
            .positive-box { border-color: #22c55e; }
            .positive-box p { color: #16a34a; }
            .negative-box { border-color: #ef4444; }
            .negative-box p { color: #dc2626; }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th {
              background: #f3f4f6;
              border: 1px solid #e5e7eb;
              padding: 8px 6px;
              text-align: left;
              font-weight: 700;
              font-size: 11px;
              text-transform: uppercase;
              color: #374151;
            }
            td {
              border: 1px solid #e5e7eb;
              padding: 8px 6px;
              vertical-align: top;
            }
            tr:nth-child(even) td { background: #f9fafb; }
            .report-gastos-varios-breakdown {
              font-size: 10px;
              color: #6b7280;
              margin-top: 4px;
              border-top: 1px solid #e5e7eb;
              padding-top: 3px;
            }
            @media print {
              body { padding: 10px; }
              button { display: none !important; }
            }
          </style>
        </head>
        <body>
          <h1>🍉 Doble D — Reporte Financiero</h1>
          <p class="subtitle">${titulo} &nbsp;|&nbsp; Generado: ${new Date().toLocaleString('es-MX')}</p>
          ${sumHTML}
          ${tablaHTML}
          <script>window.onload = function() { window.print(); }<\/script>
        </body>
        </html>
      `);
      printWindow.document.close();
    });
  }
}
