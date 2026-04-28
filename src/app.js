import htmlFormulario from "./formularioHTML.html?raw";
import htmlMensaje from "./mensajeHTML.html?raw";
import htmlLogin from "./loginHTML.html?raw";
import htmlBonos from "./actuaBonosHTML.html?raw";
import htmlLoginEstudiante from "./loginEstudiante.html?raw";
import htmlBonoRedimido from "./bonoRedimido.html?raw";
import htmlBonoConsultado from "./bonoConsultado.html?raw";
import htmlNoEncontrado from "./noEncontrado.html?raw";
import htmlTablaRegistros from "./tablaRegistros.html?raw";

// ─── Variables de entorno ─────────────────────────────────────
const BACKEND_URL = import.meta.env.VITE_URL_APP_SERVER;
const FRONTEND_SECRET = import.meta.env.VITE_FRONTEND_KEY_APP;
const searchStuden = {
  codigo: "",
  documento_identidad: "",
  nombre: "",
  programa_academico: "",
  email: "",
};

const headers = {
  "Content-Type": "application/json",
  "x-frontend-token": FRONTEND_SECRET,
};

const renderizar = (container, html) => {
  container.innerHTML = html;
};

export const App = (elementId) => {
  (async () => {
    const container = document.querySelector(elementId);

    // ─── Pantalla de carga ────────────────────────────────
    const mostrarPantallaCarga = () => {
      const pantallaCarga = document.createElement("div");
      pantallaCarga.id = "pantalla-carga";
      pantallaCarga.innerHTML = `<div class="loading-text">Cargando...</div>`;
      document.body.appendChild(pantallaCarga);
    };

    const ocultarPantallaCarga = () => {
      const el = document.getElementById("pantalla-carga");
      if (el) el.remove();
    };

    // ─── Botón admin — está en index.html, siempre disponible ─
    // Lo registramos UNA sola vez aquí arriba, no dentro de cada función
    document.getElementById("adminBonos").addEventListener("click", () => {
      renderizar(container, htmlLogin);
      iniciarLogin();
    });

    // ─── PASO 1: Mostrar formulario de búsqueda ───────────
    renderizar(container, htmlLoginEstudiante);
    iniciarBusquedaEstudiante();

    function renderHomePage() {
      document.getElementById("homePage").addEventListener("click", () => {
        renderizar(container, htmlLoginEstudiante);
        iniciarBusquedaEstudiante();
      });
    }
    // Ocultar código en el frontend igual que el backend
    // 202570107 → 2025***07
    const ocultarCodigoFront = (codigo) => {
      const str = String(codigo);
      const inicio = str.slice(0, 4);
      const final = str.slice(-2);
      return `${inicio}***${final}`;
    };
    // ─── Lógica de búsqueda de estudiante ────────────────
    function iniciarBusquedaEstudiante() {
      const form = document.getElementById("registro-form2");
      if (!form) return;

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const codigoEstudiante = document
          .getElementById("codigo-estudiante")
          .value.trim();
        if (!codigoEstudiante) return;

        mostrarPantallaCarga();

        try {
          // 1. ¿Existe el estudiante en la base de datos?
          const responseEstudiante = await fetch(
            `${BACKEND_URL}/estudiante/${codigoEstudiante}`,
            { headers: { "x-frontend-token": FRONTEND_SECRET } },
          );

          if (responseEstudiante.status === 404) {
            renderizar(container, htmlNoEncontrado);
            renderHomePage();
            return;
          }

          if (!responseEstudiante.ok) throw new Error("Error del servidor");

          const { estudiante } = await responseEstudiante.json();

          // Guardar datos en variable global
          // ⚠️ El código real lo guardamos desde el input, NO desde estudiante.codigo
          // porque estudiante.codigo viene ocultado (2025***07)
          searchStuden.codigo = codigoEstudiante;
          searchStuden.documento_identidad = estudiante.documento_identidad;
          searchStuden.nombre = estudiante.nombre;
          searchStuden.email = estudiante.email;
          searchStuden.programa_academico = estudiante.programa_academico;

          // 2. ¿Ya tiene un bono registrado hoy?
          // ✅ Ahora con token
          const responseRegistro = await fetch(
            `${BACKEND_URL}/estudiante/${codigoEstudiante}/registro`,
            { headers: { "x-frontend-token": FRONTEND_SECRET } },
          );
          const registroData = await responseRegistro.json();

          if (registroData.yaRegistrado) {
            renderizar(container, htmlBonoConsultado);
            document.getElementById("codigoEstudiante").innerText =
              "Código: " + ocultarCodigoFront(codigoEstudiante);
            document.getElementById("nombreEstudiante").innerText =
              searchStuden.nombre;
            document.getElementById("fechaRegistro").innerText =
              new Date().toLocaleString("es-CO");
            renderHomePage();
            return;
          }

          // 3. ¿Hay bonos disponibles?
          const bonosResponse = await fetch(`${BACKEND_URL}/bonos/disponibles`);
          const bonosData = await bonosResponse.json();

          if (!bonosData.bonosDisponibles || bonosData.bonosDisponibles <= 0) {
            renderizar(container, htmlMensaje);
            renderHomePage();
            return;
          }

          // 4. Todo bien — mostrar formulario con datos del estudiante
          renderizar(container, htmlFormulario);

          document.getElementById("fecha-hora").value =
            new Date().toLocaleString("es-CO");

          // ✅ Mostramos datos ocultados en pantalla
          // pero el código real se guarda en searchStuden para el registro
          document.getElementById("codigo-estudiante").value =
            estudiante.codigo; // viene ocultado del backend, solo para mostrar
          document.getElementById("numero-identificacion").value =
            estudiante.documento_identidad;
          document.getElementById("nombre-estudiante").value =
            estudiante.nombre;
          document.getElementById("correo").value = estudiante.email;
          document.getElementById("programa-academico").value =
            estudiante.programa_academico;
          document.getElementById("recibo-conforme").value = "SI";

          // ✅ Pasamos el código REAL, no el ocultado
          iniciarRegistro(codigoEstudiante);
        } catch (error) {
          console.error("Error al buscar estudiante:", error);
          renderizar(container, htmlNoEncontrado);
        } finally {
          ocultarPantallaCarga();
        }
      });
    }
    // ─── Lógica de registro del bono ──────────────────────
    function iniciarRegistro(codigoEstudiante) {
      const form = document.getElementById("registro-form2");
      if (!form) return;

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        mostrarPantallaCarga();

        try {
          const response = await fetch(`${BACKEND_URL}/bonos`, {
            method: "PUT",
            headers: headers,
            body: JSON.stringify({ codigoEstudiante }),
          });

          const data = await response.json();

          if (response.ok) {
            renderizar(container, htmlBonoRedimido);
            searchStuden.codigo = "20*****";
            document.getElementById("codigoEstudiante").innerText =
              "Código:" + searchStuden.codigo;
            document.getElementById("nombreEstudiante").innerText =
              searchStuden.nombre;
            document.getElementById("fechaRegistro").innerText =
              new Date().toLocaleString("es-CO");
            renderHomePage();
          } else if (
            response.status === 400 &&
            data.mensaje.includes("Ya registraste")
          ) {
            renderizar(container, htmlBonoConsultado);
            searchStuden.codigo = "20*****";
            document.getElementById("codigoEstudiante").innerText =
              "Código:" + searchStuden.codigo;
            document.getElementById("nombreEstudiante").innerText =
              searchStuden.nombre;
            document.getElementById("fechaRegistro").innerText =
              new Date().toLocaleString("es-CO");
            renderHomePage();
          } else if (
            response.status === 400 &&
            data.mensaje.includes("agotado")
          ) {
            renderizar(container, htmlMensaje);
            renderHomePage();
          } else {
            // Cualquier otro error — volver al inicio
            renderizar(container, htmlLoginEstudiante);
            iniciarBusquedaEstudiante();
          }
        } catch (error) {
          console.error("Error al registrar:", error);
          renderizar(container, htmlLoginEstudiante);
          iniciarBusquedaEstudiante();
        } finally {
          ocultarPantallaCarga();
        }
      });
    }

    // ─── Lógica de login admin ────────────────────────────────
    function iniciarLogin() {
      document
        .getElementById("togglePassword")
        .addEventListener("click", () => {
          const input = document.getElementById("password");
          const ojoAbierto = document.getElementById("ojoAbierto");
          const ojoCerrado = document.getElementById("ojoCerrado");

          // Alternar entre type="password" y type="text"
          if (input.type === "password") {
            input.type = "text";
            ojoAbierto.classList.remove("hidden");
            ojoAbierto.classList.add("block");

            ojoCerrado.classList.remove("block");
            ojoCerrado.classList.add("hidden");
          } else {
            input.type = "password";
            ojoAbierto.classList.remove("block");
            ojoAbierto.classList.add("hidden");

            ojoCerrado.classList.remove("hidden");
            ojoCerrado.classList.add("block");
          }
        });

      const form = document.getElementById("login-form");
      if (!form) return;

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const usuario = document.getElementById("usuario").value;
        const password = document.getElementById("password").value;

        try {
          const response = await fetch(`${BACKEND_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario, password }),
          });

          const data = await response.json();
          if (data.exito) {
            renderizar(container, htmlTablaRegistros);
            iniciarTablaRegistros(); // ← cambiado
          } else {
            alert("Credenciales incorrectas");
          }
        } catch (error) {
          console.error("Error en login:", error);
        }
      });
    }

    //Problema de seguridad
    async function mostrarBonosEnPanel() {
      const bonosResponse = await fetch(`${BACKEND_URL}/bonos/disponibles`);
      const bonosData = await bonosResponse.json();
      document.getElementById("cantidadBonosDisponibles").innerText =
        bonosData.bonosDisponibles ?? 0;
    }

    // ─── Lógica de la tabla de registros admin ────────────────
    async function iniciarTablaRegistros() {
      // Al entrar, cargar la tabla automáticamente
      await cargarTabla();

      mostrarBonosEnPanel();

      // ─── Botón refrescar tabla ────────────────────────────
      document
        .getElementById("refrescarTabla")
        .addEventListener("click", async () => {
          await cargarTabla();
          mostrarBonosEnPanel();
        });

      // ─── Botón buscar por código ──────────────────────────
      document
        .getElementById("buscarEnTabla")
        .addEventListener("click", async () => {
          const codigo = document.getElementById("codigoEnTabla").value.trim();
          if (!codigo) {
            await cargarTabla(); // Si está vacío, mostrar todos
            return;
          }

          mostrarPantallaCarga();
          try {
            // Busca directo en el backend por si acaba de registrar
            // y aún no se refrescó la tabla
            const response = await fetch(
              `${BACKEND_URL}/estudiante/${codigo}/registro`,
              { headers },
            );
            const data = await response.json();

            // ✅ Después
            const campoCodigo = document.getElementById("campoCodigo");

            if (!data.yaRegistrado) {
              renderizarFilas([]);
              if (campoCodigo)
                campoCodigo.innerText = `Sin resultados para: ${codigo}`;
            } else {
              renderizarFilas([data.registro]);
              if (campoCodigo)
                campoCodigo.innerText = `Resultado para: ${codigo}`;
            }
          } catch (error) {
            console.error("Error al buscar en tabla:", error);
          } finally {
            ocultarPantallaCarga();
          }
        });

      // ─── Botón ir a cargar bonos ──────────────────────────
      document
        .getElementById("pageCargaBonos")
        .addEventListener("click", () => {
          renderizar(container, htmlBonos);
          iniciarCargaBonos();
        });
    }

    // ─── Función auxiliar: cargar todos los registros del día ─
    async function cargarTabla() {
      mostrarPantallaCarga();
      try {
        // Cargar registros
        const response = await fetch(`${BACKEND_URL}/registros/hoy`, {
          headers,
        });
        const data = await response.json();
        renderizarFilas(data.registros || []);
        const campoCodigo = document.getElementById("campoCodigo");
        if (campoCodigo)
          campoCodigo.innerText = `Buscar: (${data.total} registros hoy)`;

        // Mostrar bonos disponibles en el label
      } catch (error) {
        console.error("Error al cargar tabla:", error);
      } finally {
        ocultarPantallaCarga();
      }
    }

    // ─── Función auxiliar: renderizar filas en la tabla ──────
    // Recibe un array de registros y los convierte en filas HTML
    function renderizarFilas(registros) {
      const tbody = document.querySelector("tbody");
      if (!tbody) return;

      if (registros.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    No hay registros para mostrar
                </td>
            </tr>`;
        return;
      }

      tbody.innerHTML = registros
        .map(
          (r, index) => `
        <tr data-codigo="${r.codigo}">
            <td class='border-[0.5px] border-gray-200 text-center'>${index + 1}</td>
            <td class='border-[0.5px] border-gray-200'>${r.fechaHora}</td>
            <td class='border-[0.5px] border-gray-200'>${r.codigo}</td>
            <td class='border-[0.5px] border-gray-200'>${r.nombre}</td>
            <td class='border-[0.5px] border-gray-200'>${r.programa}</td>
            <td class='border-[0.5px] border-gray-200 text-center'>
                ${
                  r.sincronizado
                    ? `<span class="font-bold">${r.codBono}</span>`
                    : `<input type="number" placeholder="N° bono" class="input input-bordered input-sm w-32 inputBono">`
                }
            </td>
            <td class='border-[0.5px] border-gray-200'>
                <span class="${r.sincronizado ? "text-green-600" : "text-red-500"} font-bold">
                    ${r.sincronizado ? "✓ Sincronizado" : "⏳ Pendiente"}
                </span>
            </td>
            <td class='border-[0.5px] border-gray-200 text-center'>
                ${
                  r.sincronizado
                    ? `<span class="text-green-600">✓</span>`
                    : `<button class="btn btn-sm btnEnviar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M10 14l11 -11"/>
                                <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"/>
                            </svg>
                       </button>`
                }
            </td>
        </tr>
    `,
        )
        .join("");

      // Agregar eventos a todos los botones de enviar
      document.querySelectorAll(".btnEnviar").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const fila = btn.closest("tr");
          const codigo = fila.dataset.codigo;
          const inputBono = fila.querySelector(".inputBono");
          const codBono = inputBono ? inputBono.value.trim() : "";

          // Validar que el campo no esté vacío
          if (!codBono) {
            alert("Debes ingresar el número de bono antes de enviar");
            inputBono.focus();
            return;
          }

          // Deshabilitar botón mientras procesa
          btn.disabled = true;
          btn.innerHTML = "...";

          try {
            const response = await fetch(`${BACKEND_URL}/registros/enviar`, {
              method: "POST",
              headers,
              body: JSON.stringify({ codigo, codBono: Number(codBono) }),
            });

            const data = await response.json();

            if (response.ok) {
              // Actualizar solo esa fila sin recargar toda la tabla
              const tdBono = fila.children[5];
              const tdEstado = fila.children[6];
              const tdAccion = fila.children[7];

              tdBono.innerHTML = `<span class="font-bold">${codBono}</span>`;
              tdEstado.innerHTML = `<span class="text-green-600 font-bold">✓ Sincronizado</span>`;
              tdAccion.innerHTML = `<span class="text-green-600">✓</span>`;
            } else {
              alert(data.mensaje || "Error al enviar");
              // Restaurar botón para reintentar
              btn.disabled = false;
              btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M10 14l11 -11"/>
                        <path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5"/>
                    </svg>`;
            }
          } catch (error) {
            console.error("Error al enviar registro:", error);
            alert("Error de conexión, intenta de nuevo");
            btn.disabled = false;
          }
        });
      });
    }

    // ─── Lógica de carga de bonos admin ──────────────────────
    function iniciarCargaBonos() {
      const form = document.getElementById("bonos-form");
      if (!form) return;

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const bonos = document.getElementById("bonos").value;

        try {
          const response = await fetch(`${BACKEND_URL}/bonos/cargar`, {
            method: "POST",
            headers,
            body: JSON.stringify({ bonos }),
          });

          const data = await response.json();
          if (response.ok) {
            alert(`Bonos cargados correctamente: ${bonos}`);
            // Volver a la tabla después de cargar bonos
            renderizar(container, htmlTablaRegistros);
            iniciarTablaRegistros();
          } else {
            alert(data.mensaje || "Error al cargar los bonos");
          }
        } catch (error) {
          console.error("Error al cargar bonos:", error);
        }
      });
    }
  })();
};

// ─── Estilos pantalla de carga ────────────────────────────────
const style = document.createElement("style");
style.innerHTML = `
  #pantalla-carga {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }
  .loading-text {
    color: white;
    font-size: 24px;
    font-weight: bold;
  }
`;
document.head.appendChild(style);
