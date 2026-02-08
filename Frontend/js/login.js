// Frontend/js/login.js
import { supabase } from "./supabaseClient.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("username"); // your field is labeled username but contains email
  const passwordInput = document.getElementById("password");
  const errorBox = document.getElementById("login-error");
  const loginBtn = document.getElementById("login-button");

  function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = "block";
  }

  function hideError() {
    errorBox.textContent = "";
    errorBox.style.display = "none";
  }

  function disableForm(disable) {
    emailInput.disabled = disable;
    passwordInput.disabled = disable;
    loginBtn.disabled = disable;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    disableForm(true);

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Redirect to HOME
      window.location.href = "index.html";
    } catch (err) {
      showError(err?.message || "Login failed.");
      disableForm(false);
    }
  });
});
