# Rey Polanco — Cotizador de branding

Proyecto **independiente de v0**, hecho con HTML, CSS y JavaScript modular. Mantiene la estética azul noche + magenta, el logo de Rey Polanco y las funciones de cotización. **No requiere comprar créditos ni instalar librerías** para compilar.

## Funcionalidades
- Identidad visual (**RD$10,000**) y Branding completo (**RD$20,000**).
- Paquete incluido con **Diseño de papelería básica**.
- Extras de estrategia seleccionables. Se han eliminado las categorías que podían confundirse con precios de producción.
- Totales instantáneos, ITBIS opcional del 18 %, anticipo del 50 % y balance.
- Nombre de cliente, nombre de marca, correo y notas; copia del resumen, WhatsApp, imprimir/guardar como PDF.
- Guardado local en el navegador; botón para reiniciar.
- Clic en el logo **REY POLANCO → https://rey-polanco-vercel.vercel.app/**.
- Responsive y preparado para dispositivos móviles.

> **IMPORTANTE SOBRE PRECIOS:** Los dos precios base están confirmados. **Los importes de los servicios adicionales son ejemplos** que deben revisarse antes de usar el cotizador en producción. Estos valores se editan en `quote-core.mjs`. La herramienta calcula estimados; no procesa pagos.

## Probar en tu computadora

Necesitas Node.js 20 o superior:

```bash
npm run build
npm run dev
```

Abre `http://localhost:3000`. También puedes abrir `index.html` desde un servidor web estático; no debes abrirlo directamente como `file://` porque los módulos JavaScript pueden quedar bloqueados por el navegador.

```bash
npm test
```

## Subir a tu repositorio GitHub (ya creado)

Repositorio: **https://github.com/reypolanco/cotizador_demarca**.

**Opción simple (navegador):**
1. Descomprime `cotizador_demarca-github.zip`.
2. Abre https://github.com/reypolanco/cotizador_demarca y pulsa **uploading an existing file** (repositorio vacío) o **Add file → Upload files**.
3. Arrastra **el contenido** de la carpeta descomprimida (archivos y carpetas), no el ZIP cerrado.
4. Comprueba que `index.html`, `package.json`, `vercel.json`, `app.js`, `quote-core.mjs`, `styles.css`, `assets/` y `tests/` aparecen en la raíz.
5. Pulsa **Commit changes** sobre la rama `main`.

**Opción terminal (git):**

```bash
git init
git branch -M main
git add .
git commit -m "Primera version cotizador_demarca"
git remote add origin https://github.com/reypolanco/cotizador_demarca.git
git push -u origin main
```

## Conectar el repositorio a Vercel

1. En https://vercel.com/new elige **Import Git Repository**.
2. Selecciona `cotizador_demarca` y la rama `main`.
3. En el formulario, elige **Framework Preset: Other**. Los valores de `vercel.json` ya indican el comando `npm run build` y el resultado `dist`.
4. Haz clic en **Deploy**.
5. Verifica la URL de la **nueva** aplicación antes de asignar un dominio conocido. **No borres el cotizador anterior** hasta comprobar el nuevo.
6. A partir de entonces los cambios confirmados en la rama `main` se publican automáticamente en Vercel.

Cuando el repositorio esté conectado a ChatGPT mediante GitHub, será posible editar aquí el código y enviar modificaciones al repositorio, sin v0. Para ello, concede acceso a ese repositorio en la configuración del conector GitHub.

## ¿Dónde se edita cada cosa?

| Archivo | Uso |
|---|---|
| `quote-core.mjs` | Servicios, precios, ITBIS, anticipo, WhatsApp y URL de la landing |
| `index.html` | Estructura visual, mensajes y encabezado |
| `styles.css` | Colores, fuentes, tamaños, márgenes y versión móvil |
| `app.js` | Selección, cálculos en pantalla, impresión, WhatsApp y guardar datos |
| `assets/logo-rey.png` | Logo con fondo transparente |
| `.github/workflows/verify.yml` | Pruebas automáticas cada vez que cambias el código |

## Privacidad y presupuestos
Los datos rellenados se guardan **solo en el navegador** mediante `localStorage`. No hay base de datos ni captura de leads en un servidor. WhatsApp solo se abre al pulsar el botón correspondiente. La impresión funciona desde el navegador. Antes de usarlo comercialmente, confirma tarifas, impuestos y términos aplicables a cada contrato.
