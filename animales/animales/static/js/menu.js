function initMenu() {
  // Rotador de videos (solo si no estaba ya configurado)
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

    // arranca el ciclo
    v1.src = videos[0];
    v1.onended = playNext;
    v1.dataset.rotatorBound = "1"; // marca para no duplicar
  }

  // Menú hamburguesa (abre/cierra overlay)
  const burgerBtn = document.getElementById("burger-btn");
  const closeBtn  = document.getElementById("close-menu");
  burgerBtn?.addEventListener("click", () => document.body.classList.add("open"));
  closeBtn?.addEventListener("click", () => document.body.classList.remove("open"));

  // Limpieza de vista principal
  const menuList = document.getElementById("category-menu");
  const resultEl = document.getElementById("result");
  const mapEl    = document.getElementById("map");

  function clearMain() {
    if (resultEl) resultEl.innerHTML = "";
    if (mapEl)    mapEl.innerHTML    = "";

    const title = document.getElementById("main-title");
    if (title) title.classList.remove("hidden");

    try {
      if (window.leafletMap) {
        window.leafletMap.remove();
        window.leafletMap   = null;
        window.leafletMarker = null;
      }
    } catch {
      // ignora si no hay Leaflet
    }
  }

  function hideProtectedBlock() {
    const prot = document.getElementById("protected-block");
    if (prot) prot.classList.add("hidden");
  }

  // Carga de categorías
  function loadCategories() {
    if (!menuList) return;

    fetch("/api/categorias")
      .then((r) => r.json())
      .then((categorias) => {
        menuList.innerHTML = "";
        hideProtectedBlock();

        // botón inicio
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

        // botones de categorías
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

  // Carga de animales por categoría
  function loadAnimalsByCategory(category) {
    if (!menuList) return;

    fetch(`/api/categoria/${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((animals) => {
        hideProtectedBlock();
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

  // exponer para que otros scripts lo usen
  window.loadCategories = loadCategories;

  // limpiar mapa al dar click en inicio
  document.addEventListener("click", (e) => {
    if (e.target?.matches?.(".home-btn")) clearMain();
  });

  // primera carga
  loadCategories();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMenu);
} else {
  initMenu();
}
