import {
  uploadProductMedia,
  listProductMedia,
  publicMediaUrl,
  deleteProductMedia,
  setPrimaryMedia,
} from "./productMedia.js";

/**
 * Local preview before upload (CREATE mode) or while uploading (EDIT mode).
 * Uses FileReader (safe) instead of URL.createObjectURL.
 */
export function renderLocalSelectedMedia(files) {
  const grid = document.getElementById("productMediaGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!files || !files.length) {
    grid.innerHTML = `<div style="opacity:.7;">No media selected.</div>`;
    return;
  }

  for (const file of files) {
    const card = document.createElement("div");
    card.className = "media-card";

    const isVideo = file.type.startsWith("video/");
    const nameLine = `<div style="margin-top:6px;font-size:12px;opacity:.8;">${file.name}</div>`;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result;
      card.innerHTML = isVideo
        ? `<video src="${src}" controls></video>${nameLine}`
        : `<img src="${src}" alt="selected media" />${nameLine}`;
    };
    reader.onerror = () => {
      card.innerHTML = `<div style="opacity:.7;">Preview failed: ${file.name}</div>`;
    };

    reader.readAsDataURL(file);
    grid.appendChild(card);
  }
}

export async function renderMediaGrid(productId) {
  const grid = document.getElementById("productMediaGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!productId) {
    grid.innerHTML = `<div style="opacity:.7;">Select images now, then click Save to upload them.</div>`;
    return;
  }

  const media = await listProductMedia(productId);

  if (!media?.length) {
    grid.innerHTML = `<div style="opacity:.7;">No uploaded media yet.</div>`;
    return;
  }

  for (const m of media) {
    const card = document.createElement("div");
    card.className = "media-card";

    const url = m.public_url || publicMediaUrl(m.file_path);

    const preview =
      m.media_type === "video"
        ? `<video src="${url}" controls></video>`
        : `<img src="${url}" alt="product media" />`;

    card.innerHTML = `
      ${preview}
      <div class="media-actions">
        <button class="primary">${m.is_primary ? "Primary ✓" : "Set Primary"}</button>
        <button class="delete">Delete</button>
      </div>
    `;

    card.querySelector(".delete").onclick = async () => {
      await deleteProductMedia(m);
      await renderMediaGrid(productId);
    };

    card.querySelector(".primary").onclick = async () => {
      await setPrimaryMedia(productId, m.id);
      await renderMediaGrid(productId);
    };

    grid.appendChild(card);
  }
}

/**
 * EDIT MODE: show preview immediately, upload, then show stored media list
 */
export function bindMediaInputForExistingProduct(productId) {
  const input = document.getElementById("productMediaInput");
  if (!input) return;

  input.onchange = async () => {
    const files = [...(input.files || [])];
    if (!files.length) return;

    // preview immediately
    renderLocalSelectedMedia(files);

    await uploadProductMedia(productId, files);
    input.value = "";
    await renderMediaGrid(productId);
  };
}
