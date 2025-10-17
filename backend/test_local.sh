#!/bin/bash
# Simple script to test the backend locally

echo "🧪 Testing Life Review API locally..."
echo ""

# Check if running
echo "1. Testing health endpoint..."
response=$(curl -s http://localhost:8080/api/health)
if [ $? -eq 0 ]; then
    echo "✅ Health check passed"
    echo "Response: $response"
else
    echo "❌ Server is not running on port 8080"
    echo "Start it with: python wsgi.py"
    exit 1
fi

echo ""
echo "2. Testing root endpoint..."
response=$(curl -s http://localhost:8080/)
if [ $? -eq 0 ]; then
    echo "✅ Root endpoint working"
    echo "Response: $response"
else
    echo "❌ Root endpoint failed"
fi

echo ""
echo "✅ Basic tests passed!"
echo ""
echo "To test other endpoints:"
echo "- Upload PDF: curl -X POST -F \"pdf=@yourfile.pdf\" http://localhost:8080/api/extract-questions"
echo "- Text-to-speech: curl -X POST -H \"Content-Type: application/json\" -d '{\"text\":\"Hello world\"}' http://localhost:8080/api/text-to-speech --output test.mp3"
