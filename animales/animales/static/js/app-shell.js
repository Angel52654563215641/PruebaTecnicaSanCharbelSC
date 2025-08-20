// static/js/app-shell.js
const authSection = document.getElementById("auth-section");
const appSection  = document.getElementById("app-section");

function showAuth() {
  authSection.classList.remove("hidden"); // muestra login/registro
  appSection.classList.add("hidden"); // esconde la app
}

function showApp() {
  authSection.classList.add("hidden"); // esconde login/registro
  appSection.classList.remove("hidden"); // muestra la app
  // vuelve a cargar el menú cuando se entra a la app
  if (typeof window.loadCategories === "function") {
    setTimeout(() => window.loadCategories(), 0);
  }
}

// ====== Revisa si ya hay sesión guardada ======
(async function boot() {
  const token = localStorage.getItem("token");
  if (!token) { showAuth(); return; }
  try {
    const me = await fetch("/me", { headers: { Authorization: `Bearer ${token}` } });
    if (!me.ok) throw new Error("Unauthorized"); // si falla, va al catch
    showApp();
  } catch {
    // si no sirve el token lo borramos
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    showAuth();
  }
})();

// ====== Login ======
const loginForm = document.getElementById("loginForm");
const loginErr  = document.getElementById("loginErr");

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginErr.textContent = ""; // limpia errores
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al iniciar sesión");
    // guarda token y usuario en localStorage
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    showApp(); // entra a la app
  } catch (err) {
    loginErr.textContent = err.message; // muestra error
  }
});

// ====== Registro ======
const registerForm = document.getElementById("registerForm");
const regErr = document.getElementById("regErr");

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  regErr.textContent = ""; // limpia errores
  const name = document.getElementById("nameReg").value.trim();
  const email = document.getElementById("emailReg").value.trim();
  const password = document.getElementById("passwordReg").value;

  try {
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error al registrar");
    // guarda token y usuario
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    showApp(); // entra a la app
  } catch (err) {
    regErr.textContent = err.message; // muestra error
  }
});

// ====== Logout ======
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  showAuth(); // vuelve al login
});
