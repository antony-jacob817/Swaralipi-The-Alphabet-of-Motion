FROM python:3.10

WORKDIR /app

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your application code
COPY . .

# Hugging Face exposes port 7860 by default
ENV PORT=7860
EXPOSE 7860

# Start the Flask server
CMD ["python", "app.py"]