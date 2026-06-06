import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// 1. MÓDULO EMPLEADOS (Alta/Baja/Edición)
// ==========================================

const empleadosCol = collection(db, "empleados");

// Registrar nuevo empleado (Alta)
export async function addEmpleado(nombre, sueldoDiario, telefono, puesto) {
  try {
    const docRef = await addDoc(empleadosCol, {
      nombre: nombre.trim(),
      sueldoDiario: parseFloat(sueldoDiario) || 0,
      telefono: telefono.trim() || "",
      puesto: puesto.trim() || "Ayudante",
      activo: true,
      fechaAlta: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al dar de alta al empleado:", error);
    return { success: false, error };
  }
}

// Modificar datos de empleado
export async function updateEmpleado(id, datos) {
  try {
    const empleadoDoc = doc(db, "empleados", id);
    // Asegurarse de que el sueldo sea número si se está actualizando
    if (datos.sueldoDiario !== undefined) {
      datos.sueldoDiario = parseFloat(datos.sueldoDiario) || 0;
    }
    await updateDoc(empleadoDoc, datos);
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar empleado:", error);
    return { success: false, error };
  }
}

// Dar de baja (o de alta de nuevo) a un empleado
export async function toggleEmpleadoActivo(id, activo) {
  return await updateEmpleado(id, { activo });
}

// Obtener todos los empleados ordenados por nombre
export async function getTodosLosEmpleados() {
  try {
    const q = query(empleadosCol, orderBy("nombre", "asc"));
    const querySnapshot = await getDocs(q);
    const empleados = [];
    querySnapshot.forEach((doc) => {
      empleados.push({ id: doc.id, ...doc.data() });
    });
    return empleados;
  } catch (error) {
    console.error("Error al obtener empleados:", error);
    return [];
  }
}

// Obtener solo empleados activos
export async function getEmpleadosActivos() {
  try {
    const q = query(empleadosCol, where("activo", "==", true));
    const querySnapshot = await getDocs(q);
    const empleados = [];
    querySnapshot.forEach((doc) => {
      empleados.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar por nombre en el lado del cliente para evitar requerir índices compuestos en Firestore
    empleados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return empleados;
  } catch (error) {
    console.error("Error al obtener empleados activos:", error);
    return [];
  }
}

// ==========================================
// 2. MÓDULO GASTOS
// ==========================================

const gastosCol = collection(db, "gastos");

// Guardar gastos de un día en específico (Formato fechaStr: "YYYY-MM-DD")
export async function saveGastosDia(fechaStr, datosGasto) {
  try {
    const docRef = doc(db, "gastos", fechaStr);

    // Convertir campos numéricos
    const central = parseFloat(datosGasto.central) || 0;
    const comidaBebida = parseFloat(datosGasto.comidaBebida) || 0;
    const gasolina = parseFloat(datosGasto.gasolina) || 0;
    const otros = parseFloat(datosGasto.otros) || 0;

    // nominas debe ser un array de objetos o un mapa.
    // Ej: { empleadoId: { nombre: "Juan", monto: 350, asistio: true } }
    const nominas = datosGasto.nominas || {};

    // Calcular el gasto en nóminas basado en la asistencia
    let totalNominas = 0;
    Object.values(nominas).forEach(nom => {
      if (nom.asistio) {
        totalNominas += parseFloat(nom.monto) || 0;
      }
    });

    const totalGastos = central + comidaBebida + gasolina + otros + totalNominas;

    const data = {
      fechaStr,
      fecha: Timestamp.fromDate(new Date(fechaStr + "T12:00:00")), // Hora fija para evitar desfases de zona horaria
      central,
      comidaBebida,
      comidas: 0, // Resetear campo heredado para evitar duplicados en futuras lecturas
      bebidas: 0, // Resetear campo heredado para evitar duplicados en futuras lecturas
      gasolina,
      otros,
      otrosDetalle: datosGasto.otrosDetalle || "",
      nominas,
      totalNominas,
      totalGastos,
      fechaActualizado: serverTimestamp()
    };

    await setDoc(docRef, data, { merge: true });
    return { success: true, totalGastos };
  } catch (error) {
    console.error("Error al guardar gastos del día:", error);
    return { success: false, error };
  }
}

// Obtener gastos de un día
export async function getGastosDia(fechaStr) {
  try {
    const docRef = doc(db, "gastos", fechaStr);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { exists: true, data: docSnap.data() };
    }
    return { exists: false };
  } catch (error) {
    console.error("Error al obtener gastos del día:", error);
    return { exists: false, error };
  }
}

// ==========================================
// 3. MÓDULO VENTAS
// ==========================================

const ventasCol = collection(db, "ventas");

// Guardar ventas de un día (Formato fechaStr: "YYYY-MM-DD")
export async function saveVentasDia(fechaStr, datosVenta) {
  try {
    const docRef = doc(db, "ventas", fechaStr);

    const totalVenta = parseFloat(datosVenta.totalVenta) || 0;
    const horasTrabajadas = parseFloat(datosVenta.horasTrabajadas) || 0;

    const data = {
      fechaStr,
      fecha: Timestamp.fromDate(new Date(fechaStr + "T12:00:00")),
      totalVenta,
      horasTrabajadas,
      notas: datosVenta.notas || "",
      fechaActualizado: serverTimestamp()
    };

    await setDoc(docRef, data, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error al guardar ventas del día:", error);
    return { success: false, error };
  }
}

// Obtener ventas de un día
export async function getVentasDia(fechaStr) {
  try {
    const docRef = doc(db, "ventas", fechaStr);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { exists: true, data: docSnap.data() };
    }
    return { exists: false };
  } catch (error) {
    console.error("Error al obtener ventas del día:", error);
    return { exists: false, error };
  }
}

// ==========================================
// 4. CONSULTAS HISTÓRICAS PARA REPORTES
// ==========================================

// Obtener todas las ventas y gastos dentro de un rango de fechas
export async function getDatosRango(fechaInicioStr, fechaFinStr) {
  try {
    const tInicio = Timestamp.fromDate(new Date(fechaInicioStr + "T00:00:00"));
    const tFin = Timestamp.fromDate(new Date(fechaFinStr + "T23:59:59"));

    // Consulta de Ventas
    const qVentas = query(ventasCol, where("fecha", ">=", tInicio), where("fecha", "<=", tFin));
    const snapshotVentas = await getDocs(qVentas);
    const ventas = {};
    snapshotVentas.forEach(doc => {
      ventas[doc.id] = doc.data();
    });

    // Consulta de Gastos
    const qGastos = query(gastosCol, where("fecha", ">=", tInicio), where("fecha", "<=", tFin));
    const snapshotGastos = await getDocs(qGastos);
    const gastos = {};
    snapshotGastos.forEach(doc => {
      gastos[doc.id] = doc.data();
    });

    return { ventas, gastos };
  } catch (error) {
    console.error("Error al consultar datos en rango:", error);
    return { ventas: {}, gastos: {} };
  }
}
