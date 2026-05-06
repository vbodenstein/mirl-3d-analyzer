#!/bin/bash
# MIRL 3D Analyzer — double-click launcher
# Starts the database server (port 5005) and web server (port 8000),
# then opens the app in your default browser.

cd "$(dirname "$0")"

# Install Python dependencies if needed
pip3 install flask flask-cors --quiet 2>/dev/null

# Kill any previous instances on these ports
lsof -ti:5005 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null

echo "Starting MIRL database server on port 5005..."
python3 backend/mirl-db-server.py &
DB_PID=$!

echo "Starting MIRL web server on port 8000..."
python3 -m http.server 8000 --bind 127.0.0.1 &
WEB_PID=$!

# Wait for servers to be ready
sleep 2

echo "Opening browser..."
open http://localhost:8000

echo ""
echo "MIRL 3D Analyzer is running."
echo "  Web app:         http://localhost:8000"
echo "  Database server: http://localhost:5005"
echo ""
echo "Press Ctrl+C to stop both servers."

# Keep script alive; shut down both servers on exit
trap "kill $DB_PID $WEB_PID 2>/dev/null; echo 'Servers stopped.'" EXIT
wait
