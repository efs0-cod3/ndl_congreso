# Nin Dental Lab — Landing Congreso

Página estática de una sola pantalla para captar leads de doctores vía NFC/QR
en el congreso. Sin build, sin dependencias — es un solo `index.html`
autocontenido (logo embebido, fuentes desde Google Fonts).

Los envíos del formulario van directo, desde el navegador del doctor, a la
tabla `leads_congreso_lab` en el proyecto Supabase `dentalgest` (el mismo de
DentiGest). No requiere backend propio.

## Desplegar en Vercel (proyecto nuevo, separado de DentiGest)

### Opción A — CLI (más rápido)

```bash
npm i -g vercel        # si no lo tienes instalado
cd nin-dental-lab-congreso
vercel login           # una sola vez
vercel --prod
```

Te preguntará el nombre del proyecto (ej. `nin-dental-lab-congreso`) y te
dará una URL tipo `https://nin-dental-lab-congreso.vercel.app`. Esa es la
que grabas en el NFC/QR.

### Opción B — Dashboard (sin terminal)

1. Entra a vercel.com → **Add New... → Project**.
2. Elige **"Deploy without Git"** / arrastra esta carpeta al área de deploy.
3. Confirma — no hace falta configurar nada más (es HTML estático).

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

Edita `index.html` y vuelve a correr `vercel --prod` (o vuelve a arrastrar
la carpeta en el dashboard) — se actualiza en la misma URL.
