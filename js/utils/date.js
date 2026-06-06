import { appState } from "../state.js";

export function setupCurrentDate() {
  const hoy = new Date();
  
  // Formato local YYYY-MM-DD
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  appState.currentDate = `${anio}-${mes}-${dia}`;
  
  // Mostrar fecha legible en cabecera
  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const headerDate = document.getElementById("header-date");
  if (headerDate) {
    headerDate.innerText = hoy.toLocaleDateString('es-ES', opciones);
  }

  // Inicializar inputs de fecha de gastos y ventas con el día de hoy
  const gastoFechaInput = document.getElementById("gasto-fecha-input");
  const ventaFechaInput = document.getElementById("venta-fecha-input");
  
  if (gastoFechaInput) gastoFechaInput.value = appState.currentDate;
  if (ventaFechaInput) ventaFechaInput.value = appState.currentDate;
  
  // Inicializar rango de reportes (por defecto esta semana)
  configurarFechasReporteSemanales();
}

export function configurarFechasReporteSemanales() {
  const hoy = new Date();
  const primerDia = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + 1)); // Lunes
  const ultimoDia = new Date(hoy.setDate(hoy.getDate() - hoy.getDay() + 7)); // Domingo
  
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  
  const repInicioInput = document.getElementById("reporte-fecha-inicio");
  const repFinInput = document.getElementById("reporte-fecha-fin");
  
  if (repInicioInput) repInicioInput.value = fmt(primerDia);
  if (repFinInput) repFinInput.value = fmt(ultimoDia);
}
