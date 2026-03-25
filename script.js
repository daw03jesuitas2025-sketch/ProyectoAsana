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
      "CREATE TABLE IF NOT EXISTS tareas_sql (texto TEXT, nombre_columna TEXT)",
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

  // Filtro de columnas
  columnFilter.addEventListener("change", function () {
    const filtro = columnFilter.value.toUpperCase();
    const columnas = document.querySelectorAll(".columna");

    columnas.forEach((columna) => {
      const titulo = columna
        .querySelector(".columna-header input")
        .value.toUpperCase();
      if (filtro === "ALL" || titulo === filtro) {
        columna.style.display = "flex";
      } else {
        columna.style.display = "none";
      }
    });
  });

  inicializarBasesDeDatos();
};

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
      col.querySelectorAll(".tarea input").forEach((t) => {
        const textoTarea = t.value;
        storeTareas.add({
          texto: textoTarea,
          idRelacionColumna: idColumnaGenerado,
        });
        db_sql.exec({
          sql: "INSERT INTO tareas_sql (texto, nombre_columna) VALUES (?, ?)",
          bind: [textoTarea, titulo],
        });
      });
      // contar tareas
      const contarTareas = db_sql.exec({
        sql: "SELECT COUNT(*) FROM tareas_sql WHERE nombre_columna = ?",
        bind: [titulo],
        returnValue: "resultRows",
      });
      if (contador && contarTareas[0]) {
        contador.textContent = contarTareas[0][0];
      }
    };
  });
}

function cargarEstado() {
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
      // TO DO: refactorizar codigo
      const todasLasCols = document.querySelectorAll(".columna");
      const ultimaCol = todasLasCols[todasLasCols.length - 1];
      const contenedorTareas = ultimaCol.querySelector(".contenedor-tareas");

      storeTareas.openCursor().onsuccess = (e) => {
        const cursorTarea = e.target.result;
        if (cursorTarea) {
          if (cursorTarea.value.idRelacionColumna === colData.idColumna) {
            crearTarea(contenedorTareas, cursorTarea.value.texto);

            db_sql.exec({
              sql: "INSERT INTO tareas_sql (texto, nombre_columna) VALUES (?, ?)",
              bind: [cursorTarea.value.texto, colData.titulo],
            });
          }
          cursorTarea.continue();
        } else {
          // Cuando el cursor de tareas termina (null), pedimos el conteo a SQLite
          const resContar = db_sql.exec({
            sql: "SELECT COUNT(*) FROM tareas_sql WHERE nombre_columna = ?",
            bind: [colData.titulo],
            returnValue: "resultRows",
          });
          ultimaCol.querySelector(".contador-tareas").textContent =
            resContar[0][0];
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

function crearTarea(contenedor, textoExistente = "") {
  const template = document.getElementById("template-tarea").content;
  const clon = document.importNode(template, true);
  const tarea = clon.querySelector(".tarea");
  const tareaTop = clon.querySelector(".tarea-top");
  const inputTarea = clon.querySelector("input");

  // Si hay texto, lo ponemos. Si no, queda vacío.
  inputTarea.value = textoExistente;
  inputTarea.addEventListener("change", guardarEstado);

  crearBotonesAccion(tareaTop, inputTarea, tarea);
  DragAndDrop(tarea);

  contenedor.appendChild(clon);

  if (textoExistente === "") {
    guardarEstado();
  }
}

// function contarTareas() {
//   const columnas = document.querySelectorAll(".columna");
//   columnas.forEach((columna) => {
//     const contador = columna.querySelector(".contador-tareas");
//     const numTareas = columna.querySelectorAll(".tarea").length;
//     contador.textContent = numTareas;
//   });
// }

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
  const btnEditar = document.createElement("button");
  btnEditar.textContent = "✎";
  btnEditar.classList.add("btn-accion");
  contenedorBotones.appendChild(btnEditar);
  btnEditar.addEventListener("click", () => inputAEnfocar.focus());

  const btnEliminar = document.createElement("button");
  btnEliminar.textContent = "✕";
  btnEliminar.classList.add("btn-accion");
  contenedorBotones.appendChild(btnEliminar);

  btnEliminar.addEventListener("click", function () {
    if (confirm("¿Eliminar este elemento?")) {
      elementoAEliminar.remove();
      guardarEstado();
    }
  });
}
