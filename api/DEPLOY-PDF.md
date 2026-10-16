# Cotizador Rey Polanco: PDF con enlace temporal por WhatsApp

## Qué hace

- Conserva el diseño Poppins Black, el resumen de paquetes y servicios y los precios actuales.
- Al pulsar **Enviar PDF por WhatsApp**, llama a `POST /api/cotizacion`.
- El servidor recalcula el presupuesto, crea un PDF con logo, servicios, ITBIS, anticipo y balance, y lo guarda en un **Vercel Blob privado**.
- Devuelve una URL firmada de `GET /api/descargar` con vencimiento de **7 días**. Los archivos privados nunca son accesibles por la URL del Blob.
- Abre WhatsApp con un mensaje corto y el enlace; el visitante debe pulsar «Enviar». También deja en pantalla los botones «Ver PDF» y «Copiar enlace».

## PASO 1: subir el proyecto

Descomprime el ZIP y sube **el contenido**, manteniendo `api/`, `assets/`, `tests/`, los CSS y los demás archivos en la raíz de `https://github.com/reypolanco/cotizador_demarca` (rama `main`). GitHub reemplaza archivos del mismo nombre. Vercel genera un despliegue al recibir el commit.

## PASO 2: configurar almacenamiento (NECESARIO)

En Vercel abre el proyecto **cotizador-demarca** → **Storage** → **Create Database** → **Blob** → marca **Private** (no Public) y asócialo a este proyecto para que aparezca `BLOB_READ_WRITE_TOKEN` en las variables de entorno. No pegues ese token en el chat ni lo guardes en GitHub.

En **Settings → Environment Variables** crea además:

- `QUOTE_LINK_SECRET` = una cadena aleatoria secreta de por lo menos 32 caracteres, por ejemplo generada en tu equipo con `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Solo en Vercel, nunca en GitHub.
- `PUBLIC_SITE_URL` = `https://cotizador-demarca.vercel.app` (opcional: el código usa esta URL por defecto).

Asegúrate de incluir **Production** en las variables y haz **Redeploy** después de configurarlas. Si pruebas en una URL de preview, configura `PUBLIC_SITE_URL` y permite ese dominio en el control de origen, o haz las pruebas en la URL de producción.

## PASO 3: comprobar

Abre `https://cotizador-demarca.vercel.app/`, elige un paquete, rellena los datos del cliente y pulsa **Enviar PDF por WhatsApp**. Se abrirá WhatsApp con un enlace a `https://cotizador-demarca.vercel.app/api/descargar?...`. Al acceder desde WhatsApp deberá mostrarse el PDF.

## Seguridad / limitaciones

- El documento se almacena en un Blob **privado**, accesible solo mediante nuestra función y un enlace HMAC-SHA256 que caduca a los 7 días.
- El enlace funciona como una llave compartible: **cualquiera que reciba el enlace puede abrir el PDF mientras siga vigente**. No equivale a un inicio de sesión.
- **El vencimiento bloquea el acceso pero no elimina automáticamente el archivo del almacenamiento**. Eliminar blobs antiguos requiere una rutina adicional de limpieza o borrarlos en el panel Storage.
- El endpoint de generación es público; para sitios con mucho tráfico conviene configurar límites de solicitudes o CAPTCHA en Vercel WAF para evitar abuso y cargos de almacenamiento.
- WhatsApp `wa.me` no adjunta el PDF como archivo y no envía mensajes automáticamente: abre el chat con el enlace listo para enviar.
- Vercel Blob puede generar costos según el uso. Revisa los límites y la facturación de tu cuenta.

## Probar sin publicar

`npm test` ejecuta pruebas unitarias, incluida la generación real del PDF. `npm run build` crea los archivos estáticos. Para probar las rutas API de Vercel en local, utiliza Vercel CLI y las variables de entorno del proyecto (`vercel dev`).
