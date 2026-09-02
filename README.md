# Mis Cuentos — Luna y la estrella perdida

Aplicación educativa de cuentos interactivos para niños de 5 a 7 años.
Todo el contenido (textos, escenas, decisiones, preguntas e ilustraciones)
está previamente definido dentro de la app: **no usa inteligencia
artificial ni genera nada dinámicamente**. Es HTML, CSS y JavaScript
simple — no necesita instalación ni build.

## Qué incluye

- Pantalla de inicio, biblioteca, lectura interactiva, preguntas de
  comprensión, recompensas, progreso y modo padres (con clave numérica
  simple).
- El cuento completo **"Luna y la estrella perdida"**, con 8 escenas y
  decisiones que cambian el camino de la historia.
- Ilustraciones propias en SVG para cada escena.
- Narración por voz: usa la síntesis de voz del propio teléfono
  (no son archivos de audio, así que no hay que grabar nada) y resalta
  la palabra que se está narrando.
- El progreso, el tiempo de lectura y las insignias se guardan en el
  celular (localStorage), no en un servidor.

## Cómo subirlo a GitHub y abrirlo en el celular

1. **Creá un repositorio nuevo** en GitHub (por ejemplo `mis-cuentos-app`).
2. Subí **todo el contenido de esta carpeta** (`index.html`, `css/`,
   `js/`, `assets/`) a la raíz del repositorio — no subas la carpeta
   contenedora, sino lo que hay adentro.
3. En el repositorio, andá a **Settings → Pages**.
4. En "Build and deployment", elegí **Deploy from a branch**, rama
   `main` (o `master`) y carpeta `/ (root)`. Guardá.
5. GitHub te va a dar un link parecido a
   `https://tu-usuario.github.io/mis-cuentos-app/` (tarda uno o dos
   minutos en activarse la primera vez).
6. Abrí ese link **desde el celular**, en el navegador (Chrome o
   Safari). Para que tu hija lo abra fácil, podés:
   - En Android/Chrome: menú (⋮) → **"Añadir a pantalla de inicio"**.
   - En iPhone/Safari: botón compartir → **"Añadir a pantalla de
     inicio"**.
   
   Así queda como un ícono más, y se abre a pantalla completa como una
   app.

## Notas sobre la narración de audio

La app usa la función de "leer en voz alta" que ya trae el navegador del
celular (Web Speech API), con la voz en español que tenga instalada el
teléfono. No hace falta conexión a internet para que suene, salvo la
primera vez que se carga la página (para bajar las tipografías). Si el
celular no tiene una voz en español instalada, el botón de audio no
sonará; se puede instalar una voz en español desde los ajustes de
accesibilidad/idioma del teléfono.

## Cómo agregar un cuento nuevo más adelante

Todo el contenido vive en `js/data.js`, dentro del arreglo `STORIES`.
Para agregar un cuento nuevo, se copia la forma del cuento
`luna-estrella` (escenas, decisiones, preguntas) con contenido nuevo y
`disponible: true`, y se agregan las ilustraciones correspondientes en
`assets/illustrations/`. No hace falta tocar `js/app.js`: el motor de
la app ya sabe mostrar cualquier cuento con esa forma.

## Estructura de carpetas

```
index.html
css/
  style.css
js/
  data.js      → todo el contenido de los cuentos (texto, escenas, preguntas)
  app.js       → la lógica de la app (navegación, audio, progreso)
assets/
  illustrations/  → ilustraciones SVG de cada escena
```
