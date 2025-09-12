@echo off
REM AudioSync Startup Script for Windows

echo 🎵 Starting AudioSync...
echo ========================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    pause
    exit /b 1
)

echo 🐍 Setting up Python server...
cd server

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Generate test audio files
echo 🎵 Generating test audio files...
python test_audio.py

REM Start the server in background
echo 🚀 Starting AudioSync server...
start /B python main.py

cd ..

echo 📱 Setting up React Native app...

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing React Native dependencies...
    call npm install
)

REM Start Metro bundler
echo 🚀 Starting Metro bundler...
start /B npm start

REM Wait a moment for Metro to start
timeout /t 3 /nobreak >nul

echo.
echo 🎉 AudioSync is running!
echo 📱 Mobile app: Connect to ws://localhost:8080
echo 🌐 Server: http://localhost:8080
echo.
echo Choose platform to run:
echo 1) Android
echo 2) iOS (requires macOS)
echo 3) Skip (run manually)

set /p platform_choice="Enter choice (1-3): "

if "%platform_choice%"=="1" (
    echo 🤖 Starting Android app...
    start /B npm run android
) else if "%platform_choice%"=="2" (
    echo 🍎 Starting iOS app...
    start /B npm run ios
) else (
    echo ℹ️  Run 'npm run android' or 'npm run ios' manually
)

echo.
echo Press any key to stop all services...
pause >nul

REM Cleanup
echo 🛑 Stopping AudioSync...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo 👋 AudioSync stopped
