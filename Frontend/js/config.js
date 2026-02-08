// API base URL — when Frontend is on :5501 and Backend on :5000, set this so /api/* hits the Backend.
if (typeof window !== "undefined" && !window.API_BASE) {
  window.API_BASE = "http://localhost:5000";
}
