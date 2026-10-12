# 🕵️ El Impostor

Juego del impostor para jugar con amigos pasando el móvil. Uno de los jugadores
recibe una palabra distinta (o ninguna) y el resto tiene que descubrir quién es.

**Sin anuncios. Sin registro. Funciona sin conexión. Más de 2.300 palabras.**

---

## 🎮 Cómo se juega

1. Elegid cuántos jugáis y empezad la partida.
2. Pasados el móvil. Cada persona ve en secreto **su palabra** o, si es el
   **impostor**, un aviso (o una palabra parecida en modo Infiltrado).
3. Por turnos, cada uno da **una pista** sobre su palabra, sin decirla.
4. El impostor intenta disimular; los demás, pillarle.
5. Votáis y se revela la solución.

### Modos

- **Clásico** — el impostor no tiene palabra y debe improvisar.
- **Infiltrado** — el impostor recibe una palabra *parecida* a la vuestra y
  tiene que deducir cuál es la buena.

### Extras

- **Nombres de jugadores**: poned vuestros nombres reales.
- 26 categorías temáticas + **categorías propias** ilimitadas.
- De 1 hasta tantos impostores como jugadores haya.
- Pista de categoría para el impostor (opcional).
- Temporizador de debate con aviso sonoro.
- Votación secreta pasando el móvil.
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
js/pairs.js             parejas del modo Infiltrado
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
Para comprobar que todo es correcto:

```bash
node tools/validate.mjs
node tools/smoke-test.mjs
```

### Actualizar la versión instalada

Al publicar cambios, sube el número en `VERSION` dentro de `sw.js` para que los
usuarios reciban la nueva caché.
