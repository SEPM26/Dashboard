// Importar módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCsTqUlwfjPyQ7RjVhmLvfLeT-TrpZxWk8",
  authDomain: "inventario-4167a.firebaseapp.com",
  databaseURL: "https://inventario-4167a-default-rtdb.firebaseio.com",
  projectId: "inventario-4167a",
  storageBucket: "inventario-4167a.appspot.com",
  messagingSenderId: "389377188026",
  appId: "1:389377188026:web:7191b55bdd8408c0aee283",
  measurementId: "G-PZYSLDTH6R"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const productosRef = ref(db, 'productos');

// Función para mostrar alertas flotantes
function mostrarAlerta(mensaje, tipo = 'success') {
  const alerta = document.createElement('div');
  alerta.className = `alert alert-${tipo} position-fixed top-0 end-0 m-4 shadow`;
  alerta.style.zIndex = '9999';
  alerta.innerHTML = mensaje;

  document.body.appendChild(alerta);

  setTimeout(() => {
    alerta.remove();
  }, 3000);
}

// Cargar productos desde Firebase
function cargarProductos() {
  onValue(productosRef, (snapshot) => {
    const tabla = document.getElementById("tablaProductos");
    tabla.innerHTML = "";

    const productos = snapshot.val();
    if (productos) {
      Object.entries(productos).forEach(([id, producto]) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${producto.nombre}</td>
          <td>${producto.categoria}</td>
          <td><input type="number" value="${producto.precio}" class="form-control" id="precio-${id}"></td>
          <td><input type="number" value="${producto.cantidad}" class="form-control" id="cantidad-${id}"></td>
          <td>
            <button class="btn btn-sm btn-warning me-1" onclick="editarProducto('${id}')">Editar</button>
            <button class="btn btn-sm btn-danger" onclick="eliminarProducto('${id}')">Eliminar</button>
          </td>
        `;
        tabla.appendChild(row);
      });
    }
  });
}

// Agregar producto
document.getElementById("formAgregarProducto").addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombreProducto").value;
  const categoria = document.getElementById("categoriaProducto").value;
  const precio = parseFloat(document.getElementById("precioProducto").value);
  const cantidad = parseInt(document.getElementById("cantidadProducto").value);

  if (!nombre || !categoria || isNaN(precio) || isNaN(cantidad)) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  push(productosRef, {
    nombre,
    categoria,
    precio,
    cantidad
  }).then(() => {
    document.getElementById("formAgregarProducto").reset();
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalAgregar"));
    modal.hide();
    mostrarAlerta("¡Producto agregado!");
  });
});

// Editar producto
window.editarProducto = function (id) {
  const precio = parseFloat(document.getElementById(`precio-${id}`).value);
  const cantidad = parseInt(document.getElementById(`cantidad-${id}`).value);

  if (isNaN(precio) || isNaN(cantidad)) {
    alert("Precio y cantidad deben ser válidos.");
    return;
  }

  update(ref(db, `productos/${id}`), {
    precio,
    cantidad
  }).then(() => {
    mostrarAlerta("¡Editado con éxito!");
  });
};

// Eliminar producto
window.eliminarProducto = function (id) {
  if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
    remove(ref(db, `productos/${id}`)).then(() => {
      mostrarAlerta("¡Producto eliminado!", 'danger');
    });
  }
};

// Inicializar carga
cargarProductos();

// Función para generar el PDF con fecha y detalles completos
function generarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Obtener la fecha actual
  const fecha = new Date();
  const fechaString = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;

  // Añadir el título con la fecha
  doc.setFontSize(18);
  doc.text(`Inventario Diario - ${fechaString}`, 20, 20);

  // Añadir los encabezados de la tabla
  doc.setFontSize(12);
  doc.text("Producto | Categoría | Precio (RD$) | Cantidad", 20, 30);

  // Añadir productos desde la tabla
  const tabla = document.getElementById("tablaProductos");
  let y = 40; // Posición Y para las filas
  const productos = Array.from(tabla.getElementsByTagName("tr"));
  
  productos.forEach((producto, index) => {
    const cols = producto.getElementsByTagName("td");
    if (cols.length > 0) {
      const productoData = [
        cols[0].textContent,  // Nombre del producto
        cols[1].textContent,  // Categoría
        cols[2].querySelector("input").value,  // Precio (debe extraer el valor del input)
        cols[3].querySelector("input").value   // Cantidad (debe extraer el valor del input)
      ];

      // Añadir una fila al PDF
      doc.text(productoData.join(' | '), 20, y);
      y += 10; // Incrementar Y para la siguiente fila
    }
  });

  // Guardar el archivo PDF
  doc.save(`inventario_diario_${fechaString}.pdf`);
}

// Botón para generar y descargar PDF
document.getElementById("btnDescargarPDF").addEventListener("click", generarPDF);

