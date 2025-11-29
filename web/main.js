// ═══════════════════════════════════════════════════════════
// HISTOPATH AI - Main Application Logic
// Supports both individual files and folder (slide-level) uploads
// ═══════════════════════════════════════════════════════════

const API_URL = "/predict";

// DOM Elements
const form = document.getElementById("uploadForm");
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("imageInput");
const folderInput = document.getElementById("folderInput");
const previewSection = document.getElementById("previewSection");
const previewGrid = document.getElementById("preview");
const resultsContainer = document.getElementById("results");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingBar = document.getElementById("loadingBar");
const loadingText = document.getElementById("loadingText");
const loadingSubtext = document.getElementById("loadingSubtext");
const clearBtn = document.getElementById("clearBtn");
const submitBtn = document.getElementById("submitBtn");
const submitBtnText = document.getElementById("submitBtnText");
const exportBtn = document.getElementById("exportBtn");

// Queue elements
const slidesQueue = document.getElementById("slidesQueue");
const queueList = document.getElementById("queueList");
const clearQueueBtn = document.getElementById("clearQueueBtn");
const totalSlidesEl = document.getElementById("totalSlides");
const totalPatchesEl = document.getElementById("totalPatches");
const slideIdRow = document.getElementById("slideIdRow");

// Mode toggle elements
const filesModeBtn = document.getElementById("filesModeBtn");
const folderModeBtn = document.getElementById("folderModeBtn");
const dropzoneText = document.getElementById("dropzoneText");
const dropzoneSubtext = document.getElementById("dropzoneSubtext");
const dropzoneIcon = document.getElementById("dropzoneIcon");

// State
let uploadMode = "files"; // "files" or "folder"
let selectedFiles = [];
let slidesData = []; // Array of { slideId, files }
let allResults = []; // Store all results for export

// ═══════════════════════════════════════════════════════════
// UPLOAD MODE TOGGLE
// ═══════════════════════════════════════════════════════════

filesModeBtn.addEventListener("click", () => switchMode("files"));
folderModeBtn.addEventListener("click", () => switchMode("folder"));

function switchMode(mode) {
  uploadMode = mode;
  
  // Update button states
  filesModeBtn.classList.toggle("active", mode === "files");
  folderModeBtn.classList.toggle("active", mode === "folder");
  
  // Update dropzone UI
  if (mode === "folder") {
    dropzoneText.textContent = "Drag & drop a slide folder";
    dropzoneSubtext.textContent = "or click to browse folders";
    dropzoneIcon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    `;
    slideIdRow.style.display = "none";
    previewSection.classList.remove("active");
    slidesQueue.classList.toggle("active", slidesData.length > 0);
  } else {
    dropzoneText.textContent = "Drag & drop histopathology images";
    dropzoneSubtext.textContent = "or click to browse files";
    dropzoneIcon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17,8 12,3 7,8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    `;
    slideIdRow.style.display = "block";
    slidesQueue.classList.remove("active");
    previewSection.classList.toggle("active", selectedFiles.length > 0);
  }
  
  updateSubmitButton();
}

// ═══════════════════════════════════════════════════════════
// DROPZONE FUNCTIONALITY
// ═══════════════════════════════════════════════════════════

dropzone.addEventListener("click", () => {
  if (uploadMode === "folder") {
    folderInput.click();
  } else {
    fileInput.click();
  }
});

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
  
  const items = e.dataTransfer.items;
  
  if (uploadMode === "folder") {
    // Handle folder drop
    handleFolderDrop(items);
  } else {
    // Handle files drop
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    addFiles(files);
  }
});

// File input change
fileInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  addFiles(files);
});

// Folder input change
folderInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
  if (files.length > 0) {
    // Extract folder name from the path
    const firstFile = files[0];
    const pathParts = firstFile.webkitRelativePath.split("/");
    const folderName = pathParts[0];
    
    addSlide(folderName, files);
  }
});

// Handle folder drop with DataTransferItemList
async function handleFolderDrop(items) {
  const folders = new Map();
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === "file") {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        await traverseFileTree(entry, "", folders);
      }
    }
  }
  
  // Add each folder as a slide
  folders.forEach((files, folderName) => {
    if (files.length > 0) {
      addSlide(folderName, files);
    }
  });
}

// Recursively traverse folder structure
async function traverseFileTree(entry, path, folders) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file) => {
        if (file.type.startsWith("image/")) {
          const folderName = path.split("/")[0] || entry.name;
          if (!folders.has(folderName)) {
            folders.set(folderName, []);
          }
          folders.get(folderName).push(file);
        }
        resolve();
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      reader.readEntries(async (entries) => {
        const newPath = path ? `${path}/${entry.name}` : entry.name;
        for (const subEntry of entries) {
          await traverseFileTree(subEntry, newPath, folders);
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// ═══════════════════════════════════════════════════════════
// FILE HANDLING (Individual Files Mode)
// ═══════════════════════════════════════════════════════════

function addFiles(files) {
  selectedFiles = [...selectedFiles, ...files];
  updatePreview();
  updateSubmitButton();
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  updatePreview();
  updateSubmitButton();
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
      item.querySelector(".remove-btn").addEventListener("click", () => removeFile(index));
    };
    reader.readAsDataURL(file);
  });
}

clearBtn.addEventListener("click", () => {
  selectedFiles = [];
  fileInput.value = "";
  updatePreview();
  updateSubmitButton();
});

// ═══════════════════════════════════════════════════════════
// SLIDE QUEUE HANDLING (Folder Mode)
// ═══════════════════════════════════════════════════════════

function addSlide(slideId, files) {
  // Check if slide already exists
  const existingIndex = slidesData.findIndex(s => s.slideId === slideId);
  if (existingIndex !== -1) {
    // Add files to existing slide
    slidesData[existingIndex].files = [...slidesData[existingIndex].files, ...files];
  } else {
    slidesData.push({ slideId, files });
  }
  
  updateQueueUI();
  updateSubmitButton();
}

function removeSlide(index) {
  slidesData.splice(index, 1);
  updateQueueUI();
  updateSubmitButton();
}

function updateQueueUI() {
  slidesQueue.classList.toggle("active", slidesData.length > 0);
  
  queueList.innerHTML = slidesData.map((slide, index) => `
    <div class="queue-item">
      <div class="queue-item-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div class="queue-item-info">
        <div class="queue-item-name">${slide.slideId}</div>
        <div class="queue-item-count">${slide.files.length} patches</div>
      </div>
      <button type="button" class="queue-item-remove" data-index="${index}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `).join("");
  
  // Add remove listeners
  queueList.querySelectorAll(".queue-item-remove").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index);
      removeSlide(index);
    });
  });
  
  // Update summary
  const totalPatches = slidesData.reduce((sum, s) => sum + s.files.length, 0);
  totalSlidesEl.textContent = `${slidesData.length} slide${slidesData.length !== 1 ? "s" : ""}`;
  totalPatchesEl.textContent = `${totalPatches} patch${totalPatches !== 1 ? "es" : ""}`;
}

clearQueueBtn.addEventListener("click", () => {
  slidesData = [];
  folderInput.value = "";
  updateQueueUI();
  updateSubmitButton();
});

function updateSubmitButton() {
  if (uploadMode === "folder") {
    const totalPatches = slidesData.reduce((sum, s) => sum + s.files.length, 0);
    submitBtnText.textContent = slidesData.length > 0 
      ? `Analyze ${slidesData.length} Slide${slidesData.length !== 1 ? "s" : ""} (${totalPatches} patches)`
      : "Run Analysis";
  } else {
    submitBtnText.textContent = selectedFiles.length > 0 
      ? `Analyze ${selectedFiles.length} Image${selectedFiles.length !== 1 ? "s" : ""}`
      : "Run Analysis";
  }
}

// ═══════════════════════════════════════════════════════════
// FORM SUBMISSION
// ═══════════════════════════════════════════════════════════

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (uploadMode === "folder") {
    await analyzeSlides();
  } else {
    await analyzeFiles();
  }
});

async function analyzeFiles() {
  if (selectedFiles.length === 0) {
    showError("Please select at least one image to analyze.");
    return;
  }

  const slideId = document.getElementById("slideId").value || "Unnamed Slide";
  
  showLoading("Analyzing tissue samples...", "");
  simulateProgress();

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
    allResults = [data];
    displayResults([data]);
  } catch (err) {
    hideLoading();
    showError(`Analysis failed: ${err.message}`);
  }
}

async function analyzeSlides() {
  if (slidesData.length === 0) {
    showError("Please add at least one slide folder to analyze.");
    return;
  }

  showLoading("Preparing batch analysis...", `0 / ${slidesData.length} slides`);
  
  allResults = [];
  let completed = 0;
  
  for (const slide of slidesData) {
    loadingSubtext.textContent = `Processing: ${slide.slideId}`;
    loadingBar.style.width = `${(completed / slidesData.length) * 100}%`;
    
    const formData = new FormData();
    slide.files.forEach(file => formData.append("files", file));
    formData.append("slide_id", slide.slideId);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error(`Failed to analyze ${slide.slideId}`);

      const data = await response.json();
      allResults.push(data);
    } catch (err) {
      allResults.push({
        slide_id: slide.slideId,
        error: err.message,
        num_patches: slide.files.length,
        patch_predictions: []
      });
    }
    
    completed++;
    loadingBar.style.width = `${(completed / slidesData.length) * 100}%`;
  }
  
  hideLoading();
  displayResults(allResults);
}

// ═══════════════════════════════════════════════════════════
// RESULTS DISPLAY
// ═══════════════════════════════════════════════════════════

function displayResults(resultsArray) {
  if (resultsArray.length === 0) {
    showError("No results to display.");
    return;
  }
  
  // Calculate totals
  let totalPatches = 0;
  let totalBenign = 0;
  let totalMalignant = 0;
  
  resultsArray.forEach(data => {
    const predictions = data.patch_predictions || [];
    totalPatches += predictions.length;
    totalBenign += predictions.filter(p => p.prediction === "benign").length;
    totalMalignant += predictions.filter(p => p.prediction === "malignant").length;
  });
  
  const malignantPercent = totalPatches > 0 ? ((totalMalignant / totalPatches) * 100).toFixed(1) : 0;
  
  // Build HTML
  let html = `
    <div class="results-overview">
      <h3>Analysis Summary</h3>
      <div class="overview-stats">
        <div class="overview-stat">
          <div class="stat-value total">${resultsArray.length}</div>
          <div class="stat-label">Slides</div>
        </div>
        <div class="overview-stat">
          <div class="stat-value">${totalPatches}</div>
          <div class="stat-label">Patches</div>
        </div>
        <div class="overview-stat">
          <div class="stat-value benign">${totalBenign}</div>
          <div class="stat-label">Benign</div>
        </div>
        <div class="overview-stat">
          <div class="stat-value malignant">${totalMalignant}</div>
          <div class="stat-label">Malignant</div>
        </div>
      </div>
      
      <div class="risk-indicator ${malignantPercent > 50 ? 'high' : malignantPercent > 20 ? 'medium' : 'low'}">
        <div class="risk-bar">
          <div class="risk-fill" style="width: ${malignantPercent}%"></div>
        </div>
        <span class="risk-label">${malignantPercent}% Malignant Detection Rate</span>
      </div>
    </div>
    
    <div class="slides-results">
  `;
  
  resultsArray.forEach((data, index) => {
    const predictions = data.patch_predictions || [];
    const benign = predictions.filter(p => p.prediction === "benign").length;
    const malignant = predictions.filter(p => p.prediction === "malignant").length;
    const slidePercent = predictions.length > 0 ? ((malignant / predictions.length) * 100).toFixed(1) : 0;
    
    html += `
      <div class="slide-result ${data.error ? 'error' : ''}" data-index="${index}">
        <div class="slide-result-header" onclick="toggleSlideDetails(${index})">
          <div class="slide-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="folder-icon">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <div>
              <div class="slide-name">${data.slide_id}</div>
              <div class="slide-meta">${data.num_patches} patches • ${slidePercent}% malignant</div>
            </div>
          </div>
          <div class="slide-badges">
            <span class="badge benign">${benign} B</span>
            <span class="badge malignant">${malignant} M</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </div>
        </div>
        <div class="slide-details" id="slideDetails${index}">
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
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  
  resultsContainer.innerHTML = html;
  
  // Show export button
  exportBtn.style.display = "flex";
  
  // Animate
  const slideResults = resultsContainer.querySelectorAll(".slide-result");
  slideResults.forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(10px)";
    setTimeout(() => {
      card.style.transition = "all 0.3s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, i * 100);
  });
}

// Toggle slide details
window.toggleSlideDetails = function(index) {
  const details = document.getElementById(`slideDetails${index}`);
  const parent = details.parentElement;
  parent.classList.toggle("expanded");
};

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
// EXPORT FUNCTIONALITY
// ═══════════════════════════════════════════════════════════

exportBtn.addEventListener("click", () => {
  if (allResults.length === 0) return;
  
  // Create CSV
  let csv = "Slide ID,Filename,Prediction\n";
  allResults.forEach(slide => {
    (slide.patch_predictions || []).forEach(p => {
      csv += `"${slide.slide_id}","${p.filename}","${p.prediction}"\n`;
    });
  });
  
  // Download
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `histopath_results_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// ═══════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════

function showLoading(text, subtext) {
  loadingOverlay.classList.add("active");
  loadingText.textContent = text;
  loadingSubtext.textContent = subtext;
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

// Initialize
checkApiStatus();
updateSubmitButton();
