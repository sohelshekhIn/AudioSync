#!/bin/bash

# AudioSync Startup Script
echo "🎵 Starting AudioSync..."
echo "========================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16 or higher."
    exit 1
fi

# Function to start the Python server
start_server() {
    echo "🐍 Starting Python server..."
    cd server
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "📦 Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
    
    # Generate test audio files
    echo "🎵 Generating test audio files..."
    python test_audio.py
    
    # Start the server
    echo "🚀 Starting AudioSync server..."
    python main.py &
    SERVER_PID=$!
    
    cd ..
    echo "✅ Server started (PID: $SERVER_PID)"
    return $SERVER_PID
}

# Function to start React Native
start_app() {
    echo "📱 Starting React Native app..."
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing React Native dependencies..."
        npm install
    fi
    
    # Start Metro bundler
    echo "🚀 Starting Metro bundler..."
    npm start &
    METRO_PID=$!
    
    echo "✅ Metro bundler started (PID: $METRO_PID)"
    
    # Wait a moment for Metro to start
    sleep 3
    
    # Ask user which platform to run
    echo ""
    echo "📱 Choose platform to run:"
    echo "1) Android"
    echo "2) iOS"
    echo "3) Skip (run manually)"
    read -p "Enter choice (1-3): " platform_choice
    
    case $platform_choice in
        1)
            echo "🤖 Starting Android app..."
            npm run android &
            ;;
        2)
            echo "🍎 Starting iOS app..."
            npm run ios &
            ;;
        3)
            echo "ℹ️  Run 'npm run android' or 'npm run ios' manually"
            ;;
        *)
            echo "ℹ️  Invalid choice. Run 'npm run android' or 'npm run ios' manually"
            ;;
    esac
}

# Function to cleanup processes
cleanup() {
    echo ""
    echo "🛑 Stopping AudioSync..."
    
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null
        echo "✅ Server stopped"
    fi
    
    if [ ! -z "$METRO_PID" ]; then
        kill $METRO_PID 2>/dev/null
        echo "✅ Metro bundler stopped"
    fi
    
    # Kill any remaining processes
    pkill -f "python.*main.py" 2>/dev/null
    pkill -f "node.*metro" 2>/dev/null
    
    echo "👋 AudioSync stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Main execution
echo "🔧 Setting up AudioSync..."

# Start server
start_server
SERVER_PID=$?

# Start app
start_app

echo ""
echo "🎉 AudioSync is running!"
echo "📱 Mobile app: Connect to ws://$(hostname -I | awk '{print $1}'):8080"
echo "🌐 Server: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
while true; do
    sleep 1
done
