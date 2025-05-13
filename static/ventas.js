import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
  push,
  update,
  set,
  remove
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCsTqUlwfjPyQ7RjVhmLvfLeT-TrpZxWk8",
  authDomain: "inventario-4167a.firebaseapp.com",
  databaseURL: "https://inventario-4167a-default-rtdb.firebaseio.com",
  projectId: "inventario-4167a",
  storageBucket: "inventario-4167a.appspot.com",
  messagingSenderId: "389377188026",
  appId: "1:389377188026:web:7191b55bdd8408c0aee283"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const productosRef = ref(db, 'productos');
const ventasRef = ref(db, 'ventas');
const productosMap = {};

// 🔄 CARGAR PRODUCTOS EN SELECT
function cargarProductos() {
  onValue(productosRef, (snapshot) => {
    const select = document.getElementById("productoVenta");
    select.innerHTML = '<option disabled selected>Seleccionar producto</option>';
    const productos = snapshot.val();
    if (productos) {
      Object.entries(productos).forEach(([id, producto]) => {
        productosMap[id] = producto;
        const option = document.createElement("option");
        option.value = id;
        option.textContent = `${producto.nombre} - RD$ ${producto.precio}`;
        select.appendChild(option);
      });
    }
  });
}

// Cambiar precio al seleccionar producto
document.getElementById("productoVenta").addEventListener("change", (e) => {
  const producto = productosMap[e.target.value];
  document.getElementById("precioVenta").value = producto?.precio || "";
});

// 🧾 REGISTRAR VENTA Y ACTUALIZAR RESÚMENES
document.getElementById("formRegistrarVenta").addEventListener("submit", (e) => {
  e.preventDefault();

  const productoId = document.getElementById("productoVenta").value;
  const cantidad = parseInt(document.getElementById("cantidadVenta").value);
  const precio = parseFloat(document.getElementById("precioVenta").value);

  if (!productoId || isNaN(cantidad) || isNaN(precio)) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  const total = cantidad * precio;
  const fecha = new Date();
  const fechaISO = fecha.toISOString().split("T")[0]; // YYYY-MM-DD
  const mesClave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM

  const venta = {
    productoId,
    productoNombre: productosMap[productoId]?.nombre || "Desconocido",
    cantidad,
    total,
    fecha: fecha.toLocaleString()
  };

  push(ventasRef, venta).then(() => {
    // Actualizar stock
    const nuevoStock = (productosMap[productoId].cantidad || 0) - cantidad;
    update(ref(db, `productos/${productoId}`), {
      cantidad: nuevoStock >= 0 ? nuevoStock : 0
    });

    // Guardar resumen diario
    const diaRef = ref(db, `resumen_ventas/dias/${fechaISO}`);
    onValue(diaRef, (snapshot) => {
      const actual = snapshot.val() || 0;
      set(diaRef, actual + total);
    }, { onlyOnce: true });

    // Guardar resumen mensual
    const mesRef = ref(db, `resumen_ventas/mensual/${mesClave}`);
    onValue(mesRef, (snapshot) => {
      const actual = snapshot.val()?.total || 0;
      update(mesRef, { total: actual + total });
    }, { onlyOnce: true });

    document.getElementById("formRegistrarVenta").reset();
    cargarVentas();
  });
});

// 📊 MOSTRAR HISTORIAL Y PORCENTAJE
function cargarVentas() {
  onValue(ventasRef, (snapshot) => {
    const tabla = document.getElementById("tablaVentas");
    const totalEl = document.getElementById("totalVentasDiarias");
    const porcentajeEl = document.getElementById("porcentajeMes");

    tabla.innerHTML = "";
    let totalDelDia = 0;
    const hoy = new Date().toLocaleDateString();
    const mesClave = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const ventas = snapshot.val();
    if (ventas) {
      Object.entries(ventas).forEach(([id, venta]) => {
        const fechaVenta = new Date(venta.fecha).toLocaleDateString();
        if (fechaVenta === hoy) {
          totalDelDia += parseFloat(venta.total || 0);
        }
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${venta.productoNombre}</td>
          <td>${venta.cantidad}</td>
          <td>RD$ ${venta.total}</td>
          <td>${venta.fecha}</td>`;
        tabla.appendChild(row);
      });
    }

    totalEl.textContent = `Total generado hoy: RD$ ${totalDelDia.toFixed(2)}`;

    // Mostrar porcentaje del mes
    const mesRef = ref(db, `resumen_ventas/mensual/${mesClave}`);
    onValue(mesRef, (snapshot) => {
      const totalMes = snapshot.val()?.total || 0;
      const porcentaje = totalMes > 0 ? (totalDelDia / totalMes) * 100 : 0;
      porcentajeEl.textContent = `Hoy representa el ${porcentaje.toFixed(1)}% del total mensual.`;
    });
  });
}

// 🗑️ ELIMINAR VENTAS DEL DÍA (sin afectar resumen mensual)
document.getElementById("btnLimpiarVentas").addEventListener("click", () => {
  if (confirm("¿Seguro que deseas eliminar todas las ventas de hoy?")) {
    const hoy = new Date().toLocaleDateString();
    onValue(ventasRef, (snapshot) => {
      const ventas = snapshot.val();
      if (ventas) {
        Object.entries(ventas).forEach(([id, venta]) => {
          const fechaVenta = new Date(venta.fecha).toLocaleDateString();
          if (fechaVenta === hoy) {
            remove(ref(db, `ventas/${id}`)); // solo elimina del nodo ventas
          }
        });
        alert("Ventas de hoy eliminadas. El resumen mensual se mantiene.");
        cargarVentas();
      }
    }, { onlyOnce: true });
  }
});

// 🔁 Cargar todo al iniciar
window.onload = () => {
  cargarProductos();
  cargarVentas();
};
