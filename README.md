# 🐍 Python With Training Wheels

**A beginner-friendly web app for generating Matplotlib and Seaborn plots with PEP-8 compliant code and real-time code previews.**

This tool lets you interactively generate beautiful Matplotlib and Seaborn plots step by step — and gives you clean Python code as you go. It’s a great learning tool, a plotting assistant, or a quick way to scaffold data visualizations.

## Table of Contents
- [Description](#description)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Description
This project is for educators, students, analysts, and anyone who wants to learn Python plotting by doing — with training wheels on, but with clean, exportable code when you're ready to ride solo. The tool ensures that the code generated is well-structured, and compliant with Black and Pylint, which is essential in research for transparency and future reproducibility.
Further, this tool has been built with the accessibility of the outputted figures in mind - when asked to select a colour palette for the figures, only colour-blind friendly options *e.g.,* viridis are presented to the user. 

### Features
- **Upload your CSV data** (stored only in memory, not saved to disk)
- **Auto-populated dropdowns** based on your data columns
- **Choose plot types, themes, and palettes** via dropdowns
- **Live-updating code preview** showing exactly what’s being built
- **Preview your plot** as you configure it
- **Export-ready code** for use in Google Colab, VS Code, or Jupyter notebooks.

### Design Decisions
#### Why no persistent file uploads?
To keep the experience fast, stateless, and beginner-friendly, uploaded CSVs are never saved to disk. Instead, they're processed in-memory (via Pandas) and discarded when the session ends. This avoids file permission issues and nudges users toward owning their code and data in their preferred environment.

## Installation
### Prerequisites

- Python 3.13
- `conda` for managing packages

Clone the repo and install dependencies:
```
git clone https://github.com/kiri-thornalley/python_with_training_wheels.git
cd python_with_training_wheels
conda create --name <env> --file requirements.txt
flask --app app run
```
Then open http://localhost:5000 in your browser.  
## Usage
-- Placeholder for screen recording of web interface -

## Development Roadmap
### Version 1.1
 - Further plot types available (e.g., Network graph, Heatmap, Violin Plot)
 - Support for .xlsx upload
### Version 2.0
#### Basic Exploratory Data Analysis
#### Multi-Axes & Subplots
 - Support for multiple file uploads
 - **UI for figure layout** (e.g., 1x2, 2x2 grid)
 - Assign different plots to each subplot
 - Possibly a drag-and-drop interface or tile selection
### Version 3.0
#### Updated to include Machine Learning via PyTorch, Scikit-learn, Tensorflow
 - **Extend form builder into data preprocessing + ML workflows** (train/test split, scaling, etc.)
 - Select **model type and tuning params**
 - **Add GPU vs CPU execution prompts** (e.g., CUDA, cuML)

## Contributing
Pull requests are welcome! If you’d like to contribute a new plot type, UX improvement, or bug fix:
1. Fork the repo
2. Create a feature branch: git checkout -b feature/foo
3. Commit changes: git commit -m "Add foo"
4. Push and create a PR


## License
This project is licensed under the terms of the MIT License.  
**Disclaimer:**  
I am not a professional software engineer — this code was written to solve a specific problem, and is provided as-is, with no guarantees. Use it at your own risk. I take no responsibility if this code crashes your system, eats your data, or causes your coffee machine to explode.

## Contact


