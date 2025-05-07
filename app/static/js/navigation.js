const userSelections = {
    environment: null,
    plotType: null,
    plotContext: null,
    plotStyle: null,
    plotPallette: null,
  };

  function nextStep(currentStep) {
    document.getElementById(`step-${currentStep}`).style.display = 'none';
    document.getElementById(`step-${currentStep + 1}`).style.display = 'block';
    
    // Save selection from step
    if (currentStep === 1) {
      userSelections.environment = document.getElementById('env-select').value;
    } else if (currentStep === 2) {
      userSelections.plotContext = document.getElementById('context-select').value;
      userSelections.plotStyle = document.getElementById('style-select').value;
      userSelections.plotPalette = document.getElementById('palette-select').value;
    } else if (currentStep === 3) {
        userSelections.plotType = document.getElementById('plot-select').value;
      }

    updateCodePreview();
  }

  function prevStep(currentStep) {
    document.getElementById(`step-${currentStep}`).style.display = 'none';
    document.getElementById(`step-${currentStep - 1}`).style.display = 'block';
  
    // Clear the current selection when stepping back
    if (currentStep === 4) {
      userSelections.plotType = null;
    } else if (currentStep === 3) {
      userSelections.plotContext = null;
      userSelections.plotStyle = null;
      userSelections.plotPalette = null;
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
  
    code += "import matplotlib.pyplot as plt\nimport seaborn as sns\n\n";
  
    // ONLY add plot setup if context/style/palette are selected
    if (
      userSelections.plotContext &&
      userSelections.plotStyle &&
      userSelections.plotPalette
    ) {
        code += `sns.set_theme(context='${userSelections.plotContext}', style='${userSelections.plotStyle}', palette='${userSelections.plotPalette}')\n\n`;;
    }
  
    // ONLY add plot command if selected
    if (userSelections.plotType === "line") {
      code += "sns.lineplot(data=df, x='x', y='y')\nplt.show()";
    } else if (userSelections.plotType === "scatter") {
      code += "sns.scatterplot(data=df, x='x', y='y')\nplt.show()";
    }
  
    document.getElementById("code-preview").textContent = code.trim();
  }

  