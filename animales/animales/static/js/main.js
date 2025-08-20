document.addEventListener("DOMContentLoaded", () => {
  const videoEls = [
    document.getElementById("bg-video-1"),
    document.getElementById("bg-video-2"),
  ];

  // Lista de videos que se van rotando
  const videos = [
    "/static/media/animal1.mp4",
    "/static/media/animal2.mp4",
    "/static/media/animal3.mp4",
    "/static/media/animal4.mp4",
    "/static/media/animal5.mp4",
    "/static/media/animal6.mp4",
  ];

  let index = 0;   // cuál video va
  let active = 0;  // cuál de los dos <video> está activo

  function playNext() {
    const current = videoEls[active];
    const next = videoEls[1 - active];

    index = (index + 1) % videos.length;
    next.src = videos[index];
    next.load();

    next.oncanplay = () => {
      next.style.display = "block";
      next.play();

      // espera un poquito para hacer el fade
      setTimeout(() => {
        current.pause();
        current.style.display = "none";
        active = 1 - active;
        next.onended = playNext;
      }, 100);
    };
  }

  // arranca el primer video
  if (videoEls[0]) {
    videoEls[0].src = videos[0];
    videoEls[0].onended = playNext;
  }
});

window.searchAnimal = async function (name) {
  const box = document.getElementById("result");

  try {
    const res = await fetch(`/api/animal/${encodeURIComponent(name)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No encontrado");

    // Tarjeta con info
    if (box) {
      box.innerHTML = `
        <div class="card">
          <div class="card-content">
            <span class="card-title">${data.name || name}</span>
            <p>${data.description || "Sin descripción."}</p>
            ${data.wiki_image ? `<img src="${data.wiki_image}" style="max-width:100%;margin-top:12px" />` : ""}
            ${data.unsplash_image ? `<img src="${data.unsplash_image}" style="max-width:100%;margin-top:8px" />` : ""}
          </div>
        </div>`;
    }

    // Mapa si hay coords
    if (data.location && Array.isArray(data.location) && data.location.length === 2) {
      const [lat, lng] = data.location;

      if (!window.L) {
        console.warn("Leaflet no está cargado.");
        return;
      }

      // crear mapa la primera vez, luego solo mover
      if (!window.leafletMap) {
        window.leafletMap = L.map("map").setView([lat, lng], 4);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 18,
        }).addTo(window.leafletMap);
      } else {
        window.leafletMap.setView([lat, lng], 4);
      }

      // borrar marcador viejo y poner nuevo
      if (window.leafletMarker) window.leafletMarker.remove();
      window.leafletMarker = L.marker([lat, lng]).addTo(window.leafletMap);
    }
  } catch (err) {
    console.error(err);
    if (box) {
      box.innerHTML = `<div class="card-panel red lighten-4">Error: ${err.message}</div>`;
    }
  }
};

(function () {
  const btn  = document.getElementById("loadRepos");
  const list = document.getElementById("reposList");
  if (!btn || !list) return;

  btn.addEventListener("click", async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Primero inicia sesión.");
      return;
    }

    list.innerHTML = `<li class="collection-item">Cargando...</li>`;

    try {
      const res = await fetch("/secure/github", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        list.innerHTML = `<li class="collection-item red-text">${data.message || "Error"}</li>`;
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        list.innerHTML = `<li class="collection-item">Sin resultados.</li>`;
        return;
      }

      list.innerHTML = data
        .map(
          (r) => `
        <li class="collection-item">
          <strong>${r.name}</strong>
          <span class="secondary-content">★ ${r.stars}</span>
          <br><a href="${r.url}" target="_blank" rel="noopener">Abrir</a>
        </li>`
        )
        .join("");
    } catch (e) {
      list.innerHTML = `<li class="collection-item red-text">Error: ${e.message}</li>`;
    }
  });
})();
