export function setupModals() {
  const modalBtn = document.getElementById("btn-add-empleado-modal");
  if (modalBtn) {
    modalBtn.addEventListener("click", () => {
      abrirModalEmpleado();
    });
  }
  
  const closeBtn = document.getElementById("btn-close-empleado-modal");
  if (closeBtn) closeBtn.addEventListener("click", cerrarModalEmpleado);

  const cancelBtn = document.getElementById("btn-cancel-empleado-modal");
  if (cancelBtn) cancelBtn.addEventListener("click", cerrarModalEmpleado);
}

export function abrirModalEmpleado(empleadoData = null) {
  const empleadoModal = document.getElementById("empleado-modal");
  const form = document.getElementById("empleado-form");
  if (!empleadoModal || !form) return;

  form.reset();
  
  const modalTitle = document.getElementById("empleado-modal-title");
  const editIdInput = document.getElementById("emp-edit-id");
  
  if (empleadoData) {
    if (modalTitle) modalTitle.innerText = "Editar Empleado";
    if (editIdInput) editIdInput.value = empleadoData.id;
    document.getElementById("emp-nombre").value = empleadoData.nombre;
    document.getElementById("emp-sueldo").value = empleadoData.sueldoDiario;
    document.getElementById("emp-telefono").value = empleadoData.telefono;
    document.getElementById("emp-puesto").value = empleadoData.puesto;
  } else {
    if (modalTitle) modalTitle.innerText = "Agregar Nuevo Empleado";
    if (editIdInput) editIdInput.value = "";
  }
  
  empleadoModal.classList.add("active-modal");
}

export function cerrarModalEmpleado() {
  const empleadoModal = document.getElementById("empleado-modal");
  if (empleadoModal) {
    empleadoModal.classList.remove("active-modal");
  }
}
