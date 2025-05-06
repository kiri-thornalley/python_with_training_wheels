const userSelections = {
    environment: null,
    plotType: null,
  };

  function nextStep(currentStep) {
    document.getElementById(`step-${currentStep}`).style.display = 'none';
    document.getElementById(`step-${currentStep + 1}`).style.display = 'block';
    
    // Save selection from step
    if (currentStep === 1) {
      userSelections.environment = document.getElementById('env-select').value;
    } else if (currentStep === 2) {
      userSelections.plotType = document.getElementById('plot-select').value;
    }

    updateCodePreview();
  }

  function prevStep(currentStep) {
  document.getElementById(`step-${currentStep}`).style.display = 'none';
  document.getElementById(`step-${currentStep - 1}`).style.display = 'block';
}

  function updateCodePreview() {
    let code = "";

    // Adjust imports based on environment
    if (userSelections.environment === "colab") {
      code += "# Google Colab setup\n!pip install seaborn\n\n";
    }

    code += "import matplotlib.pyplot as plt\nimport seaborn as sns\n\n";

    if (userSelections.plotType === "bar") {
      code += "sns.barplot(data=df, x='x', y='y')\nplt.show()";
    } else if (userSelections.plotType === "line") {
      code += "sns.lineplot(data=df, x='x', y='y')\nplt.show()";
    }

    document.getElementById("code-preview").textContent = code;
  }