window.onload = function () {
  const board = document.getElementById("board");
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
      const titulo = columna.querySelector(".columna-header input").value.toUpperCase();

      // Si el filtro es "ALL" O el título coincid
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
    const tarea = document.createElement("div");
    tarea.classList.add("tarea");
    const tareaTop = document.createElement("div");
    tareaTop.classList.add("tarea-top");
    const inputTarea = document.createElement("input");
    inputTarea.placeholder = "Escribe la tarea...";

    inputTarea.addEventListener("change", guardarEstado);

    tareaTop.appendChild(inputTarea);
    tarea.appendChild(tareaTop);
    crearBotonesAccion(tareaTop, inputTarea, tarea);
    DragAndDrop(tarea);

    contenedor.appendChild(tarea);
    guardarEstado();
  });
}

function añadirColumna() {
  const board = document.getElementById("board");
  const columna = document.createElement("div");
  columna.classList.add("columna");

  const header = document.createElement("div");
  header.classList.add("columna-header");
  const titulo = document.createElement("input");
  titulo.placeholder = "Nueva Columna";
  titulo.addEventListener("change", guardarEstado);
  header.appendChild(titulo);

  const contenedorTareas = document.createElement("div");
  contenedorTareas.classList.add("contenedor-tareas");
  ContenedorDrop(contenedorTareas);

  const btnTarea = document.createElement("button");
  btnTarea.textContent = "+ Add Card";
  btnTarea.classList.add("add-card-btn");

  columna.appendChild(header);
  columna.appendChild(contenedorTareas);
  columna.appendChild(btnTarea);

  crearBotonesAccion(header, titulo, columna);
  board.appendChild(columna);

  crearTarea(btnTarea, contenedorTareas);
  guardarEstado();
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
    const columna = document.createElement("div");
    columna.classList.add("columna");

    const header = document.createElement("div");
    header.classList.add("columna-header");
    const titulo = document.createElement("input");
    titulo.value = dataCol.titulo;
    titulo.addEventListener("change", guardarEstado);
    header.appendChild(titulo);

    const contenedorTareas = document.createElement("div");
    contenedorTareas.classList.add("contenedor-tareas");
    ContenedorDrop(contenedorTareas);

    const btnTarea = document.createElement("button");
    btnTarea.textContent = "+ Add Card";
    btnTarea.classList.add("add-card-btn");

    columna.appendChild(header);
    columna.appendChild(contenedorTareas);
    columna.appendChild(btnTarea);

    crearBotonesAccion(header, titulo, columna);
    board.appendChild(columna);

    dataCol.tareas.forEach((dataTarea) => {
      const tarea = document.createElement("div");
      tarea.classList.add("tarea");
      const tareaTop = document.createElement("div");
      tareaTop.classList.add("tarea-top");
      const inputTarea = document.createElement("input");
      inputTarea.value = dataTarea;
      inputTarea.addEventListener("change", guardarEstado);
      tareaTop.appendChild(inputTarea);
      tarea.appendChild(tareaTop);
      crearBotonesAccion(tareaTop, inputTarea, tarea);
      DragAndDrop(tarea);
      contenedorTareas.appendChild(tarea);
    });

    crearTarea(btnTarea, contenedorTareas);
  });
}
