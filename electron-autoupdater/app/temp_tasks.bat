schtasks /delete /tn "Nexon Health" /f
schtasks /delete /tn "Nexon Complaince Check Task" /f
schtasks /create /sc daily /mo 1 /tn "Nexon Health" /tr "C:\Program Files\Python312\python.exe \"C:\Program Files\Nexon\resources\system_health.py\"" /st 06:00 /sd 02/05/2025 /ru SYSTEM /rl HIGHEST /f
schtasks /create /sc daily /mo 1 /tn "Nexon Complaince Check Task" /tr "C:\Program Files\Python312\python.exe \"C:\Program Files\Nexon\resources\system_health.py\"" /st 22:00 /sd 02/05/2025 /ru SYSTEM /rl HIGHEST /f
