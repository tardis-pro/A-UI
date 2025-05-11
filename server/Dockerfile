# Use CUDA-enabled base image
FROM nvidia/cuda:12.1.0-runtime-ubuntu22.04

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    TRANSFORMERS_CACHE="/app/.cache/huggingface"

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3-pip \
    python3.10-venv \
    && rm -rf /var/lib/apt/lists/*

# Create and activate virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download and cache models during build
RUN python3 -c '
from transformers import AutoTokenizer, AutoModelForCausalLM; \
model_name = "huggingface/mistral-7b-instruct"; \
print(f"Downloading {model_name}..."); \
AutoTokenizer.from_pretrained(model_name); \
AutoModelForCausalLM.from_pretrained(model_name, device_map="auto", load_in_4bit=True); \
print("Model downloaded successfully!")
'

# Copy application code
COPY . .

# Create cache directory for Hugging Face
RUN mkdir -p /app/.cache/huggingface && \
    chmod -R 777 /app/.cache

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1