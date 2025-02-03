echo off

REM Define the service name
set SERVICE_NAME=NexonService

REM First kill any existing pythonservice processes
taskkill /F /IM pythonservice.exe /T 2>nul

REM Wait for process termination
timeout /t 30 > nul

REM Check Python executable paths
set PYTHON_PATH=C:\Program Files\Python312\Scripts\pip.exe
set PYTHON_EXEC=C:\Program Files\Python312\python.exe

if not exist "%PYTHON_PATH%" (
    set PYTHON_PATH=%USERPROFILE%\AppData\Local\Programs\Python\Python312\Scripts\pip.exe
)
if not exist "%PYTHON_EXEC%" (
    set PYTHON_EXEC=%USERPROFILE%\AppData\Local\Programs\Python\Python312\python.exe
)
REM Check and stop existing service more thoroughly
sc query "%SERVICE_NAME%" | find "SERVICE_NAME" > nul
if not errorlevel 1 (
    echo Service "%SERVICE_NAME%" exists. Stopping and removing...
    sc stop "%SERVICE_NAME%"
    timeout /t 5 > nul
    sc delete "%SERVICE_NAME%"
    timeout /t 5 > nul
)

REM Validate Python installation
if not exist "%PYTHON_EXEC%" (
    echo Python executable not found. Please ensure Python 3.12 is installed.
    pause
    exit /b 1
)

if not exist "%PYTHON_PATH%" (
    echo pip not found. Please ensure Python 3.12 is installed.
    pause
    exit /b 1
)

REM Install required Python packages
echo Installing required Python packages...
"%PYTHON_PATH%" install "%~dp0\psutil-5.9.8-cp37-abi3-win_amd64.whl"
"%PYTHON_PATH%" install "%~dp0\getmac-0.9.4-py2.py3-none-any.whl"
"%PYTHON_PATH%" install "%~dp0\pywin32-306-cp312-cp312-win_amd64.whl"
"%PYTHON_PATH%" install "%~dp0\charset_normalizer-3.3.2-py3-none-any.whl"
"%PYTHON_PATH%" install "%~dp0\idna-3.7-py3-none-any.whl"
"%PYTHON_PATH%" install "%~dp0\certifi-2024.2.2-py3-none-any.whl"
"%PYTHON_PATH%" install "%~dp0\urllib3-2.2.1-py3-none-any.whl"
"%PYTHON_PATH%" install "%~dp0\requests-2.31.0-py3-none-any.whl"

REM Check if the service exists and stop/delete it if it does
sc query "%SERVICE_NAME%" | find "SERVICE_NAME" > nul
if not errorlevel 1 (
    echo Service "%SERVICE_NAME%" already exists. Stopping and deleting...
    sc stop "%SERVICE_NAME%"
    sc delete "%SERVICE_NAME%"
    timeout /t 5 > nul
)

REM Install the service
echo Installing %SERVICE_NAME%...
"%PYTHON_EXEC%" "%~dp0\nexon_service.py" --startup=auto install

if errorlevel 1 (
    echo Failed to install the service. Please check the logs for errors.
    exit /b 1
)

REM Wait for the installation to complete
timeout /t 4 > nul

REM Start the service
echo Starting %SERVICE_NAME%...
sc start "%SERVICE_NAME%"

if errorlevel 1 (
    echo Failed to start the service. Please check the service configuration.
    exit /b 1
)

echo %SERVICE_NAME% successfully installed and started.