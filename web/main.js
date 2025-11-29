// ═══════════════════════════════════════════════════════════
// HISTOPATH AI - Main Application Logic
// ═══════════════════════════════════════════════════════════

// Use relative URL - works on both localhost and production
const API_URL = "/predict";

// DOM Elements
const form = document.getElementById("uploadForm");
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("imageInput");
const previewSection = document.getElementById("previewSection");
const previewGrid = document.getElementById("preview");
const resultsContainer = document.getElementById("results");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingBar = document.getElementById("loadingBar");
const clearBtn = document.getElementById("clearBtn");
const submitBtn = document.getElementById("submitBtn");

let selectedFiles = [];

// ═══════════════════════════════════════════════════════════
// DROPZONE FUNCTIONALITY
// ═══════════════════════════════════════════════════════════

dropzone.addEventListener("click", () => fileInput.click());

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
  addFiles(files);
});

fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  addFiles(files);
});

// ═══════════════════════════════════════════════════════════
// FILE HANDLING
// ═══════════════════════════════════════════════════════════

function addFiles(files) {
  selectedFiles = [...selectedFiles, ...files];
  updatePreview();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  updatePreview();
}

function updatePreview() {
  if (selectedFiles.length === 0) {
    previewSection.classList.remove("active");
    return;
  }

  previewSection.classList.add("active");
  previewGrid.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const item = document.createElement("div");
      item.className = "preview-item";
      item.innerHTML = `
        <img src="${e.target.result}" alt="${file.name}">
        <button type="button" class="remove-btn" data-index="${index}">×</button>
      `;
      previewGrid.appendChild(item);

      // Add remove listener
      item.querySelector(".remove-btn").addEventListener("click", () => removeFile(index));
    };
    reader.readAsDataURL(file);
  });
}

clearBtn.addEventListener("click", () => {
  selectedFiles = [];
  fileInput.value = "";
  updatePreview();
});

// ═══════════════════════════════════════════════════════════
// FORM SUBMISSION
// ═══════════════════════════════════════════════════════════

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (selectedFiles.length === 0) {
    showError("Please select at least one image to analyze.");
    return;
  }

  const slideId = document.getElementById("slideId").value || "Unnamed Slide";

  // Show loading
  showLoading();
  simulateProgress();

  // Prepare form data
  const formData = new FormData();
  selectedFiles.forEach(file => formData.append("files", file));
  formData.append("slide_id", slideId);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Server error");

    const data = await response.json();
    hideLoading();
    displayResults(data);
  } catch (err) {
    hideLoading();
    showError(`Analysis failed: ${err.message}`);
  }
});

// ═══════════════════════════════════════════════════════════
// RESULTS DISPLAY
// ═══════════════════════════════════════════════════════════

function displayResults(data) {
  const predictions = data.patch_predictions || [];
  const benignCount = predictions.filter(p => p.prediction === "benign").length;
  const malignantCount = predictions.filter(p => p.prediction === "malignant").length;

  resultsContainer.innerHTML = `
    <div class="results-header">
      <div class="results-title">
        <h3>Analysis Complete</h3>
        <span class="slide-badge">${data.slide_id}</span>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value total">${data.num_patches}</div>
          <div class="stat-label">Total Patches</div>
        </div>
        <div class="stat-card">
          <div class="stat-value benign">${benignCount}</div>
          <div class="stat-label">Benign</div>
        </div>
        <div class="stat-card">
          <div class="stat-value malignant">${malignantCount}</div>
          <div class="stat-label">Malignant</div>
        </div>
      </div>
    </div>
    
    <div class="predictions-list">
      ${predictions.map(p => `
        <div class="prediction-card ${p.prediction}">
          <div class="prediction-icon">${p.prediction === "benign" ? "✓" : "⚠"}</div>
          <div class="prediction-info">
            <div class="prediction-filename">${p.filename}</div>
            <div class="prediction-result">${p.prediction}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;

  // Animate cards
  const cards = resultsContainer.querySelectorAll(".prediction-card");
  cards.forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateX(-20px)";
    setTimeout(() => {
      card.style.transition = "all 0.3s ease";
      card.style.opacity = "1";
      card.style.transform = "translateX(0)";
    }, i * 50);
  });
}

function showError(message) {
  resultsContainer.innerHTML = `
    <div class="empty-state" style="color: var(--danger);">
      <div class="empty-icon" style="background: var(--danger-bg);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--danger);">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <p>${message}</p>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════

function showLoading() {
  loadingOverlay.classList.add("active");
  loadingBar.style.width = "0%";
  submitBtn.disabled = true;
}

function hideLoading() {
  loadingBar.style.width = "100%";
  setTimeout(() => {
    loadingOverlay.classList.remove("active");
    submitBtn.disabled = false;
  }, 300);
}

function simulateProgress() {
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 90) {
      clearInterval(interval);
      progress = 90;
    }
    loadingBar.style.width = `${progress}%`;
  }, 200);
}

// ═══════════════════════════════════════════════════════════
// API STATUS CHECK
// ═══════════════════════════════════════════════════════════

async function checkApiStatus() {
  const statusEl = document.getElementById("apiStatus");
  try {
    const response = await fetch("/health");
    if (response.ok) {
      statusEl.innerHTML = `<span class="status-dot"></span><span>API Connected</span>`;
      statusEl.style.background = "var(--success-bg)";
      statusEl.style.borderColor = "rgba(16, 185, 129, 0.2)";
      statusEl.style.color = "var(--success)";
    } else {
      throw new Error();
    }
  } catch {
    statusEl.innerHTML = `<span class="status-dot" style="background: var(--danger)"></span><span>API Offline</span>`;
    statusEl.style.background = "var(--danger-bg)";
    statusEl.style.borderColor = "rgba(239, 68, 68, 0.2)";
    statusEl.style.color = "var(--danger)";
  }
}

// Check API status on load
checkApiStatus();
