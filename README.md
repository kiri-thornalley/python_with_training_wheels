# 🐍 Python With Training Wheels

>“Got bored, accidentally automated a well-loved Python plotting library. Oops.”

This project started as a tool to help me make quick, reproducible Matplotlib/Seaborn plots without wrestling boilerplate code. It quickly turned into a full-stack web app that writes Python for you as you build the figure — and I still don’t know how we got here.

Upload a CSV, click through a few steps, get a working .py or .ipynb file — all without needing to know Matplotlib internals. (But you’ll probably end up learning them anyway.)

## Table of Contents
- [Description](#description)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Description
This project is for educators, students, analysts, and anyone who wants to learn Python plotting by doing — with training wheels on, but with clean, exportable code when you're ready to ride solo. The tool ensures that the code generated is well-structured, and compliant with Black and Pylint, which is essential in research for transparency and future reproducibility. We mostly focus on the figure types from matplotlib, as this gives the greatest level of control over the figures that are generated, but do switch to seaborn where certain plot types are otherwise unavailable or incredibly challenging to create in matplotlib. 
Further, this tool has been built with the accessibility of the outputted figures in mind - when asked to select a colour palette for the figures, only colour-blind friendly options *e.g.,* viridis are presented to the user. 

### Features
- **Upload your CSV data** (stored to disk for up to 15 minutes, before automatic deletion)
- **Auto-populated dropdowns** based on your data columns
- **Choose plot types, themes, and palettes** via dropdowns - **VERSION 1.0:** Very limited plot types/ modifiable params currently available
- **Live-updating code preview** showing exactly what’s being built
- **Preview your plot** as you configure it
- **Export-ready code** for use in Google Colab, VS Code, or Jupyter notebooks

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
 - Further plot types available (e.g., Network graph, Heatmap, Box and Whisker Plot)
 - Implement highlight.js to modify appearance of generated code
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


