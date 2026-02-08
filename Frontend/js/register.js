// Frontend/js/register.js
import { supabase } from "./supabaseClient.js";

function showError(inputId, message) {
  const errorDiv = document.getElementById(inputId + "-error");
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = "block";
  }
}

function clearErrors() {
  document.querySelectorAll(".error-message").forEach(div => {
    div.textContent = "";
    div.style.display = "none";
  });
}

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  // ✅ add full name (if your register.html has it)
  const fullName = (document.getElementById("fullname")?.value || "").trim();

  const username = document.getElementById("username").value.trim();
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm  = document.getElementById("confirm").value;

  let hasError = false;

  const usernameRegex = /^[a-zA-Z0-9._]+$/;
  if (!usernameRegex.test(username)) {
    showError("username", "Username can only contain letters, numbers, dots, and underscores.");
    hasError = true;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showError("email", "Please enter a valid email address.");
    hasError = true;
  }

  const pwdRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
  if (!pwdRegex.test(password)) {
    showError("password", "Password must be ≥8 characters, include a number & a special character.");
    hasError = true;
  }

  if (password !== confirm) {
    showError("confirm", "Passwords do not match.");
    hasError = true;
  }

  // Optional full name validation (only if field exists)
  if (document.getElementById("fullname") && !fullName) {
    showError("fullname", "Full name is required.");
    hasError = true;
  }

  if (hasError) return;

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // ✅ trigger reads these
        data: { username, full_name: fullName }
      }
    });

    if (error) throw error;

    window.location.replace("login.html");
  } catch (err) {
    showError("email", err?.message || "Registration failed.");
  }
});
