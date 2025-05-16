const userSelections = {
  environment: null,
  plotType: null,
  plotContext: null,
  plotStyle: null,
  plotPalette: null,
  xAxisLabel: null,
  yAxisLabel: null,
  figureTitle: null,
  xAxisMin: 0,
  xAxisMax: null,
  yAxisMin: null,
  yAxisMax: 0,
  plotArgs: {},
};

// AbortController to work in tandem with Debounce for modifying plot args in step 4
let currentAbortController = null;

// Attach main event listeners
document.addEventListener("DOMContentLoaded", () => {
  PalettePreview();
  CSVUpload();
  ResetButton();
});

//---
// Input/ Output functions
//---

// Upload .csv file in Step 2
function CSVUpload() {
  document.getElementById('upload-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const uploadStatus = document.getElementById('upload-status');
    uploadStatus.textContent = 'Uploading...';

    const formData = new FormData(this);
    fetch('/upload_csv', {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        if (data.success) {
          uploadStatus.textContent = 'CSV uploaded successfully!';
          userSelections.dataFrame = data.original_filename;
          window.uploadedColumns = data.columns;
          populateColumnSelects(data.columns);
          enableNextStep();
        } else {
          uploadStatus.textContent = 'Upload failed: ' + (data.error || 'Unknown error');
        }
      })
      .catch(err => {
        uploadStatus.textContent = 'Upload failed: ' + err.message;
      });
  });
}

// Generates palette preview in Step 3, on changing palette name.
function PalettePreview() {
  const paletteSelect = document.getElementById("palette-select");
  paletteSelect.addEventListener("change", () => {
    const palette = paletteSelect.value;
    if (!palette) return;

    fetch("/palette_preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ palette })
    })
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        document.getElementById("palette-preview").src = url;
        document.getElementById("palette-preview-container").style.display = "block";
      })
      .catch(err => {
        console.error("Palette preview failed:", err);
      });
  });
}

// Show/Hide plot preview container on selection of plot type in Step 4
function updatePlotPreview() {
  // Show the plot preview only after plot type has been selected
  const plotType = document.getElementById('plot-select').value;

  if (plotType !== "default") {
    // Show the plot preview container if a valid plot type is selected
    document.getElementById('plot-preview-container').style.display = 'block';
  } else {
    // Hide the plot preview container if no plot type is selected
    document.getElementById('plot-preview-container').style.display = 'none';
  }
}

// Send selections to Flask to generate plot
function generatePlotPreview() {
  const plotType = userSelections.plotType;
  if (!plotType) return;

  // Abort any previous request only in Step 4
  if (currentAbortController) {
    currentAbortController.abort();
  }

  currentAbortController = new AbortController();

  userSelections.figureTitle = document.getElementById('figure-title').value;
  userSelections.xAxisLabel = document.getElementById('x-axis_label').value;
  userSelections.yAxisLabel = document.getElementById('y-axis_label').value;

  fetch("/generate_plot", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plotType: plotType,
      context: userSelections.plotContext,
      style: userSelections.plotStyle,
      palette: userSelections.plotPalette,
      plotArgs: userSelections.plotArgs,
      xAxisLabel: userSelections.xAxisLabel,
      yAxisLabel: userSelections.yAxisLabel,
      figureTitle: userSelections.figureTitle,
      xAxisMin: userSelections.xAxisMin,
      xAxisMax: userSelections.xAxisMax,
      yAxisMin: userSelections.yAxisMin,
      yAxisMax: userSelections.yAxisMax,
    }),
    signal: currentAbortController.signal
  })
    .then(res => {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.blob();
    })
    .then(imageBlob => {
      const imageURL = URL.createObjectURL(imageBlob);
      document.getElementById("plot-preview").src = imageURL;
      document.getElementById('plot-preview-container').style.display = 'block';
    })
    .catch(err => {
      if (err.name === 'AbortError') {
        console.log('🔁 Previous request aborted');
      } else {
        console.error("Plot generation failed:", err);
      }
    });
}

// Function to populate dropdown menus of column headings - Step 4
function populateColumnSelects(columns) {
  const columnSelects = document.querySelectorAll('.column-select');
  columnSelects.forEach(select => {
    select.innerHTML = '';
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select column';
    select.appendChild(defaultOption);

    columns.forEach(column => {
      const option = document.createElement('option');
      option.value = column;
      option.textContent = column;
      select.appendChild(option);
    });
  });
}

// Export code to .ipynb or .py - Step 6
function exportCode() {
  // Get the environment selected in Step 1
  const envSelect = document.getElementById("env-select");
  const selectedEnv = envSelect.value; // "jupyter", "vscode", or "colab"

  // Get the generated Python code
  const code = document.getElementById("code-preview").textContent;

  // Determine the file extension based on the selected environment
  let fileExtension = selectedEnv === "vscode" ? ".py" : ".ipynb";
  let filename = "generated_code" + fileExtension;

  // Prepare the data to send to the backend
  const data = {
    code: code,
    file_extension: fileExtension,
  };

  // Send the request to the backend to export the code
  fetch('/export_code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => response.blob())
  .then(blob => {
    // Create a link to download the file
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  })
  .catch(error => {
    console.error('Error exporting code:', error);
  });
}

// Update Code Preview
function updateCodePreview() {
  let code = "";

  if (!userSelections.environment) {
    document.getElementById("code-preview").textContent =
      "# Your generated Python code will appear here";
    return;
  }

  // ENVIRONMENT-DEPENDENT SETUP
  if (userSelections.environment === "colab") {
    code += "# Google Colab setup\n!pip install seaborn\n\n";
  } else{
        code += "# Imports\nimport matplotlib.pyplot as plt\nimport seaborn as sns\nimport pandas as pd\n\n# Override default params. Convert pdf font type to TrueType42 for publication.\nplt.rcParams['font.family'] = 'Arial'\nplt.rcParams['pdf.fonttype'] = 42\n\n";
  }

  // Import dataset
  if (userSelections.dataFrame) {
      code += `# Import Data\n`;
      code += `df = pd.read_csv('data/${userSelections.dataFrame}')\n\n`;
  }

  // ONLY add plot setup if context/style/palette are selected
  if (
    userSelections.plotContext &&
    userSelections.plotStyle &&
    userSelections.plotPalette
  ) {
      code += `# Set Seaborn theme\nsns.set_theme(context='${userSelections.plotContext}', style='${userSelections.plotStyle}', palette='${userSelections.plotPalette}')\n\n`;
  }

  // ONLY add plot command if selected
  if (userSelections.plotType === "bar") {
    code += "fig, ax = plt.subplots()\nax.bar";
  } else if (userSelections.plotType === "violin") {
      if (userSelections.plotArgs) {
        code += `# Plot Violin Plot\nfig, ax = plt.subplots(figsize=(6, 4), layout='constrained')\nsns.violinplot(x='${userSelections.plotArgs.x}', y='${userSelections.plotArgs.y}', hue='${userSelections.plotArgs.hue}', palette='${userSelections.plotPalette}', data=df, ax=ax)\n`;
      }
    code += 'sns.despine(offset=10, trim=True)\n\n';
  } else if (userSelections.plotType === "box") { //TODO:
      if (userSelections.plotArgs) {
        code += `# Plot Box Plot\nfig, ax = plt.subplots(figsize=(6, 4), layout='constrained')\nsns.boxplot(x='${userSelections.plotArgs.x}', y='${userSelections.plotArgs.y}', hue='${userSelections.plotArgs.hue}', palette='${userSelections.plotPalette}', data=df, ax=ax)\n\n`;
      }
  } else if (userSelections.plotType === "bubble") { //TODO:
      if (userSelections.plotArgs) {
        code += `# Plot Bubble Chart\nfig, ax = plt.subplots(figsize=(6, 4), layout='constrained')\nsns.boxplot(x='${userSelections.plotArgs.x}', y='${userSelections.plotArgs.y}', s='${userSelections.plotArgs.size}', palette='${userSelections.plotPalette}', data=df, ax=ax)\n\n`;
      }
  } else if (userSelections.plotType === "heat") { //TODO:
      if (userSelections.plotArgs) {
        code += `# Plot Heatmap\nfig, ax = plt.subplots(figsize=(6, 4), layout='constrained')\nsns.boxplot(x='${userSelections.plotArgs.x}', y='${userSelections.plotArgs.y}', hue='${userSelections.plotArgs.hue}', palette='${userSelections.plotPalette}', data=df, ax=ax)\n\n`;
      }
  } else if (userSelections.plotType === "line") { //TODO:
      if (userSelections.plotArgs) {
        code += `# Plot Line Chart\nfig, ax = plt.subplots(figsize=(6, 4), layout='constrained')\nsns.boxplot(x='${userSelections.plotArgs.x}', y='${userSelections.plotArgs.y}', hue='${userSelections.plotArgs.hue}', palette='${userSelections.plotPalette}', data=df, ax=ax)\n\n`;
      }
  } else if (userSelections.plotType === "density") { //TODO:
      if (userSelections.plotArgs) {
        code += `# Plot Density Plot\nfig, ax = plt.subplots(figsize=(6, 4), layout='constrained')\nsns.boxplot(x='${userSelections.plotArgs.x}', y='${userSelections.plotArgs.y}', hue='${userSelections.plotArgs.hue}', palette='${userSelections.plotPalette}', data=df, ax=ax)\n\n`;
      }
  } else if (userSelections.plotType === "histogram") { //TODO:
      if (userSelections.plotArgs) {
        code += `# Plot Histogram\nfig, ax = plt.subplots(figsize=(6, 4), layout='constrained')\nsns.boxplot(x='${userSelections.plotArgs.x}', y='${userSelections.plotArgs.y}', hue='${userSelections.plotArgs.hue}', palette='${userSelections.plotPalette}', data=df, ax=ax)\n\n`;
      }
  } else if (userSelections.plotType === "scatter") { //TODO:
      if (userSelections.plotArgs) {
        code += `# Plot Scatter Chart\nfig, ax = plt.subplots(figsize=(6, 4), layout='constrained')\nax.scatter(x='${userSelections.plotArgs.x}', y='${userSelections.plotArgs.y}', cmap='${userSelections.Palette}', data=df, ax=ax)\n\n`;
      }
  }

  if (userSelections.figureTitle) {
    code += `# Plot Figure Title\nax.set_title('${userSelections.figureTitle}')\n\n`;
  }

  if (userSelections.xAxisLabel) {
    code += `# Set Axis Labels\nax.set_xlabel('${userSelections.xAxisLabel}')\n`;
  }

  if (userSelections.yAxisLabel) {
    code += `ax.set_ylabel('${userSelections.yAxisLabel}')\n\n`;
  }
  if (userSelections.plotType &&
    userSelections.plotArgs &&
    userSelections.xAxisLabel &&
    userSelections.yAxisLabel
  ) {
      code += `# Save Figure as both .png for presentations and .pdf for publication\nplt.savefig('${userSelections.plotType}.TIFF', dpi=300, format='TIFF')\nplt.savefig('${userSelections.plotType}.pdf', dpi=300, format='pdf')\nplt.show()\n\n`;
  }

  // Update the code preview content with the generated code
  const codePreviewElement = document.getElementById("code-preview");
  codePreviewElement.textContent = code.trim();
  // call Prism to highlight code despite all the AJAX nonsense we have going on
  Prism.highlightElement(codePreviewElement);
}

//---
// Navigation
//---  

function nextStep(currentStep) {
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  document.getElementById(`step-${currentStep + 1}`).style.display = 'block';

  // Save selection from current step
  if (currentStep === 1) {
    userSelections.environment = document.getElementById('env-select').value;

  } else if (currentStep === 3) {
    userSelections.plotContext = document.getElementById('context-select').value;
    userSelections.plotStyle = document.getElementById('style-select').value;
    userSelections.plotPalette = document.getElementById('palette-select').value;

  } else if (currentStep === 4) {
    userSelections.plotType = document.getElementById('plot-select').value;
    userSelections.plotArgs = collectPlotArgs();

  }  else if (currentStep === 5) {
    userSelections.plotType = document.getElementById('plot-select').value;
    //userSelections.plotArgs = collectPlotArgs(); // Capture plot type and args again, otherwise plot preview disappears

  }  else if (currentStep === 6) {
    //userSelections.plotType = document.getElementById('plot-select').value;
    userSelections.figureTitle = document.getElementById('figure-title').value;
    userSelections.xAxisLabel = document.getElementById('x-axis_label').value;
    userSelections.yAxisLabel = document.getElementById('y-axis_label').value;
    const parseOrNull = id => {
      const val = document.getElementById(id).value;
      return val === "" ? null : parseFloat(val);
    };

    userSelections.xAxisMin = parseOrNull('x-axis_min');
    userSelections.xAxisMax = parseOrNull('x-axis_max');
    userSelections.yAxisMin = parseOrNull('y-axis_min');
    userSelections.yAxisMax = parseOrNull('y-axis_max');
  }


  if (window.uploadedColumns) {
    populateColumnSelects(window.uploadedColumns);
  }

  generatePlotPreview();
  updateCodePreview();     
}

// Enable next button to only appear Step 2, if file successfully uploaded
function enableNextStep() {
  document.querySelector('#step-2 button[onclick="nextStep(2)"]').disabled = false;
}

// Remove code preview and other params as you walk back through the workflow.
// TODO: Remove plot preview
function prevStep(currentStep) {
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  document.getElementById(`step-${currentStep - 1}`).style.display = 'block';

  if (currentStep === 5) {
    const plotType = userSelections.plotType;  // Save before wiping
    const plotArgsBlock = document.querySelector(`#args-${plotType}`);
    if (plotArgsBlock) {
      const inputs = plotArgsBlock.querySelectorAll('input, select, textarea');
      inputs.forEach(input => input.value = '');
    }

    userSelections.plotArgs = {};
    userSelections.plotType = null;

    generatePlotPreview();
  }

  else if (currentStep === 6) {
    userSelections.xAxisLabel = null;
    userSelections.yAxisLabel = null;
    userSelections.figureTitle = null;
    userSelections.xAxisMin = null;
    userSelections.xAxisMax = null;
    userSelections.yAxisMin = null;
    userSelections.yAxisMax = null;

  } else if (currentStep === 5) {
    userSelections.xAxisLabel = null;
    userSelections.yAxisLabel = null;
    userSelections.figureTitle = null;
    userSelections.xAxisMin = null;
    userSelections.xAxisMax = null;
    userSelections.yAxisMin = null;
    userSelections.yAxisMax = null;

  } else if (currentStep === 4) {
    userSelections.plotContext = null;
    userSelections.plotStyle = null;
    userSelections.plotPalette = null;

  } else if (currentStep === 3) {
    userSelections.DataFrame = null;

  } else if (currentStep === 2) {
    userSelections.environment = null;
  }

  updateCodePreview();
}

//---
// Helper Functions
//---    

// Show/hide plot args depending on selected plot type. 
// Plot args controlled from Flask backend
function onPlotTypeChange() {
  const selected = document.getElementById("plot-select").value;
  const allArgBlocks = document.querySelectorAll(".plot-args");

  // Hide all plot argument blocks
  allArgBlocks.forEach(div => div.style.display = "none");

  // Show the selected plot type's arguments block
  if (selected) {
    const target = document.getElementById(`args-${selected}`);
    if (target) {
      target.style.display = "block";

      // Add event listeners for plot arguments to trigger preview update
      const inputs = target.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.addEventListener('input', () => {
          userSelections.plotArgs = collectPlotArgs(); // Collect new plot args
          debouncedGeneratePlotPreview(); // Delay regenerating plot
        });
      });
    }

    // Store the selected plot type in the user selection
    userSelections.plotType = selected;
    userSelections.plotArgs = collectPlotArgs(); // Initialize plot args
    generatePlotPreview(); // Initial preview update when a plot type is selected
  }
}
// Collect Plot args and format for JSON request
function collectPlotArgs() {
  const plotType = userSelections.plotType;
  const plotArgsBlock = document.querySelector(`#args-${plotType}`);
  if (!plotArgsBlock) return;

  const inputs = plotArgsBlock.querySelectorAll('input, select, textarea');
  const args = {};

  inputs.forEach(input => {
    const name = input.name;
    const value = input.value;
    const type = input.dataset.type;

    if (!name || value === "") return;

    switch (type) {
      case "number":
        const num = parseFloat(value);
        if (!isNaN(num)) args[name] = num;
        break;

      case "boolean":
        // Convert string "true"/"false" to actual boolean
        args[name] = value.toLowerCase() === "true";
        break;

      default:
        args[name] = value;
    }
  });

  return args;
}

// Reset Button to clear session and delete uploaded files in Step 6
function ResetButton() {
  document.getElementById("reset-button").addEventListener("click", () => {
    fetch("/reset_session")
      .then(response => {
        if (response.ok) {
          location.reload();
        } else {
          alert("Failed to reset session.");
        }
      })
      .catch(error => {
        console.error("Error resetting session:", error);
      });
  });
}

// Debounce function to delay generatePlotPreview function in Step 4
function debounce(func, delay) {
  let timeout;
  console.log('debounce created');
  console.log(typeof AbortController);
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// Replace direct call with debounced version, 400 ms delay
const debouncedGeneratePlotPreview = debounce(generatePlotPreview, 400);

