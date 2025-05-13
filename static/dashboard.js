// Importar módulos de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Configuración de Firebase
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

// Referencias
const ventasRef = ref(db, 'resumen_ventas/mensual');
const productosRef = ref(db, 'productos');

// Función para cargar ventas mensuales
function cargarVentasMensuales() {
  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1;
  const anioActual = ahora.getFullYear();
  const mesClave = `${anioActual}-${String(mesActual).padStart(2, '0')}`;

  const mesRef = ref(db, `resumen_ventas/mensual/${mesClave}/total`);

  onValue(mesRef, (snapshot) => {
    const totalMensual = snapshot.val() || 0;
    document.getElementById("ventasMes").textContent = `RD$ ${totalMensual.toFixed(2)}`;
    mostrarGraficoAmcharts(totalMensual);
  });
}

// Función para cargar productos
function cargarProductos() {
  onValue(productosRef, (snapshot) => {
    const productos = snapshot.val();
    let totalProductos = 0;
    let productosPorReponer = 0;

    if (productos) {
      Object.values(productos).forEach((producto) => {
        totalProductos += producto.cantidad;
        if (producto.cantidad <= 2) {
          productosPorReponer++;
        }
      });
    }

    document.getElementById("productosEnStock").textContent = totalProductos;
    document.getElementById("productosPorReponer").textContent = productosPorReponer;
  });
}

// Función para mostrar el gráfico usando amCharts
function mostrarGraficoAmcharts(total) {
  am5.ready(function() {
    // Eliminar el gráfico anterior si existe
    const chartContainer = document.getElementById("ventasChart");
    chartContainer.innerHTML = "";

    // Crear root
    let root = am5.Root.new("ventasChart");

    // Tema animado
    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    // Crear chart
    let chart = root.container.children.push(
      am5percent.PieChart.new(root, {
        layout: root.verticalLayout
      })
    );

    // Crear serie
    let series = chart.series.push(
      am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "category"
      })
    );

    // Set data
    series.data.setAll([
      { category: "Ventas del Mes", value: total },
      { category: "Restante para Meta", value: 1000 - total > 0 ? 1000 - total : 0 }
    ]);

    // Animación de aparición
    series.appear(1000, 100);
  });
}

// Ejecutar funciones al cargar
window.onload = () => {
  cargarVentasMensuales();
  cargarProductos();
};
