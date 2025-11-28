const form = document.getElementById("uploadForm");
const resultsDiv = document.getElementById("results");
const previewDiv = document.getElementById("preview");

// Change this to your backend URL when deployed
const API_URL = "http://localhost:8000/predict";

// Preview selected images
document.getElementById("imageInput").addEventListener("change", (event) => {
  previewDiv.innerHTML = "";
  const files = event.target.files;
  for (let file of files) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target.result;
      previewDiv.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});

// Handle form submit
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  resultsDiv.innerHTML = "⏳ Processing...";

  const files = document.getElementById("imageInput").files;
  const slideId = document.getElementById("slideId").value;

  if (files.length === 0) {
    resultsDiv.innerHTML = "⚠️ Please select at least one image.";
    return;
  }

  const formData = new FormData();
  for (let file of files) {
    formData.append("files", file);
  }
  formData.append("slide_id", slideId || "unknown_slide");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    resultsDiv.innerHTML = "";

    // Single prediction
    if (data.prediction) {
      const card = document.createElement("div");
      card.className = "result-card";
      card.innerHTML = `<strong>${data.filename}</strong>: ${data.prediction}`;
      resultsDiv.appendChild(card);
    }
    // Multiple predictions grouped by slide
    else if (data.patch_predictions) {
      const header = document.createElement("h3");
      header.textContent = `Slide: ${data.slide_id} (${data.num_patches} patches)`;
      resultsDiv.appendChild(header);

      data.patch_predictions.forEach(patch => {
        const card = document.createElement("div");
        card.className = "result-card";
        card.innerHTML = `<strong>${patch.filename}</strong>: ${patch.prediction}`;
        resultsDiv.appendChild(card);
      });
    }
  } catch (err) {
    resultsDiv.innerHTML = `❌ Error: ${err.message}`;
  }
});
