# 🕵️ El Impostor

Juego del impostor para jugar con amigos pasando el móvil. Uno de los jugadores
recibe una palabra distinta (o ninguna) y el resto tiene que descubrir quién es.

**Sin anuncios. Sin registro. Funciona sin conexión. Más de 2.300 palabras.**

---

## 🎮 Cómo se juega

1. Elegid cuántos jugáis y empezad la partida.
2. Pasaos el móvil. Cada persona ve en secreto **su palabra** o, si es el
   **impostor**, un aviso (o una **pista** si activáis esa opción).
3. Por turnos, cada uno da **una pista** sobre su palabra, sin decirla.
4. El impostor intenta disimular; los demás, pillarle.
5. Al terminar el debate se pulsa «Revelar la solución».

### Pista para el impostor

Es una opción que se activa o desactiva en los ajustes:

- **Desactivada** — el impostor no tiene palabra y debe improvisar.
- **Activada** — el impostor recibe una **pista**: una palabra relacionada con
  la del resto, pero no obvia, para poder disimular. Las categorías siguen
  activas: la palabra principal sale de ellas como siempre.

La lista de pistas también funciona como palabras jugables: la categoría
**Pistas** recoge todas las palabras que solo aparecen como pista.

### Extras

- **Nombres de jugadores**: poned vuestros nombres reales.
- **28 categorías** (26 temáticas + Random + Pistas), con un selector propio.
- De 1 hasta tantos impostores como jugadores haya.
- Pista relacionada para el impostor (opcional).
- Temporizador de debate con aviso sonoro (desactivado por defecto).
- El debate empieza por un **jugador aleatorio** cada ronda.
- La **categoría no se repite** en rondas consecutivas.
- El móvil se pasa **en orden (1, 2, 3…)** para ver lo que te toca.
- Instalable como app (PWA) y funciona sin conexión.

---

## 🚀 Publicar en GitHub Pages

El proyecto es HTML/CSS/JS puro: no necesita compilar. Basta con subirlo a un
repositorio y activar Pages.

```bash
git init
git add .
git commit -m "El Impostor"
gh repo create impostor --public --source=. --push
```

Después, en GitHub: **Settings → Pages → Source: Deploy from a branch →
Branch: `main` / root**. Quedará disponible en:

```
https://TU-USUARIO.github.io/impostor/
```

> También se puede forzar desde la CLI:
> `gh api -X POST repos/TU-USUARIO/impostor/pages -f source[branch]=main -f source[path]=/`

Si quieres una URL tipo `.../juego/`, solo hay que ponerle ese nombre al repo.

### Probar en local

```bash
python -m http.server 8000
# abre http://localhost:8000
```

---

## 🗂️ Estructura

```
index.html              interfaz y pantallas
css/styles.css          estilos (tema oscuro, móvil)
js/words.js             base de palabras por categorías  ← aquí se añaden palabras
js/clues.js             pistas por palabra (pista del impostor)
js/app.js               lógica del juego
manifest.webmanifest    configuración PWA
sw.js                   service worker (uso sin conexión)
icons/                  iconos generados
tools/gen-icons.mjs     regenera los iconos
tools/validate.mjs      comprueba duplicados y totales de la base de palabras
tools/smoke-test.mjs    prueba automática de la lógica del juego
```

### Añadir palabras

Edita `js/words.js` y añade textos al array `words` de la categoría que quieras.

### Añadir pistas

Edita `js/clues.js` y añade una entrada `"Palabra": ["pista1", "pista2", ...]`.
La palabra debe existir ya en `js/words.js`. La relación es bidireccional: la
pista también sirve como palabra, y la palabra original pasa a ser una de sus
pistas.

Para comprobar que todo es correcto:

```bash
node tools/validate.mjs
node tools/smoke-test.mjs
```

### Actualizar la versión instalada

Al publicar cambios, sube el número en `VERSION` dentro de `sw.js` para que los
usuarios reciban la nueva caché.
