import { appState } from "../state.js";
import { showToast } from "../utils/notifications.js";
import { abrirModalEmpleado, cerrarModalEmpleado } from "../utils/modals.js";
import { 
  addEmpleado, 
  updateEmpleado, 
  toggleEmpleadoActivo, 
  getTodosLosEmpleados 
} from "../db.js";

export async function cargarEmpleadosCache() {
  appState.empleadosCache = await getTodosLosEmpleados();
}

export async function cargarListadoEmpleados() {
  const grid = document.getElementById("empleados-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
      <i class="fa-solid fa-spinner fa-spin" style="font-size: 24px;"></i>
      <p style="margin-top: 12px;">Actualizando catálogo de personal...</p>
    </div>
  `;
  
  await cargarEmpleadosCache();
  
  if (appState.empleadosCache.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="fa-solid fa-users-slash" style="font-size: 40px; color: var(--text-muted); margin-bottom: 12px;"></i>
        <p>No tienes empleados registrados en el sistema.</p>
        <button class="btn btn-primary btn-sm" style="margin-top: 12px;" id="btn-add-empleado-grid-action">
          Dar de alta empleado
        </button>
      </div>
    `;
    
    const actionBtn = document.getElementById("btn-add-empleado-grid-action");
    if (actionBtn) {
      actionBtn.addEventListener("click", () => {
        abrirModalEmpleado();
      });
    }
    return;
  }
  
  grid.innerHTML = "";
  
  appState.empleadosCache.forEach(emp => {
    const card = document.createElement("div");
    card.className = "profile-card";
    
    // Obtener iniciales
    const iniciales = emp.nombre.split(" ").map(n => n[0]).slice(0, 2).join("");
    
    const formattedSueldo = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(emp.sueldoDiario);
    
    card.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">${iniciales}</div>
        <div class="profile-info">
          <h3 class="profile-name">${emp.nombre}</h3>
          <span class="profile-role"><i class="fa-solid fa-briefcase"></i> ${emp.puesto || 'Ayudante'}</span>
        </div>
      </div>
      
      <div class="profile-details">
        <div class="detail-row">
          <span class="detail-label">Sueldo Diario:</span>
          <span class="detail-val" style="color: var(--primary);">${formattedSueldo}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Teléfono:</span>
          <span class="detail-val">${emp.telefono || 'Sin teléfono'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Estado:</span>
          <span class="status-badge ${emp.activo ? 'status-active' : 'status-inactive'}">
            ${emp.activo ? 'Activo' : 'Baja'}
          </span>
        </div>
      </div>
      
      <div class="profile-actions">
        <button class="btn btn-secondary btn-icon-only edit-emp-btn" data-id="${emp.id}" aria-label="Editar Empleado">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="btn ${emp.activo ? 'btn-danger' : 'btn-primary'} btn-sm toggle-emp-btn" data-id="${emp.id}" data-activo="${emp.activo}">
          ${emp.activo ? '<i class="fa-solid fa-user-minus"></i> Dar de Baja' : '<i class="fa-solid fa-user-plus"></i> Reactivar'}
        </button>
      </div>
    `;
    
    // Attach event listeners to buttons
    card.querySelector(".edit-emp-btn").addEventListener("click", () => {
      abrirModalEmpleado(emp);
    });
    
    card.querySelector(".toggle-emp-btn").addEventListener("click", async (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      const activoActual = e.currentTarget.getAttribute("data-activo") === "true";
      const nuevoEstado = !activoActual;
      
      const res = await toggleEmpleadoActivo(id, nuevoEstado);
      if (res.success) {
        showToast(
          nuevoEstado ? "Empleado Reactivado" : "Baja del Empleado",
          `${emp.nombre} ahora está ${nuevoEstado ? 'activo' : 'inactivo'}.`,
          "success"
        );
        await cargarListadoEmpleados();
      } else {
        showToast("Error", "No se pudo actualizar el estado del empleado.", "error");
      }
    });
    
    grid.appendChild(card);
  });
}

export function setupEmpleadosModule() {
  const form = document.getElementById("empleado-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("emp-edit-id").value;
    const nombre = document.getElementById("emp-nombre").value;
    const sueldo = document.getElementById("emp-sueldo").value;
    const telefono = document.getElementById("emp-telefono").value;
    const puesto = document.getElementById("emp-puesto").value;
    
    if (id) {
      // Editar
      const res = await updateEmpleado(id, { nombre, sueldoDiario: sueldo, telefono, puesto });
      if (res.success) {
        showToast("Empleado Actualizado", `${nombre} se modificó con éxito.`, "success");
        cerrarModalEmpleado();
        await cargarListadoEmpleados();
      } else {
        showToast("Error", "Ocurrió un error al actualizar.", "error");
      }
    } else {
      // Registrar Nuevo (Alta)
      const res = await addEmpleado(nombre, sueldo, telefono, puesto);
      if (res.success) {
        showToast("Alta de Empleado", `${nombre} se agregó correctamente.`, "success");
        cerrarModalEmpleado();
        await cargarListadoEmpleados();
      } else {
        showToast("Error", "No se pudo registrar el empleado.", "error");
      }
    }
  });
}
