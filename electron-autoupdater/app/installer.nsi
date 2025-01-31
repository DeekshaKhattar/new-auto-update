
RequestExecutionLevel admin
Section OutputPath
    SetOutPath $INSTDIR
    WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section PythonInstall
    SetOutPath $INSTDIR\resources
    File "${BUILD_RESOURCES_DIR}\python_installer.exe"
    File "${BUILD_RESOURCES_DIR}\psutil-5.9.8-cp37-abi3-win_amd64.whl"
    File "${BUILD_RESOURCES_DIR}\getmac-0.9.4-py2.py3-none-any.whl"
    File "${BUILD_RESOURCES_DIR}\pywin32-306-cp312-cp312-win_amd64.whl"
    File "${BUILD_RESOURCES_DIR}\charset_normalizer-3.3.2-py3-none-any.whl"
    File "${BUILD_RESOURCES_DIR}\idna-3.7-py3-none-any.whl"
    File "${BUILD_RESOURCES_DIR}\urllib3-2.2.1-py3-none-any.whl"
    File "${BUILD_RESOURCES_DIR}\certifi-2024.2.2-py3-none-any.whl"
    File "${BUILD_RESOURCES_DIR}\requests-2.31.0-py3-none-any.whl"
    ExecWait '"$INSTDIR\resources\python_installer.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0'
SectionEnd

Section ServiceInstall
    SetOutPath $INSTDIR\resources
    FileOpen $0 "$INSTDIR\resources\nexonservicelog.txt" w
    FileClose $0
    Sleep 5000 ; Wait 5 seconds
    SetOutPath $INSTDIR\resources
    File "${BUILD_RESOURCES_DIR}\nexon_service.py"
    File "${BUILD_RESOURCES_DIR}\install_service.bat"
    Sleep 5000 ; Wait 5 seconds
    ExecWait '"$INSTDIR\resources\install_service.bat"'
    ; Add logging to verify execution
    FileOpen $0 "$INSTDIR\resources\install_log.txt" w
    FileWrite $0 "Executed install_service.bat$\r$\n"
    FileClose $0
SectionEnd

Section TaskSchedularInstall
    SetOutPath $INSTDIR\resources
    File "${BUILD_RESOURCES_DIR}\system_health.py"
    ExecWait 'schtasks /create /sc hourly /mo 1 /tn "Nexon Health" /tr "\"C:\Program Files\Python310\python.exe\" \"$INSTDIR\resources\system_health.py\"" /ru SYSTEM /rl HIGHEST /f'
    Sleep 5000
    ExecWait 'schtasks /run /tn "Nexon Health"'
SectionEnd

Section TaskSchedularInstall
    Sleep 5000
    SetOutPath $INSTDIR\resources
    File "${BUILD_RESOURCES_DIR}\complaince_check.py"
    ExecWait 'schtasks /create /sc hourly /mo 1 /tn "Nexon Complaince Check Task" /tr "\"C:\Program Files\Python312\python.exe\" \"$INSTDIR\resources\complaince_check.py\"" /ru SYSTEM /rl HIGHEST /f'
    ExecWait 'schtasks /run /tn "Nexon Complaince Check Task"'
SectionEnd

Section "Uninstall"
    ; Stop the NexonService
    ExecWait 'sc stop NexonService'

    ; Wait for the service to stop
    Sleep 10000

    ; Delete the NexonService
    ExecWait 'sc delete NexonService'

    ; Wait for the service removal
    Sleep 5000

    ; Delete the service log file
    Delete "$INSTDIR\resources\nexonservicelog.txt"

    ; Delete the scheduled task
    ExecWait 'schtasks /delete /tn "Nexon Health" /f'

    ; Delete the scheduled task
    ExecWait 'schtasks /delete /tn "Nexon Complaince Check Task" /f'

    ; Wait for the task deletion
    Sleep 5000

    ; Remove the installation directory
    RMDir /r "$INSTDIR"
SectionEnd