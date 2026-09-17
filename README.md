# Nin Dental Lab — Landing Congreso

Página de una sola pantalla para captar leads de doctores vía NFC/QR en el
congreso. Proyecto [Vite](https://vite.dev) sin framework: HTML, CSS y JS
planos, con dev server, hot reload y build optimizado.

Los envíos del formulario van directo, desde el navegador del doctor, a la
tabla `leads_congreso_lab` en el proyecto Supabase `dentalgest` (el mismo de
DentiGest). No requiere backend propio.

## Estructura

```
index.html          Marcado de la página (entry point de Vite)
src/styles.css      Todos los estilos
src/main.js         Formulario, envío a Supabase y reintentos offline
src/config.js       URL, anon key y tabla de Supabase
src/assets/logo.png Logo de la marca
vite.config.js      Configuración del build y del dev server
```

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:5173
```

El dev server escucha en toda la red local (`host: true`), así que se puede
abrir desde el celular con `http://<ip-de-tu-compu>:5173` para probar el flujo
real de NFC/QR.

Otros comandos:

```bash
npm run build     # genera dist/
npm run preview   # sirve dist/ para revisar el build antes de publicar
```

## Configuración de Supabase

Los valores por defecto están en `src/config.js` y funcionan sin configurar
nada. Para apuntar a otro proyecto o tabla, copia `.env.example` a `.env` y
define las variables `VITE_*`.

La anon key es publicable por diseño: viaja al navegador del doctor. Lo que
protege los leads son las policies de RLS de `leads_congreso_lab`, que deben
permitir `INSERT` y **no** `SELECT` para el rol `anon`.

## Desplegar en Vercel (proyecto nuevo, separado de DentiGest)

### Opción A — CLI (más rápido)

```bash
npm i -g vercel        # si no lo tienes instalado
vercel login           # una sola vez
vercel --prod
```

Vercel detecta Vite automáticamente y usa `npm run build` con salida en
`dist/` (también está declarado en `vercel.json`). Te dará una URL tipo
`https://nin-dental-lab-congreso.vercel.app`: esa es la que grabas en el
NFC/QR.

### Opción B — Dashboard (sin terminal)

1. Entra a vercel.com → **Add New... → Project**.
2. Importa este repositorio de GitHub.
3. Confirma — el framework (Vite) y el build se detectan solos.

## Antes de grabar el NFC/QR

Usa la URL con el parámetro de fuente para poder distinguir el canal en la
tabla de leads:

- NFC: `https://tu-proyecto.vercel.app/?src=nfc` (ya es el valor por
  defecto si no mandas el parámetro)
- QR: `https://tu-proyecto.vercel.app/?src=qr`

## Ver los leads capturados

Mientras no haya un dashboard propio, revisa la tabla directamente en
Supabase → proyecto `dentalgest` → Table Editor →
`leads_congreso_lab`. Se puede exportar a CSV desde ahí mismo.

## Actualizar la página después de publicada

Edita los archivos en `src/`, prueba con `npm run dev` y publica con
`vercel --prod` (o haz push si conectaste el repo) — se actualiza en la
misma URL.
