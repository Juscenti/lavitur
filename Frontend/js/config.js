// Set API_BASE if your backend runs on a different origin (e.g. Backend on :5000, Frontend on :5500).
// Leave unset for same-origin (e.g. when serving Frontend from the same host as the API).
if (typeof window !== "undefined" && !window.API_BASE) {
  // window.API_BASE = "http://localhost:5000";
}
