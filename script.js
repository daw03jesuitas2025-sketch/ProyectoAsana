window.onload = function () {
  const addColumn = document.getElementById("addColumn");
  const searchInput = document.getElementById("searchInput");
  const columnFilter = document.getElementById("columnFilter");

  addColumn.onclick = function () {
    añadirColumna();
  };

  searchInput.addEventListener("input", function () {
    const texto = searchInput.value.toLowerCase();
    document.querySelectorAll(".tarea").forEach((tarea) => {
      const input = tarea.querySelector("input");
      const contenido = input.value.toLowerCase();
      tarea.style.display = contenido.includes(texto) ? "block" : "none";
    });
  });

  // Evento filtro

  columnFilter.addEventListener("change", function () {
    const filtro = columnFilter.value.toUpperCase();
    const columnas = document.querySelectorAll(".columna");

    columnas.forEach(function (columna) {
      const titulo = columna
        .querySelector(".columna-header input")
        .value.toUpperCase();

      // Si el filtro es "ALL" O el título coincide
      if (filtro === "ALL" || titulo === filtro) {
        columna.style.display = "flex";
      } else {
        columna.style.display = "none";
      }
    });
  });

  // Cargar el estado al iniciar
  cargarEstado();
};


// INDEXDDB

const indexdDB = window.indexedDB;
let db;
const conexion = indexdDB.open("kanban_data", 1);

conexion.onsuccess = () => {
  db = conexion.result;
  console.log('Base de datos abierta', 1);
  cargarEstado();
}

conexion.onupgradeneeded = (e) =>{
  db = e.target.result;
  console.log('Base de datos creada', db);
  const columnasStore = db.createObjectStore('columnas', {
    keyPath: 'idColumna', autoIncrement: true
  })
  const tareasStore = db.createObjectStore('tareas', {
    keyPath : 'id', autoIncrement: true
  })
}

conexion.onerror = (error) => {
  console.log('Eror: ', error);
}


// Drag and Drop

let tareaArrastrada = null;

function DragAndDrop(tarea) {
  tarea.setAttribute("draggable", "true");
  tarea.addEventListener("dragstart", () => {
    tareaArrastrada = tarea;
    tarea.classList.add("dragging");
  });
  tarea.addEventListener("dragend", () => {
    tarea.classList.remove("dragging");
    tareaArrastrada = null;
  });
}

function ContenedorDrop(contenedor) {
  // dragover cuando la tarea se arrastra sobre el contenedor
  contenedor.addEventListener("dragover", (e) => {
    e.preventDefault();
    contenedor.classList.add("drag-over");
  });
  // dragleave cuando la tarea la quito del contenedor
  contenedor.addEventListener("dragleave", () => {
    contenedor.classList.remove("drag-over");
  });
  // cuando la suelto
  contenedor.addEventListener("drop", () => {
    contenedor.classList.remove("drag-over");
    if (tareaArrastrada) {
      contenedor.appendChild(tareaArrastrada);
      guardarEstado();
    }
  });
}

// botones de editar y eliminar

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

function crearTarea(boton, contenedor) {
  boton.addEventListener("click", function () {
    const template = document.getElementById("template-tarea").content;
    const clon = document.importNode(template, true);
    const tarea = clon.querySelector(".tarea");
    const tareaTop = clon.querySelector(".tarea-top");
    const inputTarea = clon.querySelector("input");

    inputTarea.addEventListener("change", guardarEstado);

    crearBotonesAccion(tareaTop, inputTarea, tarea);
    DragAndDrop(tarea);

    contenedor.appendChild(clon);
    guardarEstado();
  });
}

function añadirColumna() {
  const board = document.getElementById("board");
  const template = document.getElementById("template-columna").content;

  // clonar el template
  const clon = document.importNode(template, true);

  const columna = clon.querySelector(".columna");
  const header = clon.querySelector(".columna-header");
  const titulo = clon.querySelector(".columna-header input");
  const contenedorTareas = clon.querySelector(".contenedor-tareas");
  const btnTarea = clon.querySelector(".add-card-btn");

  titulo.addEventListener("change", guardarEstado);
  ContenedorDrop(contenedorTareas);

  crearBotonesAccion(header, titulo, columna);

  board.appendChild(clon);

  crearTarea(btnTarea, contenedorTareas);

  contarTareas();
  guardarEstado();
}

// Contador tareas
function contarTareas() {
  // foreach para recorrer las tareas de cada columna y guardar los datos si añades o eliminas tareas
  const columnas = document.querySelectorAll(".columna");

  columnas.forEach((columna) => {
    const contador = columna.querySelector(".contador-tareas");
    const numTareas = columna.querySelectorAll(".tarea").length;
    contador.textContent = numTareas;
  });
}

/* LOCAL STORAGE */

function guardarEstado() {
  const columnas = [];
  document.querySelectorAll(".columna").forEach((col) => {
    const inputTitulo = col.querySelector(".columna-header input");
    const titulo = inputTitulo ? inputTitulo.value : "";
    const tareas = [];
    col.querySelectorAll(".tarea input").forEach((t) => tareas.push(t.value));
    columnas.push({ titulo, tareas });
    const contador = col.querySelector(".contador-tareas");
    contador.textContent = tareas.length;
  });
  // convertir en texto json
  localStorage.setItem("kanban_data", JSON.stringify(columnas));
}

function cargarEstado() {
  const board = document.getElementById("board");
  const datosRaw = localStorage.getItem("kanban_data");
  if (!datosRaw) return;
  // convertir de texto a objeto
  const datos = JSON.parse(datosRaw);
  board.innerHTML = "";

  datos.forEach((dataCol) => {
    const tempCol = document.getElementById("template-columna").content;
    const clonCol = document.importNode(tempCol, true);
    const columna = clonCol.querySelector(".columna");
    const header = clonCol.querySelector(".columna-header");
    const tituloInput = clonCol.querySelector(".columna-header input");
    const contador = clonCol.querySelector(".contador-tareas");
    const contenedorTareas = clonCol.querySelector(".contenedor-tareas");
    const btnTarea = clonCol.querySelector(".add-card-btn");

    tituloInput.value = dataCol.titulo;
    contador.textContent = dataCol.tareas.length;

    tituloInput.addEventListener("change", guardarEstado);
    ContenedorDrop(contenedorTareas);
    crearBotonesAccion(header, tituloInput, columna);
    crearTarea(btnTarea, contenedorTareas);

    dataCol.tareas.forEach((textoTarea) => {
      const tempTarea = document.getElementById("template-tarea").content;
      const clonTarea = document.importNode(tempTarea, true);
      const tareaDiv = clonTarea.querySelector(".tarea");
      const tareaTop = clonTarea.querySelector(".tarea-top");
      const inputTarea = clonTarea.querySelector("input");
      inputTarea.value = textoTarea;

      inputTarea.addEventListener("change", guardarEstado);
      crearBotonesAccion(tareaTop, inputTarea, tareaDiv);
      DragAndDrop(tareaDiv);
      contenedorTareas.appendChild(clonTarea);
    });
    board.appendChild(clonCol);
  });
}
