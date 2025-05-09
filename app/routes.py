# Add new routes (i.e., pages) to the Flask app in here. 
from flask import Blueprint, request,jsonify, render_template, session, send_file, abort
import pandas as pd
import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns
import io
import uuid
import os
import shutil
from werkzeug.utils import secure_filename

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
# The exception to this is the density plot. **TODO: Which plots call sns.plot instead of plt?**
def home():
    PLOT_TYPES = {
    "bar": {
        "label": "Bar Chart",
        "args": [
            {"name": "x", "label": "X-Axis", "type": "column"},
            {"name": "y", "label": "Y-Axis", "type": "column"},
           #{"name": "width", "label": "Bar Width", "type": "number", "default": 1},
            {"name": "bottom", "label": "Bottom", "type": "text"},
            {"name": "align", "label": "Bar Alignment", "type": "text"}, # 'center', 'edge'}, default: 'center'
            {"name": "color", "label": "Bar Color", "type": "text"} # call from preset palette
        ],
        "advanced": [
            {"name": "yerr", "label": "Y-Error", "type": "column"},
            {"name": "ecolor", "label": "Error Bar Color", "type": "text"}, # call from preset palette
            #{"name":"log", "label":"Log Scale - Y-axis", "type":"Boolean", "default": 'false'}
        ]
    },
    #"box": {
        #"label": "Box Plot",
        #"args": [
            #{"name": "x", "label": "X-Axis", "type": "column"},
            #{"name": "sym", "label": "Symbol for Outliers", "type": "text"},
            #{"name": "orientation", "label": "Orientation", "type": "text"},            
            #{"name": "widths", "label": "Bar Width", "type": "text"} 
        #],
        #"advanced": [
            #{"name": "whis", "label": "Bar Color", "type": "text"},
            #{"name": "showcaps", "label": "Caps on whiskers?", "type": "Boolean"},
            #{"name": "showbox", "label": "showbox", "type": "Boolean"},
            #{"name": "showfliers", "label": "showfliers", "type": "Boolean"},
            #{"name": "showmeans", "label": "showmeans", "type": "Boolean"}
        #]
    #},
    #"bubble": {
        #"label": "Bubble Chart",
        #"args": [
            #{"name": "x", "label": "X-Axis", "type": "column"},
            #{"name": "y", "label": "Y-Axis", "type": "column"},
            #{"name": "size", "label": "Bubble Size", "type": "column"},
            #{"name": "width", "label": "Bar Width", "type": "text"},
            #{"name": "color", "label": "Bar Color", "type": "text"}
        #]
    #},
    #"heat": {
        #"label": "Heatmap",
        #"args": [
            #{"name": "annot", "label": "Annotations?", "type": "Boolean", "default": 'false'},
            #{"name": "vmin", "label": "Bar Width", "type": "number"},
            #{"name": "vmax", "label": "Bar Width", "type": "number"},
            #{"name": "color", "label": "Bar Color", "type": "text"}
        #]
    #},
    "line": {
        "label": "Line Chart",
        "args": [
            {"name": "x", "label": "X-Axis", "type": "column"},
            {"name": "y", "label": "Y-Axis", "type": "column"},
            {"name": "width", "label": "Bar Width", "type": "number"},
            #{"name": "color", "label": "Bar Color", "type": "text"}
        ]
    },
    #"density": {
        #"label": "Density Plot",
        #"args": [
            #{"name": "x", "label": "X-Axis", "type": "text"},
            #{"name": "y", "label": "Y-Axis", "type": "text"},
            #{"name": "width", "label": "Bar Width", "type": "text"},
            #{"name": "color", "label": "Bar Color", "type": "text"}
        #]
    #},
    #"histogram": {
        #"label": "Histogram",
        #"args": [
            #{"name": "x", "label": "X-Axis", "type": "text"},
            #{"name": "y", "label": "Y-Axis", "type": "text"},
            #{"name": "width", "label": "Bar Width", "type": "text"},
            #{"name": "color", "label": "Bar Color", "type": "text"}
        #]
    #},
    #"violin": {
        #"label": "Violin Plot",
        #"args": [
            #{"name": "x", "label": "X-Axis", "type": "text"},
            #{"name": "y", "label": "Y-Axis", "type": "text"},
            #{"name": "width", "label": "Bar Width", "type": "text"},
            #{"name": "color", "label": "Bar Color", "type": "text"}
        #]
    #},
    "scatter": {
        "label": "Scatter Plot",
        "args": [
            {"name": "x", "label": "X-Axis", "type": "column"},
            {"name": "y", "label": "Y-Axis", "type": "column"},
            #{"name": "alpha", "label": "Alpha", "type": "number", "min": 0, "max": 1, "step": 0.1}
        ]
    }
}

    return render_template('pages/index.html', plot_types=PLOT_TYPES)  # Render the homepage

@main_routes.route('/generate_plot', methods=['POST'])
def generate_plot():
    matplotlib.use('Agg') 
    
    data = request.get_json()
    print(data)
    plot_type = data.get('plotType')
    context = data.get('context')
    style = data.get('style')
    palette = data.get('palette')
    plot_args = data.get('plotArgs', {})

    # Get CSV path from session
    csv_path = session.get('csv_path')
    if not csv_path or not os.path.exists(csv_path):
        return abort(400, description="CSV file not found or session expired")

    # Load the CSV from disk
    df = pd.read_csv(csv_path)
    
    if context and style and palette:
        sns.set_theme(context=context, style=style, palette=palette)

    fig, ax = plt.subplots()

    try:
        # Pass DataFrame explicitly if needed
        if plot_type == 'bar':
            sns.barplot(data=df, ax=ax, **plot_args)
        elif plot_type == 'scatter':
            sns.scatterplot(data=df, ax=ax, **plot_args)
        elif plot_type == 'line':
            sns.lineplot(data=df, ax=ax, **plot_args)
        elif plot_type == 'heat':
            sns.heatmap(df.corr(), ax=ax)
        else:
            ax.text(0.5, 0.5, f"Plot type '{plot_type}' not implemented", ha='center', va='center')
    except Exception as e:
        ax.text(0.5, 0.5, f"Plot error: {str(e)}", ha='center', va='center')

    # Convert plot to PNG
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)

    return send_file(buf, mimetype='image/png')

@main_routes.route('/reset_session')
def reset_session():
    if os.path.isdir("static/uploads"):
        shutil.rmtree("static/uploads")
        session.clear()
    return "Session cleared", 200