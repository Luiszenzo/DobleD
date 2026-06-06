import { appState } from "../state.js";
import { getVentasDia, getGastosDia, getDatosRango } from "../db.js";

export async function inicializarDashboard() {
  const ventaHoyRecord = await getVentasDia(appState.currentDate);
  const gastoHoyRecord = await getGastosDia(appState.currentDate);
  
  const vTotal = ventaHoyRecord.exists ? ventaHoyRecord.data.totalVenta : 0;
  const gTotal = gastoHoyRecord.exists ? gastoHoyRecord.data.totalGastos : 0;
  const nGanancia = vTotal - gTotal;
  
  const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
  
  const vHoyInput = document.getElementById("dash-venta-hoy");
  if (vHoyInput) vHoyInput.innerText = mxn.format(vTotal);

  const gHoyInput = document.getElementById("dash-gasto-hoy");
  if (gHoyInput) gHoyInput.innerText = mxn.format(gTotal);
  
  const nValue = document.getElementById("dash-ganancia-hoy");
  if (nValue) {
    nValue.innerText = mxn.format(nGanancia);
    const trendSpan = document.getElementById("dash-ganancia-trend");
    if (nGanancia >= 0) {
      nValue.style.color = "var(--primary)";
      if (trendSpan) {
        trendSpan.innerHTML = '<span class="trend-up"><i class="fa-solid fa-circle-arrow-up"></i> Balance positivo</span>';
      }
    } else {
      nValue.style.color = "var(--danger)";
      if (trendSpan) {
        trendSpan.innerHTML = '<span class="trend-down"><i class="fa-solid fa-circle-arrow-down"></i> Balance negativo</span>';
      }
    }
  }

  // Cargar desglose de gastos varios del día en el dashboard
  const detallesCont = document.getElementById("dashboard-gastos-detalles");
  const listaDetalles = document.getElementById("dashboard-gastos-detalles-lista");
  if (detallesCont && listaDetalles) {
    if (gastoHoyRecord.exists) {
      const comidaBebidaVal = (gastoHoyRecord.data.comidaBebida !== undefined)
        ? (gastoHoyRecord.data.comidaBebida || 0)
        : ((parseFloat(gastoHoyRecord.data.comidas) || 0) + ((parseFloat(gastoHoyRecord.data.bebidas) || 0)));
      
      const gasolinaVal = parseFloat(gastoHoyRecord.data.gasolina) || 0;
      const otrosVal = parseFloat(gastoHoyRecord.data.otros) || 0;
      const otrosDetalleStr = gastoHoyRecord.data.otrosDetalle || "";

      if (comidaBebidaVal > 0 || gasolinaVal > 0 || otrosVal > 0) {
        listaDetalles.innerHTML = "";
        
        if (comidaBebidaVal > 0) {
          listaDetalles.innerHTML += `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-primary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <span style="color: var(--text-secondary); display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-utensils" style="color: var(--info); font-size: 14px;"></i> Comida y Bebida</span>
              <strong style="color: var(--text-primary);">${mxn.format(comidaBebidaVal)}</strong>
            </li>
          `;
        }
        if (gasolinaVal > 0) {
          listaDetalles.innerHTML += `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-primary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <span style="color: var(--text-secondary); display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-gas-pump" style="color: var(--danger); font-size: 14px;"></i> Gasolina / Pasaje</span>
              <strong style="color: var(--text-primary);">${mxn.format(gasolinaVal)}</strong>
            </li>
          `;
        }
        if (otrosVal > 0) {
          listaDetalles.innerHTML += `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-primary); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="color: var(--text-secondary); display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-ellipsis" style="color: var(--text-muted); font-size: 14px;"></i> Otros Gastos</span>
                ${otrosDetalleStr ? `<small style="color: var(--text-muted); padding-left: 22px; font-style: italic;">Detalle: ${otrosDetalleStr}</small>` : ""}
              </div>
              <strong style="color: var(--text-primary);">${mxn.format(otrosVal)}</strong>
            </li>
          `;
        }
        detallesCont.style.display = "block";
      } else {
        detallesCont.style.display = "none";
      }
    } else {
      detallesCont.style.display = "none";
    }
  }

  // Cargar gráficas
  await cargarGraficaGastosHoy(gastoHoyRecord.exists ? gastoHoyRecord.data : null);
  await cargarGraficaSemanalDashboard();
}

// Gráfica de Dona: Gastos del Día
export function cargarGraficaGastosHoy(gastosHoy) {
  const canvas = document.getElementById("dashboardExpensesChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  
  if (appState.charts.expenses) {
    appState.charts.expenses.destroy();
  }
  
  if (!gastosHoy || gastosHoy.totalGastos === 0) {
    // Estado vacío
    appState.charts.expenses = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Sin Gastos'],
        datasets: [{
          data: [1],
          backgroundColor: ['#e2e8f0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom', labels: { color: appState.theme === 'dark' ? '#94a3b8' : '#475569' } }
        }
      }
    });
    return;
  }

  const isDark = appState.theme === 'dark';
  
  const comidaBebidaVal = (gastosHoy.comidaBebida !== undefined)
    ? (gastosHoy.comidaBebida || 0)
    : ((parseFloat(gastosHoy.comidas) || 0) + (parseFloat(gastosHoy.bebidas) || 0));

  appState.charts.expenses = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Central', 'Nóminas', 'Comida y Bebida', 'Gasolina', 'Otros'],
      datasets: [{
        data: [
          gastosHoy.central || 0,
          gastosHoy.totalNominas || 0,
          comidaBebidaVal,
          gastosHoy.gasolina || 0,
          gastosHoy.otros || 0
        ],
        backgroundColor: [
          '#10b981', // Emerald
          '#f59e0b', // Amber
          '#0ea5e9', // Sky Blue
          '#ec4899', // Pink
          '#64748b'  // Slate
        ],
        borderWidth: 1,
        borderColor: isDark ? '#1f2937' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: isDark ? '#94a3b8' : '#475569',
            font: { family: 'Outfit', size: 12 }
          }
        }
      }
    }
  });
}

// Gráfica de Línea: Tendencia de últimos 7 días
export async function cargarGraficaSemanalDashboard() {
  const canvas = document.getElementById("dashboardWeeklyChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  
  if (appState.charts.weekly) {
    appState.charts.weekly.destroy();
  }

  // Generar rango de los últimos 7 días terminando hoy
  const fechas = [];
  const hoy = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(hoy.getDate() - i);
    const fmt = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    fechas.push(fmt);
  }

  const { ventas, gastos } = await getDatosRango(fechas[0], fechas[6]);
  
  const datasetsVentas = fechas.map(f => ventas[f] ? ventas[f].totalVenta : 0);
  const datasetsGastos = fechas.map(f => gastos[f] ? gastos[f].totalGastos : 0);
  const datasetsGanancias = fechas.map(f => {
    const v = ventas[f] ? ventas[f].totalVenta : 0;
    const g = gastos[f] ? gastos[f].totalGastos : 0;
    return v - g;
  });

  // Traducir las fechas a formato dd/mm para etiquetas legibles
  const etiquetasLegibles = fechas.map(f => {
    const parts = f.split("-");
    return `${parts[2]}/${parts[1]}`;
  });

  const isDark = appState.theme === 'dark';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const labelColor = isDark ? '#94a3b8' : '#475569';

  appState.charts.weekly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: etiquetasLegibles,
      datasets: [
        {
          label: 'Ventas',
          data: datasetsVentas,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Gastos',
          data: datasetsGastos,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.05)',
          fill: true,
          tension: 0.3
        },
        {
          label: 'Ganancia Neta',
          data: datasetsGanancias,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.05)',
          fill: false,
          borderDash: [5, 5],
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: labelColor, font: { family: 'Outfit' } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: labelColor, font: { family: 'Outfit' } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: labelColor,
            font: { family: 'Outfit', weight: '600' }
          }
        }
      }
    }
  });
}
