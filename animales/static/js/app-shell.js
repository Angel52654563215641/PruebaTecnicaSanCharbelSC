// static/js/app-shell.js
const authSection = document.getElementById("auth-section");
const appSection  = document.getElementById("app-section");

function showAuth() {
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
}

function showApp() {
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  // repinta el menú al entrar (cuando menu.js ya expuso la función)
  if (typeof window.loadCategories === "function") {
    setTimeout(() => window.loadCategories(), 0);
  }
}

// ====== Validar sesión al cargar ======
(async function boot() {
  const token = localStorage.getItem("token");
  if (!token) { showAuth(); return; }
  try {
    const me = await fetch("/me", { headers: { Authorization: `Bearer ${token}` } });
    if (!me.ok) throw new Error("Unauthorized");
    showApp();
  } catch {
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
  loginErr.textContent = "";
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
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    showApp();
  } catch (err) {
    loginErr.textContent = err.message;
  }
});

// ====== Registro ======
const registerForm = document.getElementById("registerForm");
const regErr = document.getElementById("regErr");

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  regErr.textContent = "";
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
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    showApp();
  } catch (err) {
    regErr.textContent = err.message;
  }
});

// ====== Logout ======
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  showAuth();
});
