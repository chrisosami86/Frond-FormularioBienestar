import  htmlForm from "./formularioHTML.html?raw";

export const App = (elementId) => {    


    (()=>{

        const app = document.createElement('div');
        app.innerHTML = htmlForm; //mandando la importacion de html en crudo
        document.querySelector(elementId).append(app);
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
                // Verificar la cantidad de bonos disponibles
                const bonosResponse = await fetch('https://back-bonos.vercel.app/bonos');
                const bonosData = await bonosResponse.json();
        
                if (bonosData.bonosDisponibles > 0) {
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
                    } else {
                        alert('Error al registrar el bono.');
                    }
                } else {
                    alert('No hay bonos disponibles.');
                    // Limpiar el formulario
                    document.getElementById('registro-form').reset();
                    document.getElementById('fecha-hora').value = new Date().toLocaleString();
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Se produjo un error al procesar tu solicitud.');
            }
        });

    })();
}
