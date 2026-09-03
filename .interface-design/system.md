# Koda Coffee — UI System

## Dirección

Koda se siente como un cuaderno de preparación de café: cálido, oscuro,
concentrado y personal. La persona consulta una receta mientras prepara una
taza y debe reconocerla de un vistazo. La firma visual es el sello de receta:
un icono Lucide dentro de un Avatar circular con fondo de la paleta de café.
Ese sello aparece en tarjetas, detalle y perfil.

Evitar fotografías de stock, emojis y colores libres. La identidad visual debe
ser pequeña, repetible y semántica; las recetas no dependen de una imagen.

## Lenguaje visual

- Dominio: grano, taza, vertido, gotas, molino, báscula, tiempo y método.
- Mundo cromático: caramelo, crema, terracota, oliva, moka y grafito.
- Tema: dark-only, superficies de café tostado y un acento caramelo reservado
  para acciones, foco y estados seleccionados.
- Tipografía: Bricolage Serif para nombres y titulares; Geist Sans para UI;
  Geist Mono para proporciones, cantidades y tiempos.
- Retícula: unidad base de 4 px. Usar múltiplos para gaps y padding.

## Tokens y profundidad

Los fondos del sello se identifican por tokens semánticos (`avatar-caramel`,
`avatar-crema`, `avatar-terracotta`, `avatar-olive`, `avatar-mocha`,
`avatar-slate`) y siempre tienen un foreground contrastante. No usar hex,
colores Tailwind arbitrarios ni clases dinámicas generadas desde datos.

La jerarquía de superficies es `background` → `card` → `secondary`/popover.
Los bordes son de baja opacidad y los overlays usan la composición Dialog de
shadcn; la elevación se comunica con cambios tonales y sombras suaves, no con
bordes gruesos.

## Componentes repetibles

- `AppearanceAvatar`: usa `Avatar` + `AvatarFallback`; tamaños `sm` 48 px,
  `md` 64 px y `lg` 96 px. El icono es siempre decorativo y el control padre
  aporta el nombre accesible.
- Sello de receta: `md` en tarjetas, `lg` en el detalle y perfil. Las tarjetas
  ponen sello, método y título en una fila compacta; las métricas quedan en un
  footer separado.
- Avatar de perfil: `lg`, default `coffee` + `caramel`; usuarios autenticados
  pueden abrir el picker, invitados solo ven el default.
- `AvatarPickerDialog`: Dialog de shadcn con preview dominante, RadioGroup de
  ocho iconos y RadioGroup de seis fondos. Cada opción tiene label accesible,
  foco visible, aro/fondo/marca para el estado seleccionado y área táctil de
  al menos 44 px.
- Acciones del diálogo: Cancelar y Guardar avatar; durante guardado se muestra
  `Spinner` y ambos botones quedan deshabilitados. El error conserva el diálogo
  abierto; el éxito lo cierra y anuncia el estado.

## Jerarquía, estados y movimiento

El foco de cada vista es el sello + nombre de receta o el avatar del perfil.
Títulos usan peso fuerte y contraste alto; autor y metadata usan niveles
secundarios/muted. Los números dinámicos deben usar cifras tabulares.

Todo control necesita hover, active, focus-visible, disabled y estado de error.
Los iconos seleccionados nunca se comunican únicamente por color.

Las transiciones se limitan a transform, opacity, color y border-color, con
duraciones menores de 300 ms y feedback active cercano a `scale(0.97)`. Las
entradas respetan `prefers-reduced-motion`; no animar layout, padding o tamaño.
