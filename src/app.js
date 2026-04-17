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
}

const headers = {
    'Content-Type': 'application/json',
    'x-frontend-token': FRONTEND_SECRET,
};

const renderizar = (container, html) => {
    container.innerHTML = html;
};

export const App = (elementId) => {
    (async () => {
        const container = document.querySelector(elementId);

        // ─── Pantalla de carga ────────────────────────────────
        const mostrarPantallaCarga = () => {
            const pantallaCarga = document.createElement('div');
            pantallaCarga.id = 'pantalla-carga';
            pantallaCarga.innerHTML = `<div class="loading-text">Cargando...</div>`;
            document.body.appendChild(pantallaCarga);
        };

        const ocultarPantallaCarga = () => {
            const el = document.getElementById('pantalla-carga');
            if (el) el.remove();
        };

        // ─── Botón admin — está en index.html, siempre disponible ─
        // Lo registramos UNA sola vez aquí arriba, no dentro de cada función
        document.getElementById('adminBonos').addEventListener('click', () => {
            renderizar(container, htmlLogin);
            iniciarLogin();
        });

        // ─── PASO 1: Mostrar formulario de búsqueda ───────────
        renderizar(container, htmlLoginEstudiante);
        iniciarBusquedaEstudiante();

        // ─── Lógica de búsqueda de estudiante ────────────────
       function iniciarBusquedaEstudiante() {
    const form = document.getElementById('registro-form2');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const codigoEstudiante = document.getElementById('codigo-estudiante').value.trim();
        if (!codigoEstudiante) return;

        mostrarPantallaCarga();

        try {
            // 1. ¿Existe el estudiante en la base de datos?
            const responseEstudiante = await fetch(`${BACKEND_URL}/estudiante/${codigoEstudiante}`, {
                headers: { 'x-frontend-token': FRONTEND_SECRET }
            });

            if (responseEstudiante.status === 404) {
                renderizar(container, htmlNoEncontrado);
                return;
            }

            if (!responseEstudiante.ok) throw new Error('Error del servidor');

            const { estudiante } = await responseEstudiante.json();

            // Guardar datos del estudiante en la variable global
            searchStuden.codigo = codigoEstudiante;
            searchStuden.documento_identidad = estudiante.documento_identidad;
            searchStuden.nombre = estudiante.nombre;
            searchStuden.email = estudiante.email;
            searchStuden.programa_academico = estudiante.programa_academico;

            // 2. ¿Ya tiene un bono registrado hoy?
            const responseRegistro = await fetch(`${BACKEND_URL}/estudiante/${codigoEstudiante}/registro`);
            const registroData = await responseRegistro.json();

            if (registroData.yaRegistrado) {
                renderizar(container, htmlBonoConsultado);
                document.getElementById('codigoEstudiante').innerText = 'Código: ' + searchStuden.codigo;
                document.getElementById('nombreEstudiante').innerText = searchStuden.nombre;
                document.getElementById('fechaRegistro').innerText = new Date().toLocaleString('es-CO');
                return;
            }

            // 3. ¿Hay bonos disponibles?
            const bonosResponse = await fetch(`${BACKEND_URL}/bonos/disponibles`);
            const bonosData = await bonosResponse.json();

            if (!bonosData.bonosDisponibles || bonosData.bonosDisponibles <= 0) {
                renderizar(container, htmlMensaje);
                return;
            }

            // 4. Todo bien — mostrar formulario con datos del estudiante
            renderizar(container, htmlFormulario);

            document.getElementById('fecha-hora').value = new Date().toLocaleString('es-CO');
            document.getElementById('codigo-estudiante').value = codigoEstudiante;
            document.getElementById('numero-identificacion').value = estudiante.documento_identidad;
            document.getElementById('nombre-estudiante').value = estudiante.nombre;
            document.getElementById('correo').value = estudiante.email;
            document.getElementById('programa-academico').value = estudiante.programa_academico;
            document.getElementById('recibo-conforme').value = 'SI';

            iniciarRegistro(codigoEstudiante);

        } catch (error) {
            console.error('Error al buscar estudiante:', error);
            renderizar(container, htmlNoEncontrado);
        } finally {
            ocultarPantallaCarga();
        }
    });
}
        // ─── Lógica de registro del bono ──────────────────────
        function iniciarRegistro(codigoEstudiante) {
            const form = document.getElementById('registro-form2');
            if (!form) return;

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                mostrarPantallaCarga();

                try {
                    const response = await fetch(`${BACKEND_URL}/bonos`, {
                        method: 'PUT',
                        headers: headers,
                        body: JSON.stringify({ codigoEstudiante }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        renderizar(container, htmlBonoRedimido);
                        document.getElementById('codigoEstudiante').innerText = 'Código:' + searchStuden.codigo;
                        document.getElementById('nombreEstudiante').innerText = searchStuden.nombre;
                        document.getElementById('fechaRegistro').innerText = new Date().toLocaleString('es-CO');                     

                    } else if (response.status === 400 && data.mensaje.includes('Ya registraste')) {
                        renderizar(container, htmlBonoConsultado);                        
                        document.getElementById('codigoEstudiante').innerText = 'Código:' + searchStuden.codigo;
                        document.getElementById('nombreEstudiante').innerText = searchStuden.nombre;
                        document.getElementById('fechaRegistro').innerText = new Date().toLocaleString('es-CO');
                       
                        
                    } else if (response.status === 400 && data.mensaje.includes('agotado')) {
                        renderizar(container, htmlMensaje);

                    } else {
                        // Cualquier otro error — volver al inicio
                        renderizar(container, htmlLoginEstudiante);
                        iniciarBusquedaEstudiante();
                    }

                } catch (error) {
                    console.error('Error al registrar:', error);
                    renderizar(container, htmlLoginEstudiante);
                    iniciarBusquedaEstudiante();
                } finally {
                    ocultarPantallaCarga();
                }
            });
        }

        // ─── Lógica de login admin ────────────────────────────
        function iniciarLogin() {
            const form = document.getElementById('login-form');
            if (!form) return;

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const usuario = document.getElementById('usuario').value;
                const password = document.getElementById('password').value;

                try {
                    const response = await fetch(`${BACKEND_URL}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ usuario, password }),
                    });

                    const data = await response.json();
                    if (data.exito) {
                        renderizar(container, htmlTablaRegistros);
                        iniciarCargaBonos();
                    } else {
                        alert('Credenciales incorrectas');
                    }
                } catch (error) {
                    console.error('Error en login:', error);
                }
            });
        }

        // ─── Lógica de carga de bonos admin ──────────────────
        function iniciarCargaBonos() {
            const form = document.getElementById('bonos-form');
            if (!form) return;

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const bonos = document.getElementById('bonos').value;

                try {
                    const response = await fetch(`${BACKEND_URL}/bonos/cargar`, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({ bonos }),
                    });

                    const data = await response.json();
                    if (response.ok) {
                        alert(`Bonos cargados correctamente: ${bonos}`);
                        location.reload();
                    } else {
                        alert(data.mensaje || 'Error al cargar los bonos');
                    }
                } catch (error) {
                    console.error('Error al cargar bonos:', error);
                }
            });
        }

    })();
};

// ─── Estilos pantalla de carga ────────────────────────────────
const style = document.createElement('style');
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