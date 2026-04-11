import htmlForm from "./formularioHTML.html?raw";
import htmlMensaje from "./mensajeHTML.html?raw";
import htmlLogin from "./loginHTML.html?raw";
import htmlBonos from "./actuaBonosHTML.html?raw"

// ─── Variables de entorno ─────────────────────────────────────
const BACKEND_URL = import.meta.env.URL_APP_SERVER;
const FRONTEND_SECRET = import.meta.env.FRONTEND_KEY_APP;

// ─── Headers base para todas las peticiones ───────────────────
// En lugar de escribir los headers en cada fetch, los tenemos aquí
const headers = {
    'Content-Type': 'application/json',
    'x-frontend-token': FRONTEND_SECRET,
};

export const App = (elementId) => {
    (async () => {
        const container = document.querySelector(elementId);

        const mostrarPantallaCarga = () => {
            const pantallaCarga = document.createElement('div');
            pantallaCarga.id = 'pantalla-carga';
            pantallaCarga.innerHTML = `<div class="loading-text">Cargando...</div>`;
            document.body.appendChild(pantallaCarga);
        };

        const ocultarPantallaCarga = () => {
            const pantallaCarga = document.getElementById('pantalla-carga');
            if (pantallaCarga) pantallaCarga.remove();
        };

        try {
            // GET /bonos/disponibles no necesita token (es pública)
            const bonosResponse = await fetch(`${BACKEND_URL}/bonos/disponibles`);
            if (!bonosResponse.ok) throw new Error('Error al obtener los bonos disponibles');
            const bonosData = await bonosResponse.json();

            if (bonosData.bonosDisponibles > 0) {
                const app = document.createElement('div');
                app.innerHTML = htmlForm;
                container.append(app);
                document.getElementById('fecha-hora').value = new Date().toLocaleString();

                document.getElementById('registro-form').addEventListener('submit', async (event) => {
                    event.preventDefault();
                    mostrarPantallaCarga();

                    const formData = {
                        fechaHora: document.getElementById('fecha-hora').value,
                        correo: document.getElementById('correo').value,
                        codigoEstudiante: document.getElementById('codigo-estudiante').value,
                        numeroIdentificacion: document.getElementById('numero-identificacion').value,
                        programaAcademico: document.getElementById('programa-academico').value,
                        recibo: document.querySelector('input[name="recibo"]:checked').value,
                    };

                    try {
                        // 👇 Ahora enviamos el token en los headers
                        const response = await fetch(`${BACKEND_URL}/bonos`, {
                            method: 'PUT',
                            headers: headers,
                            body: JSON.stringify(formData),
                        });

                        if (response.ok) {
                            alert('Bono registrado exitosamente.');
                            document.getElementById('registro-form').reset();
                            document.getElementById('fecha-hora').value = new Date().toLocaleString();
                            location.reload();
                        } else {
                            const errorData = await response.json();
                            alert(errorData.mensaje || 'Error al registrar el bono.');
                            location.reload();
                        }
                    } catch (error) {
                        console.error('Error en el envío de los datos:', error);
                        alert('Se produjo un error al procesar tu solicitud.');
                    } finally {
                        ocultarPantallaCarga();
                    }
                });

            } else {
                const mensajeAgotado = document.createElement('div');
                mensajeAgotado.innerHTML = htmlMensaje;
                container.append(mensajeAgotado);
            }
        } catch (error) {
            console.error('Error al cargar la aplicación:', error);
            alert('Ocurrió un error al cargar los bonos. Intenta nuevamente más tarde.');
        }

        // ─── Login admin ──────────────────────────────────────
        document.getElementById('adminBonos').addEventListener('click', () => {
            const container = document.querySelector(elementId);
            container.innerHTML = htmlLogin;
        });

        document.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (event.target.id === 'login-form') {
                const usuario = document.getElementById('usuario').value;
                const password = document.getElementById('password').value;

                // Login tampoco necesita token, es para el admin
                const response = await fetch(`${BACKEND_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario, password }),
                });

                const data = await response.json();
                if (data.exito) {
                    const container = document.querySelector('#app');
                    container.innerHTML = htmlBonos;
                } else {
                    alert('Credenciales incorrectas');
                }
            }
        });

        // ─── Cargar bonos admin ───────────────────────────────
        document.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (event.target.id === 'bonos-form') {
                const bonos = document.getElementById('bonos').value;

                try {
                    // 👇 También enviamos el token aquí
                    const response = await fetch(`${BACKEND_URL}/bonos/cargar`, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify({ bonos }),
                    });

                    const data = await response.json();
                    if (response.ok) {
                        alert('Bonos actualizados correctamente');
                        location.reload();
                    } else {
                        alert(data.mensaje || 'Error al actualizar los bonos');
                    }
                } catch (error) {
                    console.error('Error en la actualización de bonos:', error);
                }
            }
        });

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