import htmlForm from "./formularioHTML.html?raw";
import htmlMensaje from "./mensajeHTML.html?raw";

export const App = (elementId) => {
    (async () => {
        const container = document.querySelector(elementId); // Optimiza el acceso al DOM

        try {
            // Verificar la cantidad de bonos disponibles
            const bonosResponse = await fetch('https://back-bonos.vercel.app/bonos');
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
                            body: JSON.stringify({
                                nuevosBonos: bonosData.bonosDisponibles - 1, // Resta 1 al total
                                fechaHora: formData.fechaHora,
                                correo: formData.correo,
                                codigoEstudiante: formData.codigoEstudiante,
                                numeroIdentificacion: formData.numeroIdentificacion,
                                programaAcademico: formData.programaAcademico,
                                recibo: formData.recibo,
                            }),
                        });

                        if (response.ok) {
                            alert('Bono registrado exitosamente.');
                            // Limpiar el formulario
                            document.getElementById('registro-form').reset();
                            document.getElementById('fecha-hora').value = new Date().toLocaleString();
                            location.reload();
                        } else if (response.status === 500) {
                            alert('Error del servidor, por favor intenta más tarde.');
                        } else {
                            alert('Error al registrar el bono.');
                        }
                    } catch (error) {
                        console.error('Error en el envío de los datos:', error);
                        alert('Se produjo un error al procesar tu solicitud.');
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
    })();
};
