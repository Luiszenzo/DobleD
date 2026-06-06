export function showToast(titulo, mensaje, tipo = "success") {
  const toastContainer = document.getElementById("toast-container");
  if (!toastContainer) return null;

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  
  let iconClass = "fa-solid fa-circle-check";
  if (tipo === "error") iconClass = "fa-solid fa-circle-xmark";
  if (tipo === "warning") iconClass = "fa-solid fa-circle-exclamation";
  
  toast.innerHTML = `
    <div class="toast-icon"><i class="${iconClass}"></i></div>
    <div class="toast-content">
      <div class="toast-title">${titulo}</div>
      <div class="toast-message">${mensaje}</div>
    </div>
    <button class="toast-close" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button>
  `;
  
  toastContainer.appendChild(toast);
  
  // Configurar cierre por clic en el botón X
  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  });
  
  // Autocerrado a los 4 segundos
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);

  return toast;
}
