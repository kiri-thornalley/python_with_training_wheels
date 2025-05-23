# Use official lightweight Python image
FROM python:3.13-slim

# Set working directory
WORKDIR /

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the app code
COPY . .

# Expose the port Flask runs on
EXPOSE 5000

# Run the app
CMD ["python", "run.py"]