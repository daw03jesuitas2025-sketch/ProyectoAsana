window.onload = function () {
  // 1. DOM
  const controles = document.getElementById("Asana-Controls");
  const btnColumna = document.getElementById("btnColumna");
  const btnFiltrar = document.getElementById("btnFiltrar");
  const btnOrdenar = document.getElementById("btnOrdenar");
  const btnBuscar = document.getElementById("btnBuscar");
  const board = document.getElementById("Asana-Board");

  // Botón de editar y eliminar
  function acciones(elemento) {
    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.classList.add("button");
    elemento.appendChild(btnEditar);

    btnEditar.addEventListener("click", function () {
      const inputLocal = elemento.querySelector(".input");
      if (inputLocal) {
        inputLocal.focus();
      }
    });

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.classList.add("button");
    elemento.appendChild(btnEliminar);

    btnEliminar.addEventListener("click", function () {
      const respuesta = confirm("¿Estás seguro que quieres eliminarlo?");
      if (respuesta) {
        elemento.remove();
        alert("Eliminado correctamente");
      }
    });
  }

  // 2. Crear columna y tarea
  // btnColumna.addEventListener("click", function (event) {
  //   columna = document.createElement("div");
  //   columna.classList.add("columna");

  //   botones = document.createElement("div");
  //   botones.classList.add("botones");

  //   btnTarea = document.createElement("button");
  //   btnTarea.textContent = "Añadir tarea";
  //   btnTarea.classList.add("button");

  //   input = document.createElement("input");
  //   input.type = "text";
  //   input.placeholder = "Escribe el título";
  //   input.classList.add("input");

  //   board.appendChild(columna);
  //   columna.appendChild(botones);
  //   botones.appendChild(btnTarea);
  //   acciones(botones);
  //   columna.appendChild(input);
  //   input.focus(); // ?????

  //   // 3. Crear tarea dentro de la columna

  //   btnTarea.addEventListener("click", function (event) {
  //     const target = event.currentTarget;
  //     const columnaActual = target.parentElement;

  //     const tarea = document.createElement("div");
  //     tarea.classList.add("tarea");

  //   columnaActual.appendChild(tarea);

  //     const input = document.createElement("input");
  //     input.type = "text";
  //     input.placeholder = "Escribe la tarea";
  //     input.classList.add("input");

  //     columna.appendChild(tarea);
  //     tarea.appendChild(input);
  //     tarea.focus();
  //     acciones(tarea);

  //     // check cuando la tarea esté finalizada

  //     const inputCheck = document.createElement("input");
  //     inputCheck.type = "checkbox";
  //     const mensaje = document.createElement("span");
  //     mensaje.textContent = "Tarea finalizada";

  //     // inputCheck.classList.add("input");
  //     tarea.appendChild(inputCheck);

  //     inputCheck.addEventListener("change", function () {
  //       if (inputCheck.checked) {
  //         mensaje.style.display = "block";
  //         mensaje.style.color = "green";
  //       } else {
  //         mensaje.style.display = "none";
  //       }
  //       tarea.appendChild(mensaje);
  //     });
  //   });
  // });

  // 2. Crear columna
  btnColumna.addEventListener("click", function (event) {
    const columna = document.createElement("div");
    columna.classList.add("columna");

    const botonesColumna = document.createElement("div");
    botonesColumna.classList.add("botones");

    const btnTarea = document.createElement("button");
    btnTarea.textContent = "Añadir tarea";
    btnTarea.classList.add("button");

    const inputColumna = document.createElement("input");
    inputColumna.type = "text";
    inputColumna.placeholder = "Escribe el nombre de la columna";
    inputColumna.classList.add("input");

    board.appendChild(columna);
    columna.appendChild(botonesColumna);
    botonesColumna.appendChild(btnTarea);

    // El botón de editar/eliminar de esta columna
    acciones(columna);

    columna.appendChild(inputColumna);
    inputColumna.focus();

    // 3. Crear tarea dentro de esta columna
    btnTarea.addEventListener("click", function (event) {
      const tarea = document.createElement("div");
      tarea.classList.add("tarea");

      const inputTarea = document.createElement("input");
      inputTarea.type = "text";
      inputTarea.placeholder = "Escribe el título de la tarea";
      inputTarea.classList.add("input");

      columna.appendChild(tarea);
      tarea.appendChild(inputTarea);

      // El botón de editar/eliminar de la tarea
      acciones(tarea);
      inputTarea.focus();

      // Checkbox finalizada
      const inputCheck = document.createElement("input");
      inputCheck.type = "checkbox";
      const mensaje = document.createElement("span");

      tarea.appendChild(inputCheck);
      tarea.appendChild(mensaje);

      inputCheck.addEventListener("change", function () {
        if (inputCheck.checked) {
          mensaje.textContent = "Tarea finalizada";
          mensaje.style.display = "block";
          mensaje.style.color = "green";
        } else {
          mensaje.style.display = "none";
        }
        tarea.appendChild(mensaje);
      });
    });
  });
// LocalStorage
  function guardarDatos(){
    let guardarTableto = [];
  }

  // Botón Buscar

  btnBuscar.addEventListener('click', function(){

  })

  // Botón Filtrar

btnFiltrar.addEventListener('click', function(){

})

  // Botón Ordenar

  btnOrdenar.addEventListener('click', function(){
    
  })

};
