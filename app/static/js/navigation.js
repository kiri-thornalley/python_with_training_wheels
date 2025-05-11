const userSelections = {
    environment: null,
    plotType: null,
    plotContext: null,
    plotStyle: null,
    plotPalette: null,
    xAxisLabel: null,
    yAxisLabel: null,
    figureTitle: null,
    xAxisMin: null,
    xAxisMax: null,
    yAxisMin: null,
    yAxisMax: null,

    plotArgs: {},
  };
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
      userSelections.plotArgs = collectPlotArgs(); // <-- collect args once, only here

    } else if (currentStep === 5) {
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

    generatePlotPreview();  // Now safe to call here
    updateCodePreview();
  }

  // enable next button to only appear in data upload step, if file successfully uploaded
  function enableNextStep() {
    document.querySelector('#step-2 button[onclick="nextStep(2)"]').disabled = false;
  }
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

    if (currentStep === 5) {
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
    }
  
    code += "import matplotlib.pyplot as plt\nimport seaborn as sns\nimport pandas as pd\n\n";
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
        code += `# Set Seaborn theme\nsns.set_theme(context='${userSelections.plotContext}', style='${userSelections.plotStyle}', palette='${userSelections.plotPalette}')\n\n`;;
    }
    // ONLY add plot command if selected
    if (userSelections.plotType === "bar") {
      code += "fig, ax = plt.subplots()\nax.bar";
      } else if (userSelections.plotType === "box") {
      code += "";
      } else if (userSelections.plotType === "bubble") {
      code += "";
      } else if (userSelections.plotType === "heat") {
      code += "";
      } else if (userSelections.plotType === "line") {
      code += "";
      } else if (userSelections.plotType === "scatter") {
        code += "";
      } else if (userSelections.plotType === "density") {
        code += "";
      } else if (userSelections.plotType === "histogram") {
        //code += `# Plot Histogram\n fig,ax = plt.subplots()\n ax.hist(data=df, '${plot.args}')`;
      } else if (userSelections.plotType === "violin") {
        if (userSelections.plotArgs) {
          code += `# Plot Violin Plot\nsns.violinplot(x='${userSelections.plotArgs.x}', y='${userSelections.plotArgs.y}', data=df)\n`;
        }
          code += 'sns.despine(offset=10, trim=True)\n';
      };
  
    document.getElementById("code-preview").textContent = code.trim();
  }
    // Send selections to Flask to generate plot
    function generatePlotPreview() {
      const plotType = userSelections.plotType;
      if (!plotType) return;
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
          plotArgs: userSelections.plotArgs, // Already up to date
          xAxisLabel: userSelections.xAxisLabel,
          yAxisLabel: userSelections.yAxisLabel,
          figureTitle: userSelections.figureTitle,
          xAxisMin: userSelections.xAxisMin,
          xAxisMax: userSelections.xAxisMax,
          yAxisMin: userSelections.yAxisMin,
          yAxisMax: userSelections.yAxisMax,
        })
      })
        .then(res => res.blob())
        .then(imageBlob => {
          const imageURL = URL.createObjectURL(imageBlob);
          document.getElementById("plot-preview").src = imageURL;
          document.getElementById('plot-preview-container').style.display = 'block';
        })
        .catch(err => console.error("Plot generation failed:", err));
    }
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
            generatePlotPreview(); // Immediately regenerate plot preview
          });
        });
      }

      // Store the selected plot type in the user selection
      userSelections.plotType = selected;
      userSelections.plotArgs = collectPlotArgs(); // Initialize plot args
      generatePlotPreview(); // Initial preview update when a plot type is selected
    }
  }
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

      if (value === "") return;

      switch (type) {
        case "number":
          const num = parseFloat(value);
          if (!isNaN(num)) args[name] = num;
          break;
        default:
          args[name] = value;
      }
    });

    return args;
  }
  
 // AJAX for csv upload
 document.getElementById('upload-form').addEventListener('submit', function (e) {
    e.preventDefault(); // prevent default form submit
    
    const uploadStatus = document.getElementById('upload-status');
    uploadStatus.textContent = 'Uploading...';
 
    const formData = new FormData(this);
      fetch('/upload_csv', {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          uploadStatus.textContent = 'CSV uploaded successfully!';

          // Save the filename for code preview use
          userSelections.dataFrame = data.original_filename;
          console.log("Uploaded file name:", data.file_name);
          console.log("Detected columns:", data.columns);
          window.uploadedColumns = data.columns; // so we can reuse them later
          populateColumnSelects(data.columns);   // call right after successful upload
          // Enable Next Step button
          enableNextStep();
          } else {
          uploadStatus.textContent = 'Upload failed: ' + (data.error || 'Unknown error');
        }
      })

  document.getElementById("restart-button").addEventListener("click", function () {
  fetch("/reset_session")
    .then(response => {
      if (response.ok) {
        // Optionally reload the page or reset UI state
        location.reload(); // Reloads the page to start fresh
      } else {
        alert("Failed to reset session.");
      }
    })
    .catch(error => {
      console.error("Error resetting session:", error);
    });
});
})

function exportCode() {
  // Get the environment selected in Step 1
  const envSelect = document.getElementById("env-select");
  const selectedEnv = envSelect.value; // "jupyter", "vscode", or "colab"

  // Get the generated Python code
  const code = document.getElementById("code-preview").textContent;

  // Determine the file extension based on the selected environment
  let fileExtension = selectedEnv === "jupyter" ? ".ipynb" : ".py";
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
