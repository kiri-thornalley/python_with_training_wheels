import io
import uuid
import os
import shutil
from flask import Blueprint, request,jsonify, render_template, session, send_file, abort, Response
import pandas as pd
import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns
from werkzeug.utils import secure_filename
import nbformat

main_routes = Blueprint('main', __name__)

@main_routes.route('/upload_csv', methods=['POST'])
def upload_csv():
    file = request.files.get('csv_file')
    if file:
        try:
            original_filename = secure_filename(file.filename)
            file_name = f"{uuid.uuid4().hex}_{original_filename}"
            file_path = os.path.join('static', 'uploads', file_name)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            file.save(file_path)

            df = pd.read_csv(file_path)
            # Refresh Dataframe on new upload
            session.pop('csv_path', None)
            session.pop('column_names', None)
            # Save new filepath to session
            session['csv_path'] = file_path

            return jsonify({
                "success": True,
                "original_filename": original_filename,
                "file_name": file_name,
                "columns": df.columns.tolist()
            })
        except Exception as e:
            return jsonify({"success": False, "error": str(e)})

@main_routes.route('/home')
# Plot types introduced here, we typically pull the args from the function for said plotype included in matplotlib,
# as these give more granular control over the exact final appearance of the figure.
# **TODO: Which plots call sns.plot instead of plt?**
def home():
    """Main Flask route"""
    PLOT_TYPES = {
    #"bar": {
        #"label": "Bar Chart",
        #"args": [
            #{"name": "x", "label": "X-Axis", "type": "column"},
            #{"name": "width", "label": "Bar Width", "type": "number", "default": 0.8},
            #{"name": "bottom", "label": "Bottom", "type": "text"},
            #{"name": "align", "label": "Bar Alignment", "type": "literal","options":['center', 'edge'], "default": "center"},
            #{"name": "color", "label": "Bar Color", "type": "text"} sns.color_palette("viridis")[3]
        #],
        #"advanced": [
            #{"name": "yerr", "label": "Y-Error", "type": "column"},
            #{"name": "ecolor", "label": "Error Bar Color", "type": "text"}, # call from preset palette
            #{"name":"log", "label":"Log Scale - Y-axis", "type":"Boolean", "default": 'false'}
        #]
    #},
    "box": { 
        "label": "Box and Whisker Plot", # plotted from the seaborn function, the Matplotlib one is so complex, its confusing.
        "args": [
            {"name": "x", "label": "X-Axis", "type": "column"},
            {"name": "y", "label": "Y-Axis", "type": "column"},
            {"name": "hue", "label": "Hue", "type": "column"},
            {"name": "saturation", "label": "Colour Saturation", "type": "number", "min": 0, "max": 1, "step": 0.1, "default": 0.75},           
            {"name": "widths", "label": "Bar Width", "type": "number", "default": 0.8}
        ],
        "advanced": [
            #{"name": "order", "label": "Plot Order", "type": "text"},
            #{"name": "hue order", "label": "Hue Order", "type": "text"},
            #{"name": "color", "label": "Bar Color", "type": "text"},
            {"name": "fill", "label": "Bar Fill", "type": "Boolean", "default": True},
            #{"name": "orient", "label": "Orientation", "type": "literal", "options":['None','h', 'v'], "default": "None"},
        ]
    },
    "bubble": { #All params added 21/05/25
        "label": "Bubble Chart",
        "args": [
            {"name": "x", "label": "X-Axis", "type": "column"},
            {"name": "y", "label": "Y-Axis", "type": "column"},
            {"name": "s", "label": "Bubble Size", "type": "column"},
            {"name": "marker", "label": "Marker Style", "type": "literal", "options":['o', 'v', '^', '>','<','s','p', '*','x'], "default": 'o'}
        ],
        "advanced":[
            #{"name": "alpha", "label": "Alpha", "type": "number", "min": 0, "max": 1, "step": 0.1},
            #{"name": "linewidths", "label": "Line Width", "type": "number", "default": 1.5},
            #{"name": "plotnonfinite", "label":"Plot nonfinite values", "type":"Boolean", "default":'False'}
            #{"name": "norm", "label":"Normalisation Method", "type":"text"},
            #{"name": "vmin", "label":"", "type":"number"}, # Outlines the range the colourmap covers
            #{"name": "vmax", "label":"", "type":"number"}, 
        ]
    },
    #"heat": {
        #"label": "Heatmap",
        #"args": [
            #{"name": "annot", "label": "Annotations", "type": "Boolean", "default": 'false'},
           #{"name": "width", "label": "Bar Width", "type": "number", "default": 1},
            #{"name": "bottom", "label": "Bottom", "type": "text"},
            #{"name": "align", "label": "Bar Alignment", "type": "text"}, # 'center', 'edge'}, default: 'center'
           # {"name": "color", "label": "Bar Color", "type": "text"} # call from preset palette
        #],
        #"advanced": [
            #{"name": "yerr", "label": "Y-Error", "type": "column"},
            #{"name": "ecolor", "label": "Error Bar Color", "type": "text"}, # call from preset palette
            #{"name":"log", "label":"Log Scale - Y-axis", "type":"Boolean", "default": 'false'}
       # ]
    #},
    #"line": {
        #"label": "Line Chart",
        #"args": [
            #{"name": "x", "label": "X-Axis", "type": "column"},
           # {"name": "y", "label": "Y-Axis", "type": "column"},
            #{"name": "width", "label": "Bar Width", "type": "number"},
            #{"name": "color", "label": "Bar Color", "type": "text"}
        #]
    #},
    #"density": {
        #"label": "Density Plot",
        #"args": [
            #{"name": "x", "label": "X-Axis", "type": "text"},
            #{"name": "y", "label": "Y-Axis", "type": "text"},
            #{"name": "width", "label": "Bar Width", "type": "text"},
            #{"name": "color", "label": "Bar Color", "type": "text"}
        #]
    #},
    # All params added 10/05/2025
    "histogram": {
        "label": "Histogram",
        "args": [
            {"name": "x", "label": "X-Axis", "type": "column"},
            {"name": "bins", "label": "Bin Count", "type": "number"}
            #{"name": "align", "label": "Bar Alignment", "type": "literal", "options": ["left", "mid", "right"], "default": 'mid'}, # Literal| 'left', 'mid', 'right'
            #{"name": "orientation", "label": "Chart Orientation", "type": "literal", "options": ["vertical", "horizontal"], "default":'vertical'}, # Literal| 'horiontal', 'vertical'
            #{"name": "log", "label":"Log Scale - Y-axis", "type":"Boolean", "default": False},
            #{"name": "color", "label": "Bar Color", "type": "number"} # build as sns.color_palette("viridis")[3]
       ],
       # "advanced": [
            #{"name": "range", "label": "Range", "type": "tuple"},
            #{"name": "density", "label": "Density", "type": "Boolean", "default": "False"},
            #{"name": "weights", "label":"Weights", "type": "Array", "default": 'None'},
            #{"name": "cumulative", "label":"Cumulative Histogram", "type": "Boolean", "default": 'False'},
            #{"name": "bottom", "label":"Bottom", "type":"Array", "default": 'None'},
            #{"name": "histtype", "label":"Histogram Style", "type": "literal", "options": ["bar", "barstacked", "step", "stepfilled"], "default": 'bar'}, # Literal| 'bar', 'barstacked', 'step', 'stepfilled'
            #{"name": "label", "label":"Bar Label", "type":"text"},
            #{"name": "rwidth", "label":"rwidth", "type":"number", default:""}, # What is this?
            #{"name": "stacked", "label":"Stacked Bars", "type":"Boolean", "default":'False'},
        #]
    },
    "violin": {
        "label": "Violin Plot",
        "args": [
            {"name": "x", "label": "X-Axis", "type": "column"},
            {"name": "y", "label": "Y-Axis", "type": "column"},
            {"name": "hue", "label": "hue", "type": "column"},
            {"name": "orient", "label": "Orientation", "type": "literal", "options":['horizontal', 'vertical'], "default": "None"},
            #{"name": "width", "label": "Bar Width", "type": "text"},
            #{"name": "color", "label": "Bar Color", "type": "text"}
        ],
        #"advanced":[
            #{"name": "saturation", "label": "Colour Saturation", "type": "number", "min": 0, "max": 1, "step": 0.1, "default": 0.75},
            #{"name": "fill", "label":"Fill", "type":"Boolean", "default":'True'}
        #] 
    },
    "scatter": {
        "label": "Scatter Plot",
        "args": [
            {"name": "x", "label": "X-Axis", "type": "column"},
            {"name": "y", "label": "Y-Axis", "type": "column"},
            #{"name": "color", "label": "Point Color", "type": "text"}
            {"name": "marker", "label": "Marker Style", "type": "literal", "options":['o', 'v', '^', '>','<','s','p', '*','x'], "default": 'o'}
        ],
        #"advanced": [
            #{"name": "alpha", "label": "Alpha", "type": "number", "min": 0, "max": 1, "step": 0.1},
            #{"name": "linewidths", "label": "Line Width", "type": "number", "default": 1.5},
            #{"name": "plotnonfinite", "label":"Plot nonfinite values", "type":"Boolean", "default":'False'}
            #{"name": "norm", "label":"Normalisation Method", "type":"text"},
            #{"name": "vmin", "label":"", "type":"number"}, # Outlines the range the colourmap covers
            #{"name": "vmax", "label":"", "type":"number"}, 
        #]
    }
    }
    return render_template('pages/index.html', plot_types=PLOT_TYPES)  # Render the homepage

@main_routes.route('/generate_plot', methods=['POST'])
def generate_plot():
    """Generates plot preview using matplotlib and the non-interactive backend Agg"""
    matplotlib.use('Agg') 
    data = request.get_json()
    print(data)
    plot_type = data.get('plotType')
    context = data.get('context')
    style = data.get('style')
    palette = data.get('palette')
    plot_args = data.get('plotArgs', {})

    # Optional labels and limits
    x_label = data.get("xAxisLabel")
    y_label = data.get("yAxisLabel")
    title = data.get("figureTitle")
    x_min = data.get("xAxisMin")
    x_max = data.get("xAxisMax")
    y_min = data.get("yAxisMin")
    y_max = data.get("yAxisMax")

    # Get CSV path from session
    csv_path = session.get('csv_path')
    if not csv_path or not os.path.exists(csv_path):
        return abort(400, description="CSV file not found or session expired")

    # Load the CSV from disk
    df = pd.read_csv(csv_path)
    if context and style and palette:
        sns.set_theme(context=context, style=style, palette=palette)

    fig, ax = plt.subplots(figsize=(6, 4), layout='constrained', dpi=100)

    try:
        if plot_type == 'bar':
            sns.barplot(data=df, ax=ax, **plot_args)
            if title:
                ax.set_title(title)
            if x_label:
                ax.set_xlabel(x_label)
            if y_label:
                ax.set_ylabel(y_label)
            if x_min is not None and x_max is not None:
                ax.set_xlim(x_min, x_max)
            if y_min is not None and y_max is not None:
                ax.set_ylim(y_min, y_max)
        elif plot_type == 'box':
            sns.boxplot(data=df, **plot_args)
            if title:
                ax.set_title(title)
            if x_label:
                ax.set_xlabel(x_label)
            if y_label:
                ax.set_ylabel(y_label)
            if x_min is not None and x_max is not None:
                ax.set_xlim(x_min, x_max)
            if y_min is not None and y_max is not None:
                ax.set_ylim(y_min, y_max)
        elif plot_type == 'bubble':
            ax.scatter(data=df, **plot_args)
            if title:
                ax.set_title(title)
            if x_label:
                ax.set_xlabel(x_label)
            if y_label:
                ax.set_ylabel(y_label)
            if x_min is not None and x_max is not None:
                ax.set_xlim(x_min, x_max)
            if y_min is not None and y_max is not None:
                ax.set_ylim(y_min, y_max)
        elif plot_type == 'density':
            sns.kdeplot(data=df, ax=ax, **plot_args)
            if title:
                ax.set_title(title)
            if x_label:
                ax.set_xlabel(x_label)
            if y_label:
                ax.set_ylabel(y_label)
            if x_min is not None and x_max is not None:
                ax.set_xlim(x_min, x_max)
            if y_min is not None and y_max is not None:
                ax.set_ylim(y_min, y_max)
        elif plot_type == 'histogram':
            ax.hist(data=df, **plot_args)
            if title:
                ax.set_title(title)
            if x_label:
                ax.set_xlabel(x_label)
            if y_label:
                ax.set_ylabel(y_label)
            if x_min is not None and x_max is not None:
                ax.set_xlim(x_min, x_max)
            if y_min is not None and y_max is not None:
                ax.set_ylim(y_min, y_max)
        elif plot_type == 'scatter':
            ax.scatter(data=df,**plot_args)
            if title:
                ax.set_title(title)
            if x_label:
                ax.set_xlabel(x_label)
            if y_label:
                ax.set_ylabel(y_label)
            if x_min is not None and x_max is not None:
                ax.set_xlim(x_min, x_max)
            if y_min is not None and y_max is not None:
                ax.set_ylim(y_min, y_max)
        elif plot_type == 'line':
            ax.plot(data=df, **plot_args)
            if title:
                ax.set_title(title)
            if x_label:
                ax.set_xlabel(x_label)
            if y_label:
                ax.set_ylabel(y_label)
            if x_min is not None or x_max is not None:
                ax.set_xlim(x_min, x_max)
            if y_min is not None or y_max is not None:
                ax.set_ylim(y_min, y_max)
        elif plot_type == 'heat':
            sns.heatmap(df.corr(), ax=ax)
            if title:
                ax.set_title(title)
            if x_label:
                ax.set_xlabel(x_label)
            if y_label:
                ax.set_ylabel(y_label)
            if x_min is not None or x_max is not None:
                ax.set_xlim(x_min, x_max)
            if y_min is not None or y_max is not None:
                ax.set_ylim(y_min, y_max)
        elif plot_type == 'violin':
            sns.violinplot(data=df, ax=ax, **plot_args)
            sns.despine(offset=10, trim=True)
            if title:
                ax.set_title(title)
            if x_label:
                ax.set_xlabel(x_label)
            if y_label:
                ax.set_ylabel(y_label)
            if x_min is not None and x_max is not None:
                ax.set_xlim(x_min, x_max)
            if y_min is not None and y_max is not None:
                ax.set_ylim(y_min, y_max)    
        else:
            ax.text(0.5, 0.5, f"Plot type '{plot_type}' not yet implemented in Flask Backend", ha='center', va='center')
    except Exception as e:
        ax.text(0.5, 0.5, f"Plot error: {str(e)}", ha='center', va='center')

    # Convert plot to PNG
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)

    return send_file(buf, mimetype='image/png')

@main_routes.route('/reset_session')
def reset_session():
    "Resets session by deleting uploaded csv and clearing the Flask session."
    if os.path.isdir("static/uploads"):
        shutil.rmtree("static/uploads")
        session.clear()
    return "Session cleared", 200

@main_routes.route('/export_code',  methods=['POST'] )
def export_code():
    """ Gets the generated Python code from JS backend. Depending on the execution environment chosen in Step 1 of the workflow, exports as .ipynb or .py."""
   # Get the request data
    data = request.get_json()
    code = data.get('code')
    file_extension = data.get('file_extension')

    # Check file extension and generate the correct file
    if file_extension == ".ipynb":
        # Generate a Jupyter notebook (.ipynb)
        notebook = nbformat.v4.new_notebook()
        notebook.cells.append(nbformat.v4.new_code_cell(code))
        # Write notebook to a file-like object in memory
        response = Response(
            nbformat.writes(notebook),
            mimetype='application/json',
            headers={'Content-Disposition': 'attachment; filename=generated_code.ipynb'}
        )
        return response
    
    if file_extension == ".py":
        # Generate a Python file (.py)
        response = Response(
            code,
            mimetype='text/plain',
            headers={'Content-Disposition': 'attachment; filename=generated_code.py'}
        )
        return response

    # If an unsupported file extension is requested, return an error
    else:
        return Response("Unsupported file format", status=400)

@main_routes.route("/palette_preview", methods=["POST"])
def palette_preview():
    """Generates palette preview"""

    palette_name = request.json.get("palette")
    if not palette_name:
        return "Missing palette", 400
    matplotlib.use('Agg') 
    try:
        colors = sns.color_palette(palette_name)
        fig, ax = plt.subplots(figsize=(6, 1))
        for i, color in enumerate(colors):
            ax.add_patch(plt.Rectangle((i, 0), 0.95, 1.0, color=color))
        ax.set_xlim(0, len(colors))
        ax.set_ylim(0, 1)
        ax.axis("off")

        buf = io.BytesIO()
        plt.savefig(buf, format="png", bbox_inches="tight", pad_inches=0)
        plt.close(fig)
        buf.seek(0)
        return send_file(buf, mimetype="image/png")

    except Exception as e:
        print(f"[ERROR] Failed to generate palette preview: {e}")
    return jsonify({"error": str(e)}), 500