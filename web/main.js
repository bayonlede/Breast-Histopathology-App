// ═══════════════════════════════════════════════════════════
// HISTOPATH AI - Enhanced Application
// Professional Breast Cancer Detection Interface
// ═══════════════════════════════════════════════════════════

const API_URL = "/predict";

// ═══════════════════════════════════════════════════════════
// DOM ELEMENTS
// ═══════════════════════════════════════════════════════════

const elements = {
  // Forms & Inputs
  form: document.getElementById("uploadForm"),
  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("imageInput"),
  folderInput: document.getElementById("folderInput"),
  slideIdInput: document.getElementById("slideId"),
  slideIdRow: document.getElementById("slideIdRow"),
  
  // Preview
  previewSection: document.getElementById("previewSection"),
  previewGrid: document.getElementById("preview"),
  previewCount: document.getElementById("previewCount"),
  clearBtn: document.getElementById("clearBtn"),
  
  // Queue
  slidesQueue: document.getElementById("slidesQueue"),
  queueList: document.getElementById("queueList"),
  clearQueueBtn: document.getElementById("clearQueueBtn"),
  totalSlides: document.getElementById("totalSlides"),
  totalPatches: document.getElementById("totalPatches"),
  
  // Results
  resultsContainer: document.getElementById("results"),
  resultsActions: document.getElementById("resultsActions"),
  
  // Buttons
  submitBtn: document.getElementById("submitBtn"),
  submitBtnText: document.getElementById("submitBtnText"),
  filesModeBtn: document.getElementById("filesModeBtn"),
  folderModeBtn: document.getElementById("folderModeBtn"),
  exportCsvBtn: document.getElementById("exportCsvBtn"),
  exportPdfBtn: document.getElementById("exportPdfBtn"),
  
  // Dropzone text
  dropzoneText: document.getElementById("dropzoneText"),
  dropzoneSubtext: document.getElementById("dropzoneSubtext"),
  dropzoneIcon: document.getElementById("dropzoneIcon"),
  
  // Loading
  loadingOverlay: document.getElementById("loadingOverlay"),
  loadingBar: document.getElementById("loadingBar"),
  loadingText: document.getElementById("loadingText"),
  loadingSubtext: document.getElementById("loadingSubtext"),
  
  // Status
  apiStatus: document.getElementById("apiStatus"),
  
  // Patient Info
  patientInfoToggle: document.getElementById("patientInfoToggle"),
  patientInfoForm: document.getElementById("patientInfoForm"),
  
  // Pages
  analysisPage: document.getElementById("analysisPage"),
  historyPage: document.getElementById("historyPage"),
  settingsPage: document.getElementById("settingsPage"),
  historyContainer: document.getElementById("historyContainer"),
  historyBadge: document.getElementById("historyBadge"),
  
  // Lightbox
  lightbox: document.getElementById("lightbox"),
  lightboxImage: document.getElementById("lightboxImage"),
  lightboxInfo: document.getElementById("lightboxInfo"),
  lightboxClose: document.getElementById("lightboxClose"),
  lightboxPrev: document.getElementById("lightboxPrev"),
  lightboxNext: document.getElementById("lightboxNext"),
  
  // Toast
  toastContainer: document.getElementById("toastContainer"),
  
  // Theme
  themeToggle: document.getElementById("themeToggle"),
  darkModeToggle: document.getElementById("darkModeToggle"),
  
  // Settings
  autoExpandToggle: document.getElementById("autoExpandToggle"),
  showConfidenceToggle: document.getElementById("showConfidenceToggle"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn")
};

// ═══════════════════════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════════════════════

const state = {
  uploadMode: "files",
  selectedFiles: [],
  slidesData: [],
  allResults: [],
  currentFilter: "all",
  lightboxImages: [],
  lightboxIndex: 0,
  settings: {
    darkMode: true,
    autoExpand: false,
    showConfidence: true
  }
};

// Load settings from localStorage
function loadSettings() {
  const saved = localStorage.getItem("histopath_settings");
  if (saved) {
    Object.assign(state.settings, JSON.parse(saved));
  }
  applySettings();
}

function saveSettings() {
  localStorage.setItem("histopath_settings", JSON.stringify(state.settings));
}

function applySettings() {
  document.documentElement.setAttribute("data-theme", state.settings.darkMode ? "dark" : "light");
  elements.darkModeToggle.checked = state.settings.darkMode;
  elements.autoExpandToggle.checked = state.settings.autoExpand;
  elements.showConfidenceToggle.checked = state.settings.showConfidence;
}

// ═══════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

function showToast(message, type = "info", duration = 3000) {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <span class="toast-message">${message}</span>
  `;
  
  elements.toastContainer.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => toast.classList.add("show"));
  
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(`${page}Page`).classList.add("active");
    
    if (page === "history") loadHistory();
  });
});

// ═══════════════════════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════════════════════

elements.themeToggle.addEventListener("click", () => {
  state.settings.darkMode = !state.settings.darkMode;
  applySettings();
  saveSettings();
});

elements.darkModeToggle.addEventListener("change", (e) => {
  state.settings.darkMode = e.target.checked;
  applySettings();
  saveSettings();
});

elements.autoExpandToggle?.addEventListener("change", (e) => {
  state.settings.autoExpand = e.target.checked;
  saveSettings();
});

elements.showConfidenceToggle?.addEventListener("change", (e) => {
  state.settings.showConfidence = e.target.checked;
  saveSettings();
});

// ═══════════════════════════════════════════════════════════
// PATIENT INFO TOGGLE
// ═══════════════════════════════════════════════════════════

elements.patientInfoToggle.addEventListener("click", () => {
  elements.patientInfoForm.classList.toggle("active");
  elements.patientInfoToggle.classList.toggle("active");
});

// ═══════════════════════════════════════════════════════════
// UPLOAD MODE TOGGLE
// ═══════════════════════════════════════════════════════════

elements.filesModeBtn.addEventListener("click", () => switchMode("files"));
elements.folderModeBtn.addEventListener("click", () => switchMode("folder"));

function switchMode(mode) {
  state.uploadMode = mode;
  
  elements.filesModeBtn.classList.toggle("active", mode === "files");
  elements.folderModeBtn.classList.toggle("active", mode === "folder");
  
  if (mode === "folder") {
    elements.dropzoneText.textContent = "Drag & drop a slide folder";
    elements.dropzoneSubtext.textContent = "or click to browse folders";
    elements.dropzoneIcon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    `;
    elements.slideIdRow.style.display = "none";
    elements.previewSection.classList.remove("active");
    elements.slidesQueue.classList.toggle("active", state.slidesData.length > 0);
  } else {
    elements.dropzoneText.textContent = "Drag & drop histopathology images";
    elements.dropzoneSubtext.textContent = "or click to browse files";
    elements.dropzoneIcon.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17,8 12,3 7,8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    `;
    elements.slideIdRow.style.display = "block";
    elements.slidesQueue.classList.remove("active");
    elements.previewSection.classList.toggle("active", state.selectedFiles.length > 0);
  }
  
  updateSubmitButton();
}

// ═══════════════════════════════════════════════════════════
// DROPZONE
// ═══════════════════════════════════════════════════════════

elements.dropzone.addEventListener("click", () => {
  if (state.uploadMode === "folder") {
    elements.folderInput.click();
  } else {
    elements.fileInput.click();
  }
});

elements.dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  elements.dropzone.classList.add("dragover");
});

elements.dropzone.addEventListener("dragleave", () => {
  elements.dropzone.classList.remove("dragover");
});

elements.dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  elements.dropzone.classList.remove("dragover");
  
  if (state.uploadMode === "folder") {
    handleFolderDrop(e.dataTransfer.items);
  } else {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    addFiles(files);
  }
});

elements.fileInput.addEventListener("change", (e) => {
  addFiles(Array.from(e.target.files));
});

elements.folderInput.addEventListener("change", (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith("image/"));
  if (files.length > 0) {
    const folderName = files[0].webkitRelativePath.split("/")[0];
    addSlide(folderName, files);
  }
});

async function handleFolderDrop(items) {
  const folders = new Map();
  
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry();
    if (entry) {
      await traverseFileTree(entry, "", folders);
    }
  }
  
  folders.forEach((files, name) => {
    if (files.length > 0) addSlide(name, files);
  });
}

async function traverseFileTree(entry, path, folders) {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file((file) => {
        if (file.type.startsWith("image/")) {
          const folderName = path.split("/")[0] || entry.name;
          if (!folders.has(folderName)) folders.set(folderName, []);
          folders.get(folderName).push(file);
        }
        resolve();
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      reader.readEntries(async (entries) => {
        const newPath = path ? `${path}/${entry.name}` : entry.name;
        for (const sub of entries) {
          await traverseFileTree(sub, newPath, folders);
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// ═══════════════════════════════════════════════════════════
// FILE HANDLING
// ═══════════════════════════════════════════════════════════

function addFiles(files) {
  state.selectedFiles = [...state.selectedFiles, ...files];
  updatePreview();
  updateSubmitButton();
  showToast(`Added ${files.length} image${files.length !== 1 ? 's' : ''}`, "success");
}

function removeFile(index) {
  state.selectedFiles.splice(index, 1);
  updatePreview();
  updateSubmitButton();
}

function updatePreview() {
  if (state.selectedFiles.length === 0) {
    elements.previewSection.classList.remove("active");
    return;
  }

  elements.previewSection.classList.add("active");
  elements.previewCount.textContent = state.selectedFiles.length;
  elements.previewGrid.innerHTML = "";

  state.selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const item = document.createElement("div");
      item.className = "preview-item";
      item.innerHTML = `
        <img src="${e.target.result}" alt="${file.name}" data-index="${index}">
        <div class="preview-overlay">
          <span class="preview-name">${file.name.length > 15 ? file.name.slice(0, 12) + '...' : file.name}</span>
        </div>
        <button type="button" class="remove-btn" data-index="${index}">×</button>
      `;
      elements.previewGrid.appendChild(item);
      
      item.querySelector(".remove-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        removeFile(index);
      });
      
      item.querySelector("img").addEventListener("click", () => {
        openLightbox(index, state.selectedFiles.map((f, i) => ({
          src: URL.createObjectURL(f),
          name: f.name,
          prediction: null
        })));
      });
    };
    reader.readAsDataURL(file);
  });
}

elements.clearBtn.addEventListener("click", () => {
  state.selectedFiles = [];
  elements.fileInput.value = "";
  updatePreview();
  updateSubmitButton();
  showToast("Cleared all images", "info");
});

// ═══════════════════════════════════════════════════════════
// SLIDE QUEUE
// ═══════════════════════════════════════════════════════════

function addSlide(slideId, files) {
  const existing = state.slidesData.findIndex(s => s.slideId === slideId);
  if (existing !== -1) {
    state.slidesData[existing].files = [...state.slidesData[existing].files, ...files];
  } else {
    state.slidesData.push({ slideId, files });
  }
  updateQueueUI();
  updateSubmitButton();
  showToast(`Added slide: ${slideId} (${files.length} patches)`, "success");
}

function removeSlide(index) {
  state.slidesData.splice(index, 1);
  updateQueueUI();
  updateSubmitButton();
}

function updateQueueUI() {
  elements.slidesQueue.classList.toggle("active", state.slidesData.length > 0);
  
  elements.queueList.innerHTML = state.slidesData.map((slide, index) => `
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
  
  elements.queueList.querySelectorAll(".queue-item-remove").forEach(btn => {
    btn.addEventListener("click", () => removeSlide(parseInt(btn.dataset.index)));
  });
  
  const totalPatches = state.slidesData.reduce((sum, s) => sum + s.files.length, 0);
  elements.totalSlides.textContent = `${state.slidesData.length} slide${state.slidesData.length !== 1 ? 's' : ''}`;
  elements.totalPatches.textContent = `${totalPatches} patch${totalPatches !== 1 ? 'es' : ''}`;
}

elements.clearQueueBtn.addEventListener("click", () => {
  state.slidesData = [];
  elements.folderInput.value = "";
  updateQueueUI();
  updateSubmitButton();
  showToast("Cleared all slides", "info");
});

function updateSubmitButton() {
  if (state.uploadMode === "folder") {
    const total = state.slidesData.reduce((sum, s) => sum + s.files.length, 0);
    elements.submitBtnText.textContent = state.slidesData.length > 0 
      ? `Analyze ${state.slidesData.length} Slide${state.slidesData.length !== 1 ? 's' : ''} (${total} patches)`
      : "Run Analysis";
  } else {
    elements.submitBtnText.textContent = state.selectedFiles.length > 0 
      ? `Analyze ${state.selectedFiles.length} Image${state.selectedFiles.length !== 1 ? 's' : ''}`
      : "Run Analysis";
  }
}

// ═══════════════════════════════════════════════════════════
// FORM SUBMISSION
// ═══════════════════════════════════════════════════════════

elements.form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (state.uploadMode === "folder") {
    await analyzeSlides();
  } else {
    await analyzeFiles();
  }
});

async function analyzeFiles() {
  if (state.selectedFiles.length === 0) {
    showToast("Please select at least one image", "warning");
    return;
  }

  const slideId = elements.slideIdInput.value || "Unnamed Slide";
  
  showLoading("Analyzing tissue samples...", "Preparing images...");

  const formData = new FormData();
  state.selectedFiles.forEach(file => formData.append("files", file));
  formData.append("slide_id", slideId);

  try {
    const response = await fetch(API_URL, { method: "POST", body: formData });
    if (!response.ok) throw new Error("Server error");

    const data = await response.json();
    hideLoading();
    state.allResults = [data];
    displayResults([data]);
    saveToHistory(data);
    showToast("Analysis complete!", "success");
  } catch (err) {
    hideLoading();
    showToast(`Analysis failed: ${err.message}`, "error");
  }
}

async function analyzeSlides() {
  if (state.slidesData.length === 0) {
    showToast("Please add at least one slide folder", "warning");
    return;
  }

  showLoading("Batch analysis...", `0 / ${state.slidesData.length} slides`);
  
  state.allResults = [];
  let completed = 0;
  
  for (const slide of state.slidesData) {
    elements.loadingSubtext.textContent = `Processing: ${slide.slideId}`;
    elements.loadingBar.style.width = `${(completed / state.slidesData.length) * 100}%`;
    
    const formData = new FormData();
    slide.files.forEach(file => formData.append("files", file));
    formData.append("slide_id", slide.slideId);

    try {
      const response = await fetch(API_URL, { method: "POST", body: formData });
      if (!response.ok) throw new Error(`Failed: ${slide.slideId}`);
      
      const data = await response.json();
      state.allResults.push(data);
      saveToHistory(data);
    } catch (err) {
      state.allResults.push({
        slide_id: slide.slideId,
        error: err.message,
        num_patches: slide.files.length,
        patch_predictions: []
      });
    }
    
    completed++;
    elements.loadingBar.style.width = `${(completed / state.slidesData.length) * 100}%`;
  }
  
  hideLoading();
  displayResults(state.allResults);
  showToast(`Completed analysis of ${state.slidesData.length} slides`, "success");
}

// ═══════════════════════════════════════════════════════════
// RESULTS DISPLAY
// ═══════════════════════════════════════════════════════════

function displayResults(resultsArray) {
  if (resultsArray.length === 0) return;
  
  let totalPatches = 0, totalBenign = 0, totalMalignant = 0, totalConfidence = 0;
  
  resultsArray.forEach(data => {
    const preds = data.patch_predictions || [];
    totalPatches += preds.length;
    totalBenign += preds.filter(p => p.prediction === "benign").length;
    totalMalignant += preds.filter(p => p.prediction === "malignant").length;
    totalConfidence += preds.reduce((sum, p) => sum + (p.confidence || 0), 0);
  });
  
  const malignantPercent = totalPatches > 0 ? ((totalMalignant / totalPatches) * 100).toFixed(1) : 0;
  const avgConfidence = totalPatches > 0 ? (totalConfidence / totalPatches).toFixed(1) : 0;
  const riskLevel = malignantPercent > 50 ? 'high' : malignantPercent > 20 ? 'medium' : 'low';
  
  // Get patient info
  const patientId = document.getElementById("patientId")?.value || "";
  const patientName = document.getElementById("patientName")?.value || "";
  
  let html = `
    <div class="results-overview">
      <div class="overview-header">
        <h3>Analysis Summary</h3>
        <span class="analysis-time">${new Date().toLocaleString()}</span>
      </div>
      
      ${patientId || patientName ? `
        <div class="patient-summary">
          ${patientId ? `<span><strong>ID:</strong> ${patientId}</span>` : ''}
          ${patientName ? `<span><strong>Patient:</strong> ${patientName}</span>` : ''}
        </div>
      ` : ''}
      
      <div class="overview-grid">
        <div class="donut-chart-container">
          <svg class="donut-chart" viewBox="0 0 100 100">
            <circle class="donut-ring" cx="50" cy="50" r="40"/>
            <circle class="donut-segment benign" cx="50" cy="50" r="40"
              stroke-dasharray="${(totalBenign / totalPatches) * 251.2} 251.2"
              stroke-dashoffset="0"/>
            <circle class="donut-segment malignant" cx="50" cy="50" r="40"
              stroke-dasharray="${(totalMalignant / totalPatches) * 251.2} 251.2"
              stroke-dashoffset="${-(totalBenign / totalPatches) * 251.2}"/>
          </svg>
          <div class="donut-center">
            <span class="donut-value">${totalPatches}</span>
            <span class="donut-label">Patches</span>
          </div>
        </div>
        
        <div class="overview-stats">
          <div class="stat-row">
            <div class="stat-item">
              <span class="stat-value total">${resultsArray.length}</span>
              <span class="stat-label">Slides</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${avgConfidence}%</span>
              <span class="stat-label">Avg Confidence</span>
            </div>
          </div>
          <div class="stat-row">
            <div class="stat-item benign">
              <span class="stat-value">${totalBenign}</span>
              <span class="stat-label">Benign</span>
            </div>
            <div class="stat-item malignant">
              <span class="stat-value">${totalMalignant}</span>
              <span class="stat-label">Malignant</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="risk-indicator ${riskLevel}">
        <div class="risk-header">
          <span class="risk-title">Malignancy Detection Rate</span>
          <span class="risk-value">${malignantPercent}%</span>
        </div>
        <div class="risk-bar">
          <div class="risk-fill" style="width: ${malignantPercent}%"></div>
        </div>
        <span class="risk-label">${riskLevel === 'high' ? '⚠️ High Risk - Recommend Further Review' : riskLevel === 'medium' ? '⚡ Moderate Risk' : '✓ Low Risk'}</span>
      </div>
    </div>
    
    <div class="results-search">
      <input type="text" id="resultsSearch" placeholder="Search by filename..." class="search-input">
    </div>
    
    <div class="slides-results" id="slidesResults">
  `;
  
  resultsArray.forEach((data, index) => {
    const preds = data.patch_predictions || [];
    const benign = preds.filter(p => p.prediction === "benign").length;
    const malignant = preds.filter(p => p.prediction === "malignant").length;
    const slidePercent = preds.length > 0 ? ((malignant / preds.length) * 100).toFixed(1) : 0;
    const slideAvgConf = preds.length > 0 ? (preds.reduce((s, p) => s + (p.confidence || 0), 0) / preds.length).toFixed(1) : 0;
    
    html += `
      <div class="slide-result ${state.settings.autoExpand ? 'expanded' : ''}" data-index="${index}">
        <div class="slide-result-header" onclick="toggleSlideDetails(${index})">
          <div class="slide-info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="folder-icon">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <div>
              <div class="slide-name">${data.slide_id}</div>
              <div class="slide-meta">${preds.length} patches • ${slidePercent}% malignant • ${slideAvgConf}% avg confidence</div>
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
          <div class="predictions-grid">
            ${preds.map((p, pIdx) => `
              <div class="prediction-card ${p.prediction}" data-prediction="${p.prediction}" data-filename="${p.filename.toLowerCase()}">
                <div class="prediction-header">
                  <span class="prediction-icon">${p.prediction === "benign" ? "✓" : "⚠"}</span>
                  <span class="prediction-badge ${p.prediction}">${p.prediction}</span>
                </div>
                <div class="prediction-filename" title="${p.filename}">${p.filename.length > 20 ? p.filename.slice(0, 17) + '...' : p.filename}</div>
                ${state.settings.showConfidence ? `
                  <div class="confidence-bar">
                    <div class="confidence-fill ${p.prediction}" style="width: ${p.confidence || 0}%"></div>
                  </div>
                  <span class="confidence-value">${p.confidence || 0}% confidence</span>
                ` : ''}
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  
  elements.resultsContainer.innerHTML = html;
  elements.resultsActions.style.display = "flex";
  
  // Search functionality
  document.getElementById("resultsSearch")?.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll(".prediction-card").forEach(card => {
      const filename = card.dataset.filename;
      card.style.display = filename.includes(query) ? "" : "none";
    });
  });
  
  // Setup filter buttons
  setupFilters();
  
  // Animate
  animateResults();
}

function setupFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const filter = btn.dataset.filter;
      document.querySelectorAll(".prediction-card").forEach(card => {
        if (filter === "all") {
          card.style.display = "";
        } else {
          card.style.display = card.dataset.prediction === filter ? "" : "none";
        }
      });
    });
  });
}

function animateResults() {
  document.querySelectorAll(".slide-result").forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    setTimeout(() => {
      card.style.transition = "all 0.4s ease";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, i * 100);
  });
}

window.toggleSlideDetails = function(index) {
  const parent = document.querySelector(`.slide-result[data-index="${index}"]`);
  parent.classList.toggle("expanded");
};

// ═══════════════════════════════════════════════════════════
// LIGHTBOX
// ═══════════════════════════════════════════════════════════

function openLightbox(index, images) {
  state.lightboxImages = images;
  state.lightboxIndex = index;
  updateLightbox();
  elements.lightbox.classList.add("active");
  document.body.style.overflow = "hidden";
}

function updateLightbox() {
  const img = state.lightboxImages[state.lightboxIndex];
  elements.lightboxImage.src = img.src;
  elements.lightboxInfo.innerHTML = `
    <span class="lightbox-filename">${img.name}</span>
    ${img.prediction ? `<span class="lightbox-prediction ${img.prediction}">${img.prediction}</span>` : ''}
  `;
}

elements.lightboxClose.addEventListener("click", () => {
  elements.lightbox.classList.remove("active");
  document.body.style.overflow = "";
});

elements.lightboxPrev.addEventListener("click", () => {
  state.lightboxIndex = (state.lightboxIndex - 1 + state.lightboxImages.length) % state.lightboxImages.length;
  updateLightbox();
});

elements.lightboxNext.addEventListener("click", () => {
  state.lightboxIndex = (state.lightboxIndex + 1) % state.lightboxImages.length;
  updateLightbox();
});

document.addEventListener("keydown", (e) => {
  if (!elements.lightbox.classList.contains("active")) return;
  if (e.key === "Escape") elements.lightboxClose.click();
  if (e.key === "ArrowLeft") elements.lightboxPrev.click();
  if (e.key === "ArrowRight") elements.lightboxNext.click();
});

// ═══════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════

elements.exportCsvBtn.addEventListener("click", exportCSV);
elements.exportPdfBtn.addEventListener("click", exportReport);

function exportCSV() {
  if (state.allResults.length === 0) return;
  
  let csv = "Slide ID,Filename,Prediction,Confidence\n";
  state.allResults.forEach(slide => {
    (slide.patch_predictions || []).forEach(p => {
      csv += `"${slide.slide_id}","${p.filename}","${p.prediction}","${p.confidence || ''}"\n`;
    });
  });
  
  downloadFile(csv, `histopath_results_${Date.now()}.csv`, "text/csv");
  showToast("CSV exported successfully", "success");
}

function exportReport() {
  if (state.allResults.length === 0) return;
  
  const patientId = document.getElementById("patientId")?.value || "N/A";
  const patientName = document.getElementById("patientName")?.value || "N/A";
  const patientAge = document.getElementById("patientAge")?.value || "N/A";
  const clinician = document.getElementById("clinician")?.value || "N/A";
  const notes = document.getElementById("clinicalNotes")?.value || "";
  
  let totalPatches = 0, totalBenign = 0, totalMalignant = 0;
  state.allResults.forEach(r => {
    const preds = r.patch_predictions || [];
    totalPatches += preds.length;
    totalBenign += preds.filter(p => p.prediction === "benign").length;
    totalMalignant += preds.filter(p => p.prediction === "malignant").length;
  });
  
  const report = `
HISTOPATH AI - ANALYSIS REPORT
================================
Generated: ${new Date().toLocaleString()}

PATIENT INFORMATION
-------------------
Patient ID: ${patientId}
Patient Name: ${patientName}
Age: ${patientAge}
Clinician: ${clinician}

ANALYSIS SUMMARY
----------------
Total Slides: ${state.allResults.length}
Total Patches: ${totalPatches}
Benign: ${totalBenign} (${((totalBenign/totalPatches)*100).toFixed(1)}%)
Malignant: ${totalMalignant} (${((totalMalignant/totalPatches)*100).toFixed(1)}%)

DETAILED RESULTS
----------------
${state.allResults.map(slide => {
  const preds = slide.patch_predictions || [];
  return `
Slide: ${slide.slide_id}
  Patches: ${preds.length}
  Benign: ${preds.filter(p => p.prediction === "benign").length}
  Malignant: ${preds.filter(p => p.prediction === "malignant").length}
  
  Predictions:
${preds.map(p => `    - ${p.filename}: ${p.prediction.toUpperCase()} (${p.confidence || 0}%)`).join('\n')}
`;
}).join('\n')}

CLINICAL NOTES
--------------
${notes || "No additional notes."}

================================
This report is generated by HistoPath AI.
For clinical use, please consult with a qualified pathologist.
`;
  
  downloadFile(report, `histopath_report_${Date.now()}.txt`, "text/plain");
  showToast("Report generated successfully", "success");
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ═══════════════════════════════════════════════════════════
// HISTORY
// ═══════════════════════════════════════════════════════════

function saveToHistory(data) {
  const history = JSON.parse(localStorage.getItem("histopath_history") || "[]");
  history.unshift({
    ...data,
    timestamp: Date.now(),
    patientId: document.getElementById("patientId")?.value || ""
  });
  // Keep only last 20
  localStorage.setItem("histopath_history", JSON.stringify(history.slice(0, 20)));
  updateHistoryBadge();
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem("histopath_history") || "[]");
  
  if (history.length === 0) {
    elements.historyContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
        </div>
        <p>No analysis history yet</p>
        <span>Your completed analyses will appear here</span>
      </div>
    `;
    return;
  }
  
  elements.historyContainer.innerHTML = `
    <div class="history-list">
      ${history.map((item, idx) => {
        const preds = item.patch_predictions || [];
        const benign = preds.filter(p => p.prediction === "benign").length;
        const malignant = preds.filter(p => p.prediction === "malignant").length;
        return `
          <div class="history-item" data-index="${idx}">
            <div class="history-icon ${malignant > benign ? 'danger' : 'success'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="history-info">
              <div class="history-title">${item.slide_id}</div>
              <div class="history-meta">
                ${item.patientId ? `Patient: ${item.patientId} • ` : ''}
                ${new Date(item.timestamp).toLocaleDateString()}
              </div>
            </div>
            <div class="history-stats">
              <span class="badge benign">${benign} B</span>
              <span class="badge malignant">${malignant} M</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function updateHistoryBadge() {
  const history = JSON.parse(localStorage.getItem("histopath_history") || "[]");
  elements.historyBadge.textContent = history.length;
  elements.historyBadge.style.display = history.length > 0 ? "" : "none";
}

elements.clearHistoryBtn?.addEventListener("click", () => {
  localStorage.removeItem("histopath_history");
  loadHistory();
  updateHistoryBadge();
  showToast("History cleared", "info");
});

// ═══════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════

function showLoading(text, subtext) {
  elements.loadingOverlay.classList.add("active");
  elements.loadingText.textContent = text;
  elements.loadingSubtext.textContent = subtext;
  elements.loadingBar.style.width = "0%";
  elements.submitBtn.disabled = true;
}

function hideLoading() {
  elements.loadingBar.style.width = "100%";
  setTimeout(() => {
    elements.loadingOverlay.classList.remove("active");
    elements.submitBtn.disabled = false;
  }, 300);
}

// ═══════════════════════════════════════════════════════════
// API STATUS
// ═══════════════════════════════════════════════════════════

async function checkApiStatus() {
  try {
    const response = await fetch("/health");
    if (response.ok) {
      elements.apiStatus.innerHTML = `<span class="status-dot"></span><span>API Connected</span>`;
      elements.apiStatus.className = "api-status success";
    } else {
      throw new Error();
    }
  } catch {
    elements.apiStatus.innerHTML = `<span class="status-dot"></span><span>API Offline</span>`;
    elements.apiStatus.className = "api-status error";
  }
}

// ═══════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════

loadSettings();
checkApiStatus();
updateSubmitButton();
updateHistoryBadge();

