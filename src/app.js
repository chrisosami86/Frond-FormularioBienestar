import htmlForm from "./formularioHTML.html?raw";
import htmlMensaje from "./mensajeHTML.html?raw";
import htmlLogin from "./loginHTML.html?raw";
import htmlBonos from "./actuaBonosHTML.html?raw"

export const App = (elementId) => {
    (async () => {
        const container = document.querySelector(elementId); // Optimiza el acceso al DOM

        // Función para mostrar la pantalla de carga
        const mostrarPantallaCarga = () => {
            const pantallaCarga = document.createElement('div');
            pantallaCarga.id = 'pantalla-carga';
            pantallaCarga.innerHTML = `<div class="loading-text">Cargando...</div>`;
            document.body.appendChild(pantallaCarga);
        };

        // Función para ocultar la pantalla de carga
        const ocultarPantallaCarga = () => {
            const pantallaCarga = document.getElementById('pantalla-carga');
            if (pantallaCarga) {
                pantallaCarga.remove();
            }
        };

        try {
            // Verificar la cantidad de bonos disponibles
            const bonosResponse = await fetch('https://back-bonos.vercel.app/bonos/disponibles');
            if (!bonosResponse.ok) {
                throw new Error('Error al obtener los bonos disponibles');
            }
            const bonosData = await bonosResponse.json();

            if (bonosData.bonosDisponibles > 0) {
                // Renderizar el formulario si hay bonos
                const app = document.createElement('div');
                app.innerHTML = htmlForm; // Mandando la importación de HTML en crudo
                container.append(app);
                document.getElementById('fecha-hora').value = new Date().toLocaleString();

                document.getElementById('registro-form').addEventListener('submit', async (event) => {
                    event.preventDefault(); // Evita el envío predeterminado del formulario

                    // Mostrar pantalla de carga
                    mostrarPantallaCarga();

                    // Recoger los datos del formulario
                    const formData = {
                        fechaHora: document.getElementById('fecha-hora').value,
                        correo: document.getElementById('correo').value,
                        codigoEstudiante: document.getElementById('codigo-estudiante').value,
                        numeroIdentificacion: document.getElementById('numero-identificacion').value,
                        programaAcademico: document.getElementById('programa-academico').value,
                        recibo: document.querySelector('input[name="recibo"]:checked').value,
                    };

                    try {
                        // Enviar los datos al servidor
                        const response = await fetch('https://back-bonos.vercel.app/bonos', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(formData),
                        });

                        if (response.ok) {
                            alert('Bono registrado exitosamente.');
                            // Limpiar el formulario
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
                        // Ocultar pantalla de carga después de que el proceso termine
                        ocultarPantallaCarga();
                    }
                });

            } else {
                // Renderizar mensaje de agotamiento de bonos
                const mensajeAgotado = document.createElement('div');
                mensajeAgotado.innerHTML = htmlMensaje;
                container.append(mensajeAgotado);
            }
        } catch (error) {
            console.error('Error al cargar la aplicación:', error);
            alert('Ocurrió un error al cargar los bonos. Intenta nuevamente más tarde.');
        }

        //logica login
        document.getElementById('adminBonos').addEventListener('click', () => {
            const container = document.querySelector(elementId); // Asegúrate de que el id del contenedor sea correcto
            container.innerHTML = htmlLogin; // Cargar el formulario de inicio de sesión
        });

        document.addEventListener('submit', async (event) => {
            event.preventDefault();
        
            // Verificar si el formulario de inicio de sesión fue enviado
            if (event.target.id === 'login-form') {
                const usuario = document.getElementById('usuario').value;
                const password = document.getElementById('password').value;
        
                // Aquí deberías hacer una petición al servidor para validar las credenciales
                const response = await fetch('https://back-bonos.vercel.app/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ usuario, password }),
                });
        
                const data = await response.json();
                if (data.exito) {
                    // Iniciar sesión exitosamente, mostrar la pantalla de administración de bonos
                    const container = document.querySelector('#app');
                    container.innerHTML = htmlBonos; // Mostrar la pantalla de administración de bonos
                } else {
                    alert('Credenciales incorrectas');
                }
            }
        });

        //Logica campo de bonos
        document.addEventListener('submit', async (event) => {
            event.preventDefault();
        
            if (event.target.id === 'bonos-form') {
                const bonos = document.getElementById('bonos').value;
        
                try {
                    const response = await fetch('https://back-bonos.vercel.app/bonos/cargar', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
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

// Agregar los estilos para la pantalla de carga
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

