// src/front/utils/imagen.js
// Convierte la imagen que sube el usuario en un data URL base64 listo para
// guardar en la BD. Antes la recorta en cuadrado y la reescala, para que una
// foto de 4 MB del movil termine pesando ~50 KB en la base de datos.

export const MAX_ARCHIVO_MB = 5;
const LADO_POR_DEFECTO = 400;
const CALIDAD_JPEG = 0.85;

export const archivoAImagenBase64 = (archivo, ladoMaximo = LADO_POR_DEFECTO) =>
  new Promise((resolve, reject) => {
    if (!archivo) {
      reject(new Error("No se selecciono ningun archivo"));
      return;
    }

    if (!archivo.type.startsWith("image/")) {
      reject(new Error("El archivo debe ser una imagen (JPG, PNG, WEBP...)"));
      return;
    }

    if (archivo.size > MAX_ARCHIVO_MB * 1024 * 1024) {
      reject(new Error(`La imagen no puede pesar mas de ${MAX_ARCHIVO_MB} MB`));
      return;
    }

    const lector = new FileReader();

    lector.onerror = () => reject(new Error("No se pudo leer el archivo"));

    lector.onload = () => {
      const imagen = new Image();

      imagen.onerror = () => reject(new Error("El archivo no es una imagen valida"));

      imagen.onload = () => {
        // Recorte cuadrado centrado: nos quedamos con el lado mas corto
        const lado = Math.min(imagen.width, imagen.height);
        const origenX = (imagen.width - lado) / 2;
        const origenY = (imagen.height - lado) / 2;
        const destino = Math.min(lado, ladoMaximo);

        const canvas = document.createElement("canvas");
        canvas.width = destino;
        canvas.height = destino;

        const contexto = canvas.getContext("2d");
        contexto.drawImage(imagen, origenX, origenY, lado, lado, 0, 0, destino, destino);

        resolve(canvas.toDataURL("image/jpeg", CALIDAD_JPEG));
      };

      imagen.src = lector.result;
    };

    lector.readAsDataURL(archivo);
  });
