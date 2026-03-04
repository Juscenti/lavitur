// Frontend/js/settings.js — Settings Page (Security, Preferences, Account Management)
import { supabase } from "./supabaseClient.js";
import { api } from "./api.js";

// ============ Helper Functions ============

async function requireSessionOrRedirect() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session || null;
  if (!session) {
    window.location.replace("login.html");
    return null;
  }
  return session;
}

function showMessage(elementId, message, type = "success") {
  const messageEl = document.getElementById(elementId);
  if (!messageEl) return;
  messageEl.textContent = message;
  messageEl.className = `form-message show ${type}`;
  setTimeout(() => {
    messageEl.classList.remove("show");
  }, 4000);
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function showModal(title, message, onConfirm) {
  const modal = document.getElementById("confirmation-modal");
  if (!modal) return;
  
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-message").textContent = message;
  modal.classList.add("show");
  
  // Clear any previous event listeners
  const confirmBtn = document.getElementById("modal-confirm");
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  
  const newConfirmBtnRef = document.getElementById("modal-confirm");
  newConfirmBtnRef.addEventListener("click", () => {
    modal.classList.remove("show");
    onConfirm();
  });
}

function closeModal() {
  const modal = document.getElementById("confirmation-modal");
  if (modal) modal.classList.remove("show");
}

function validatePassword(password) {
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return password.length >= 8 && hasUpper && hasLower && hasNumber;
}

function calculatePasswordStrength(password) {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  return strength;
}

// ============ Verify Current Password ============

async function verifyCurrentPassword(password) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      throw new Error("No active session or email not found");
    }
    
    // Attempt to re-authenticate with current credentials
    const { error } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: password
    });
    
    if (error) {
      throw new Error("Current password is incorrect");
    }
    
    return true;
  } catch (err) {
    throw new Error(err.message || "Failed to verify password");
  }
}

// ============ Security Form Handler ============

async function setupSecurityForm() {
  const form = document.getElementById("security-form");
  if (!form) return;

  const passwordInput = document.getElementById("new-password");
  const strengthBar = document.getElementById("password-strength");
  const resetBtn = document.getElementById("reset-security-btn");

  // Show password strength on input
  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const strength = calculatePasswordStrength(passwordInput.value);
      if (passwordInput.value) {
        strengthBar.style.display = "block";
        const fill = document.getElementById("strength-fill");
        const text = document.getElementById("strength-text");
        
        fill.className = "strength-fill";
        if (strength <= 2) {
          fill.classList.add("weak");
          text.textContent = "Weak";
        } else if (strength <= 3) {
          fill.classList.add("medium");
          text.textContent = "Medium";
        } else {
          fill.classList.add("strong");
          text.textContent = "Strong";
        }
      } else {
        strengthBar.style.display = "none";
      }
    });
  }

  // Reset button handler
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      form.reset();
      strengthBar.style.display = "none";
      showMessage("security-message", "", "success");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const submitBtn = form.querySelector("button[type='submit']");

    try {
      // Validation checks
      if (!currentPassword) {
        showMessage("security-message", "Please enter your current password.", "error");
        return;
      }

      if (!newPassword || !confirmPassword) {
        showMessage("security-message", "Please enter and confirm a new password.", "error");
        return;
      }

      if (newPassword !== confirmPassword) {
        showMessage("security-message", "New passwords do not match.", "error");
        return;
      }

      if (!validatePassword(newPassword)) {
        showMessage("security-message", "Password must be at least 8 characters with uppercase, lowercase, and numbers.", "error");
        return;
      }

      if (newPassword === currentPassword) {
        showMessage("security-message", "New password must be different from current password.", "error");
        return;
      }

      submitBtn.disabled = true;
      showMessage("security-message", "Verifying current password...", "");

      // CRITICAL: Verify current password before allowing change
      await verifyCurrentPassword(currentPassword);
      
      showMessage("security-message", "Updating password...", "");

      // Update password if verification succeeds
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        throw error;
      }

      showMessage("security-message", "Password updated successfully!", "success");
      showToast("Password changed securely", "success");
      form.reset();
      strengthBar.style.display = "none";
      
    } catch (err) {
      const errorMessage = err?.message || "Failed to update password";
      showMessage("security-message", errorMessage, "error");
      showToast(errorMessage, "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      showModal(
        "Sign Out",
        "Are you sure you want to sign out?",
        async () => {
          try {
            await supabase.auth.signOut();
            showToast("Signed out successfully", "success");
            setTimeout(() => {
              window.location.replace("login.html");
            }, 500);
          } catch (err) {
            console.error("Logout error:", err);
            showToast("Error signing out", "error");
          }
        }
      );
    });
  }
}

// ============ Preferences Form Handler ============

async function setupPreferencesForm() {
  const form = document.getElementById("preferences-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type='submit']");
    
    const preferences = {
      email_notifications: document.getElementById("email-notifications").checked,
      sms_notifications: document.getElementById("sms-notifications").checked,
      marketing_emails: document.getElementById("marketing-emails").checked,
      theme: document.getElementById("theme-preference").value
    };

    try {
      submitBtn.disabled = true;

      // Save to localStorage
      localStorage.setItem("user_preferences", JSON.stringify(preferences));
      
      showMessage("preferences-message", "Preferences saved successfully!", "success");
      showToast("Preferences saved", "success");
      
    } catch (err) {
      showMessage("preferences-message", "Failed to save preferences.", "error");
      showToast("Error saving preferences", "error");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // Load saved preferences on page load
  try {
    const saved = localStorage.getItem("user_preferences");
    if (saved) {
      const prefs = JSON.parse(saved);
      document.getElementById("email-notifications").checked = prefs.email_notifications || false;
      document.getElementById("sms-notifications").checked = prefs.sms_notifications || false;
      document.getElementById("marketing-emails").checked = prefs.marketing_emails || false;
      document.getElementById("theme-preference").value = prefs.theme || "light";
    }
  } catch (err) {
    console.error("Failed to load preferences:", err);
  }
}

// ============ Account Actions ============

async function setupAccountActions() {
  const downloadBtn = document.getElementById("download-data-btn");
  const deleteBtn = document.getElementById("delete-account-btn");
  const modal = document.getElementById("confirmation-modal");
  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalClose = document.getElementById("modal-close");
  const modalCancel = document.getElementById("modal-cancel");

  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      showToast("Data download initiated. Check your email for the download link.", "info");
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      showModal(
        "Delete Account",
        "Permanently delete your account and all associated data. This action cannot be undone. Please contact support for assistance.",
        async () => {
          showToast("Please contact support to complete account deletion", "info");
          // window.open("mailto:support@lavitur.com?subject=Account Deletion Request");
        }
      );
    });
  }

  // Setup modal backdrop and close button
  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", closeModal);
  }

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (modalCancel) {
    modalCancel.addEventListener("click", closeModal);
  }
}

// ============ Initialize ============

document.addEventListener("DOMContentLoaded", async () => {
  await requireSessionOrRedirect();
  setupSecurityForm();
  setupPreferencesForm();
  setupAccountActions();
});

// Close modal on escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
