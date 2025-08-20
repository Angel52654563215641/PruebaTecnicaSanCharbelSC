// ============================================================================
// menu.js
// - Inicializa menú hamburguesa y overlay de categorías/animales
// - Maneja el rotador de videos (solo si no ha sido inicializado por otro script)
// - Limpia la vista principal y el mapa al navegar
// - (Opcional) Oculta bloque protegido #protected-block al navegar por el menú
// ============================================================================

function initMenu() {
  // -------------------------------------------------------------------------
  // 1) Rotador de videos de fondo (solo si no se ha ligado previamente)
  //    Si otro archivo (p.ej. main.js) ya controla los videos, este bloque
  //    detecta la marca y no vuelve a enlazar eventos.
  // -------------------------------------------------------------------------
  const v1 = document.getElementById("bg-video-1");
  const v2 = document.getElementById("bg-video-2");

  if (v1 && v2 && !v1.dataset.rotatorBound) {
    const videos = [
      "/static/media/animal1.mp4",
      "/static/media/animal2.mp4",
      "/static/media/animal3.mp4",
      "/static/media/animal4.mp4",
      "/static/media/animal5.mp4",
      "/static/media/animal6.mp4",
    ];
    let idx = 0;
    let active = 0;

    function playNext() {
      const current = active === 0 ? v1 : v2;
      const next = active === 0 ? v2 : v1;

      idx = (idx + 1) % videos.length;
      next.src = videos[idx];
      next.load();
      next.oncanplay = () => {
        next.style.display = "block";
        next.play();
        setTimeout(() => {
          current.pause();
          current.style.display = "none";
          active = active === 0 ? 1 : 0;
          next.onended = playNext;
        }, 100);
      };
    }

    // Arranca el ciclo
    v1.src = videos[0];
    v1.onended = playNext;

    // Marca para evitar doble enlace si otro script ya lo gestiona
    v1.dataset.rotatorBound = "1";
  }

  // -------------------------------------------------------------------------
  // 2) Menú hamburguesa (abre/cierra overlay)
  // -------------------------------------------------------------------------
  const burgerBtn = document.getElementById("burger-btn");
  const closeBtn  = document.getElementById("close-menu");
  burgerBtn?.addEventListener("click", () => document.body.classList.add("open"));
  closeBtn?.addEventListener("click", () => document.body.classList.remove("open"));

  // -------------------------------------------------------------------------
  // 3) Utilidades de overlay y limpieza de vista principal
  // -------------------------------------------------------------------------
  const menuList = document.getElementById("category-menu");
  const resultEl = document.getElementById("result");
  const mapEl    = document.getElementById("map");

  // Limpia resultados, re-muestra título y destruye el mapa Leaflet si existe
  function clearMain() {
    if (resultEl) resultEl.innerHTML = "";
    if (mapEl)    mapEl.innerHTML    = "";

    const title = document.getElementById("main-title");
    if (title) title.classList.remove("hidden");

    // Destruir mapa Leaflet de forma segura
    try {
      if (window.leafletMap) {
        window.leafletMap.remove();
        window.leafletMap   = null;
        window.leafletMarker = null;
      }
    } catch {
      // Ignorar errores si Leaflet no está inicializado
    }
  }

  // Oculta el bloque protegido si existe
  function hideProtectedBlock() {
    const prot = document.getElementById("protected-block");
    if (prot) prot.classList.add("hidden");
  }

  // -------------------------------------------------------------------------
  // 4) Carga de categorías en el overlay
  // -------------------------------------------------------------------------
  function loadCategories() {
    if (!menuList) return;

    fetch("/api/categorias")
      .then((r) => r.json())
      .then((categorias) => {
        menuList.innerHTML = "";

        // Ocultar bloque protegido al entrar al listado de categorías
        hideProtectedBlock();

        // Botón "Inicio"
        const homeLi  = document.createElement("li");
        const homeBtn = document.createElement("button");
        homeBtn.textContent = "Inicio";
        homeBtn.className   = "home-btn";
        homeBtn.addEventListener("click", () => {
          document.body.classList.remove("open");
          clearMain();
        });
        homeLi.appendChild(homeBtn);
        menuList.appendChild(homeLi);

        // Botones de categorías (solo en overlay)
        categorias.forEach((cat) => {
          const li  = document.createElement("li");
          const btn = document.createElement("button");
          btn.textContent = cat;
          btn.className   = "category-btn";
          btn.addEventListener("click", () => loadAnimalsByCategory(cat));
          li.appendChild(btn);
          menuList.appendChild(li);
        });
      })
      .catch((e) => console.error("Error cargando categorías:", e));
  }

  // -------------------------------------------------------------------------
  // 5) Carga de animales por categoría (en overlay)
  // -------------------------------------------------------------------------
  function loadAnimalsByCategory(category) {
    if (!menuList) return;

    fetch(`/api/categoria/${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((animals) => {
        // Ocultar bloque protegido al cambiar de categoría
        hideProtectedBlock();

        // Construir overlay: botón volver + lista de animales
        menuList.innerHTML = "";

        const backLi  = document.createElement("li");
        const backBtn = document.createElement("button");
        backBtn.textContent = "← Volver";
        backBtn.className   = "back-btn";
        backBtn.addEventListener("click", () => loadCategories());
        backLi.appendChild(backBtn);
        menuList.appendChild(backLi);

        animals.forEach((animal) => {
          const li  = document.createElement("li");
          const btn = document.createElement("button");
          btn.textContent = animal;
          btn.className   = "animal-btn";
          btn.addEventListener("click", () => {
            document.body.classList.remove("open");
            if (typeof window.searchAnimal === "function") {
              window.searchAnimal(animal);
            }
          });
          li.appendChild(btn);
          menuList.appendChild(li);
        });
      })
      .catch((e) => console.error("Error cargando animales:", e));
  }

  // Exponer para que otros scripts (p.ej. app-shell) puedan repintar tras login
  window.loadCategories = loadCategories;

  // Limpia mapa al pulsar en cualquier botón con clase ".home-btn" (seguridad extra)
  document.addEventListener("click", (e) => {
    if (e.target?.matches?.(".home-btn")) clearMain();
  });

  // Carga inicial del overlay
  loadCategories();
}

// Ejecutar initMenu aunque el DOM ya esté cargado
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMenu);
} else {
  initMenu();
}
