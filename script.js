// VARIABLES GLOBALES
let db_idb; // IndexedDB
let db_sql; // SQLite

// 1. INICIALIZACIÓN DE BASES DE DATOS
async function inicializarBasesDeDatos() {
  try {
    // Inicializar SQLite
    const sqlite3 = await sqlite3InitModule();
    const oo = sqlite3.oo1;
    db_sql = new oo.DB("kanban.sqlite3", "ct");
    db_sql.exec("CREATE TABLE IF NOT EXISTS columnas_sql (titulo TEXT)");
    db_sql.exec(
      "CREATE TABLE IF NOT EXISTS tareas_sql (texto TEXT, nombre_columna TEXT, fecha TEXT, tipo TEXT)"
    );
    console.log("SQLite listo");

    // Inicializar IndexedDB
    const conexion = window.indexedDB.open("kanban_data", 1);
    conexion.onupgradeneeded = (e) => {
      db_idb = e.target.result;
      console.log("Base de datos creada", db_idb);
      const columnasStore = db_idb.createObjectStore("columnas", {
        keyPath: "idColumna",
        autoIncrement: true,
      });
      const tareasStore = db_idb.createObjectStore("tareas", {
        keyPath: "idTarea",
        autoIncrement: true,
      });
    };
    conexion.onsuccess = () => {
      db_idb = conexion.result;
      console.log("Base de datos abierta", 1);
      cargarEstado();
    };
  } catch (error) {
    console.error("Error inicializando bases de datos:", error);
  }
}

// 2.
window.onload = function () {
  const addColumn = document.getElementById("addColumn");
  const searchInput = document.getElementById("searchInput");
  const columnFilter = document.getElementById("columnFilter");

  addColumn.onclick = () => añadirColumna();

  // Buscador
  searchInput.addEventListener("input", function () {
    const texto = searchInput.value.toLowerCase();
    document.querySelectorAll(".tarea").forEach((tarea) => {
      const input = tarea.querySelector("input");
      const contenido = input.value.toLowerCase();
      tarea.style.display = contenido.includes(texto) ? "block" : "none";
    });
  });
  inicializarBasesDeDatos();
};

// para mostrar y ocultar el menu 
function toggleMenu() {
  const menu = document.querySelector(".taks");
  menu.classList.toggle("activo");
}

function filtrarPorTipo(tipo) {
  document.querySelectorAll(".tarea").forEach((tarea) => {
    // comprobar de que tipo es la tarea
    if (tipo === "ALL" || tarea.dataset.tipo === tipo) {
      tarea.style.display = "block";
    } else {
      tarea.style.display = "none";
    }
  });
}

// 3. GUARDAR Y CARGAR DATOS

function guardarEstado() {
  if (!db_idb || !db_sql) return;

  const tx = db_idb.transaction(["columnas", "tareas"], "readwrite");
  const storeCols = tx.objectStore("columnas");
  const storeTareas = tx.objectStore("tareas");

  // Limpiar datos viejos
  storeCols.clear();
  storeTareas.clear();
  db_sql.exec("DELETE FROM columnas_sql");
  db_sql.exec("DELETE FROM tareas_sql");

  document.querySelectorAll(".columna").forEach((col) => {
    const tituloInput = col.querySelector(".columna-header input");
    const titulo = tituloInput ? tituloInput.value : "";
    const contador = col.querySelector(".contador-tareas");
    const peticionCol = storeCols.add({ titulo: titulo });
    db_sql.exec({
      sql: "INSERT INTO columnas_sql (titulo) VALUES (?)",
      bind: [titulo],
    });

    peticionCol.onsuccess = (e) => {
      const idColumnaGenerado = e.target.result;

      // Guardamos las tareas de esta columna
      col.querySelectorAll(".tarea").forEach((t) => {
        const inputT = t.querySelector("input");
        const fechaTarea = col.querySelector(".fecha").textContent;
        const textoTarea = inputT.value;

        const tipo = t.dataset.tipo || "DESIGN";

        storeTareas.add({
          texto: textoTarea,
          fecha_creacion: fechaTarea,
          tipo: tipo,
          idRelacionColumna: idColumnaGenerado,
        });
        db_sql.exec({
          sql: "INSERT INTO tareas_sql (texto, nombre_columna, fecha, tipo) VALUES (?, ?, ?, ?)",
          bind: [textoTarea, titulo, fechaTarea, tipo],
        });
      });
    };
  });
}

async function cargarEstado() {
  if (!db_idb) return;

  const board = document.getElementById("board");
  board.innerHTML = "";

  const tx = db_idb.transaction(["columnas", "tareas"], "readonly");
  const storeCols = tx.objectStore("columnas");
  const storeTareas = tx.objectStore("tareas");

  storeCols.openCursor().onsuccess = (e) => {
    const cursorCol = e.target.result;
    if (cursorCol) {
      const colData = cursorCol.value;
      añadirColumna(colData.titulo);
      const todasLasCols = document.querySelectorAll(".columna");
      const ultimaCol = todasLasCols[todasLasCols.length - 1];
      const contenedorTareas = ultimaCol.querySelector(".contenedor-tareas");

      storeTareas.openCursor().onsuccess = (e) => {
        const cursorTarea = e.target.result;
        if (cursorTarea) {
          if (cursorTarea.value.idRelacionColumna === colData.idColumna) {
            crearTarea(
              contenedorTareas,
              cursorTarea.value.texto,
              cursorTarea.value.fecha_creacion,
              cursorTarea.value.tipo
            );
            ultimaCol.querySelector(".contador-tareas").textContent =
              Number(ultimaCol.querySelector(".contador-tareas").textContent) +
              1;
          }
          cursorTarea.continue();
        }
      };
      cursorCol.continue();
    }
  };
}

// 4.

function añadirColumna(textoExistente = "") {
  const board = document.getElementById("board");
  const template = document.getElementById("template-columna").content;

  const clon = document.importNode(template, true);
  const columna = clon.querySelector(".columna");
  const header = clon.querySelector(".columna-header");
  const titulo = clon.querySelector(".columna-header input");
  const contenedorTareas = clon.querySelector(".contenedor-tareas");
  const btnTarea = clon.querySelector(".add-card-btn");

  // Si viene de la base de datos, le ponemos su título real
  titulo.value = textoExistente;

  titulo.addEventListener("change", guardarEstado);
  ContenedorDrop(contenedorTareas);
  crearBotonesAccion(header, titulo, columna);

  board.appendChild(clon);

  btnTarea.onclick = () => crearTarea(contenedorTareas, "");

  if (textoExistente === "") {
    guardarEstado();
  }
}

function crearTarea(contenedor, textoExistente = "", fechaGuardada = null, tipoGuardado = null) {
  const template = document.getElementById("template-tarea").content;
  const clon = document.importNode(template, true);

  const tarea = clon.querySelector(".tarea");
  const tareaTop = clon.querySelector(".tarea-top");
  const inputTarea = clon.querySelector("input");
  const fecha = clon.querySelector(".fecha");
  const selectTipo = clon.querySelector(".tipo-tarea");
  const contenedorEtiquetas = clon.querySelector(".etiquetas");

  // pintar etiqueta
  function pintarEtiqueta(tipo) {
    contenedorEtiquetas.innerHTML = "";
    const etiqueta = document.createElement("span");
    etiqueta.classList.add("etiqueta");

    if (tipo === "DESIGN") etiqueta.classList.add("design");
    if (tipo === "BUG") etiqueta.classList.add("bug");
    if (tipo === "URGENT") etiqueta.classList.add("urgent");

    etiqueta.textContent = tipo;

    contenedorEtiquetas.appendChild(etiqueta);
  }

  // Fecha
  if (fechaGuardada) {
    fecha.textContent = fechaGuardada;
  } else {
    const fechaActual = new Date();
    fecha.textContent = fechaActual.toLocaleDateString("es-ES");
  }

  // Texto
  inputTarea.value = textoExistente;
  inputTarea.addEventListener("change", guardarEstado);

  // TIPO
  if (tipoGuardado) {
    // tarea ya existente
    selectTipo.value = tipoGuardado;
    tarea.dataset.tipo = tipoGuardado;
    pintarEtiqueta(tipoGuardado);
    selectTipo.style.display = "none";
  } else {
    // si la tarea es nueva se muestra
    selectTipo.style.display = "block";
  }

  // cambiar tipo
  selectTipo.addEventListener("change", () => {
    const nuevoTipo = selectTipo.value;

    tarea.dataset.tipo = nuevoTipo;
    pintarEtiqueta(nuevoTipo);

    selectTipo.style.display = "none"; // se oculta después de elegir

    guardarEstado();
  });

  crearBotonesAccion(tareaTop, inputTarea, tarea);
  DragAndDrop(tarea);

  contenedor.appendChild(clon);

  // guardar solo si ya eligió tipo
  if (textoExistente === "" && tipoGuardado) {
    guardarEstado();
  }
}

function DragAndDrop(tarea) {
  tarea.setAttribute("draggable", "true");
  tarea.ondragstart = () => {
    tarea.classList.add("dragging");
    window.tareaArrastrada = tarea;
  };
  tarea.ondragend = () => {
    tarea.classList.remove("dragging");
    window.tareaArrastrada = null;
  };
}

function ContenedorDrop(contenedor) {
  contenedor.ondragover = (e) => {
    e.preventDefault();
    contenedor.classList.add("drag-over");
  };
  contenedor.ondragleave = () => contenedor.classList.remove("drag-over");
  contenedor.ondrop = () => {
    contenedor.classList.remove("drag-over");
    if (window.tareaArrastrada) {
      contenedor.appendChild(window.tareaArrastrada);
      guardarEstado();
    }
  };
}

function crearBotonesAccion(
  contenedorBotones,
  inputAEnfocar,
  elementoAEliminar,
) {
  const btnPuntos = contenedorBotones.querySelector(".btn-tres-puntos");
  const menu = contenedorBotones.querySelector(".menu-opciones");
  const btnEditar = menu.querySelector(".btnEditar");
  const btnEliminar = menu.querySelector(".btnEliminar");

  btnPuntos.onclick = (e) => {
    e.stopPropagation(); // 1. Que el clic no afecte

    // 2. Guarda si el menú ya estaba abierto antes de cerrar todos
    const estabaAbierto = menu.style.display === "block";

    // 3. Cierra todo los menús que existan en la página
    document
      .querySelectorAll(".menu-opciones")
      .forEach((m) => (m.style.display = "none"));

    // 4. Si no estaba abierto, aparece
    if (!estabaAbierto) {
      menu.style.display = "block";
    }
  };

  btnEditar.addEventListener("click", () => {
    inputAEnfocar.focus();
    menu.style.display = "none";
  });

  btnEliminar.addEventListener("click", function () {
    if (confirm("¿Eliminar este elemento?")) {
      elementoAEliminar.remove();
      guardarEstado();
    }
  });

  // Si haces clic fuera del menú, se cierra solo
  document.addEventListener("click", () => (menu.style.display = "none"));
}
