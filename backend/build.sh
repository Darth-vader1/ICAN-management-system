#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Installing backend dependencies..."
pip install -r requirements.txt

echo "Collecting static files for WhiteNoise..."
python manage.py collectstatic --no-input

echo "Running database migrations..."
python manage.py migrate

echo "Build completed successfully!"
