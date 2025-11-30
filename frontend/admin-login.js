document.getElementById("admin-login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorEl = document.getElementById("error");

  try {
    const res = await fetch("http://localhost:5000/api/admin/login", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || "Login failed";
      return;
    }

    // Save token
    localStorage.setItem("admin_token", data.token);

    // Redirect to admin dashboard
    window.location.href = "admin.html";
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Server error";
  }
});
