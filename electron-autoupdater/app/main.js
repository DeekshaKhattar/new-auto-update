const { app, BrowserWindow, ipcMain, ipcRenderer, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const sudo = require('sudo-prompt');
const moment = require('moment');
const schedule = require('node-schedule');
const MainScreen = require(path.join(__dirname, './screens/main/mainScreen'));
let curWindow;

const options = {
  name: 'AutoUpdater',
};

//Basic flags
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
app.setPath('userData', path.join(app.getPath('appData'), 'Nexon', 'UserData'));


function createWindow() {
  curWindow = new MainScreen();
}

if (require('electron-squirrel-startup')) {
  app.quit();
}

// Function to copy system_health.py from build folder to resources folder
function copySystemHealthFile() {
  const sourcePath = path.join(__dirname, "build", "system_health.py");
  const destinationPath = "C:\\Program Files\\Nexon\\resources\\system_health.py";

  console.log("Source Path:", sourcePath);
  console.log("Destination Path:", destinationPath);

  const scriptContent = `
    $sourcePath = "${sourcePath}"
    $destinationPath = "${destinationPath}"
    if (!(Test-Path -Path $sourcePath)) {
      Write-Error "Source file not found: $sourcePath"
      exit 1
    }
    $destinationDir = Split-Path -Parent $destinationPath
    if (!(Test-Path -Path $destinationDir)) {
      New-Item -ItemType Directory -Path $destinationDir -Force
    }
    Start-Process -FilePath "powershell.exe" -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', "Copy-Item -Path '$sourcePath' -Destination '$destinationPath' -Force" -Verb RunAs
  `;
  console.log("Script Content:", scriptContent);
  const tempDir = app.getPath("userData");
  const tempScriptPath = path.join(tempDir, "copy_script.ps1");
  console.log("Temp Script Path:", tempScriptPath);
  fs.writeFileSync(tempScriptPath, scriptContent);

  const command = `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${tempScriptPath}"`;
  console.log("Command:", command);
  sudo.exec(command, options, (err, stdout, stderr) => {
    console.log('stdout:', stdout);
    if (err) {
      console.error("Error during file copy:", err);
      return;
    }
    console.log('stdout', stdout);
    if (stderr) {
      console.error('error in stderr', stderr);
    }
    console.log('File copied successfully');
    fs.unlinkSync(tempScriptPath); // Clean up the temporary script file
    createTaskSchedulers()
  });
}

function createTaskSchedulers() {
  // copySystemHealthFile();
  // setTimeout(() => {
    const pythonPaths = [
      'C:\\Program Files\\Python312\\python.exe'
    ];
  
    const tasks = [
      { name: "Nexon Health", time: "06:00" },
      { name: "Nexon Complaince Check Task", time: "22:00" },
    ];
  
    const scriptPath = path.join(__dirname, 'temp_tasks.bat');
    let scriptContent = '';
  
    tasks.forEach((task) => {
      scriptContent += `schtasks /delete /tn "${task.name}" /f\n`;
    });
  
    tasks.forEach((task) => {
      const pythonPath = "C:\\Program Files\\Python312\\python.exe";
      const scriptPath = "C:\\Program Files\\Nexon\\resources\\system_health.py";
      const startDate = moment().format('DD/MM/YYYY'); // Use current date as start date
      const createCommand = `schtasks /create /sc daily /mo 1 /tn "${task.name}" /tr "${pythonPath} \\"${scriptPath}\\"" /st ${task.time} /sd ${startDate} /ru SYSTEM /rl HIGHEST /f`;
      scriptContent += `${createCommand}\n`;
    });
  
    fs.writeFileSync(scriptPath, scriptContent);
  
    sudo.exec(`cmd /c ${scriptPath}`, options, (err, stdout, stderr) => {
      if (err) {
        console.error('Error executing script:', err);
        console.error('stderr:', stderr);
        return;
      }
      console.log('Script executed successfully');
      console.log('stdout:', stdout);
  
      fs.unlinkSync(scriptPath);
    });
  // }, 8000);

}

app.whenReady().then(() => {
  createWindow();
  // copySystemHealthFile();
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length == 0) createWindow();
  });

  autoUpdater.checkForUpdates();
  console.log('process.argv', process.argv)
 
  if (process.argv.includes('--post-update')) {
    // Run the post-update tasks, e.g., schedule your tasks.
    createTaskSchedulers();
  }

  console.log(`Checking for updates. Current version: ${app.getVersion()}`);
});

/* New Update Available */
autoUpdater.on("update-available", (info) => {
  curWindow.showMessage(`Update available. Current version ${app.getVersion()}`);
  autoUpdater.downloadUpdate();
});

autoUpdater.on("update-not-available", (info) => {
  curWindow.showMessage(`No update available. Current version ${app.getVersion()}`);
});

/* Download Completion Message */
autoUpdater.on("update-downloaded", (info) => {
  curWindow.showMessage(`Update downloaded. Current version ${app.getVersion()}`);

  // Run install_service.bat after update
  // exec(`"${app.getPath("exe").replace(/\\/g, "/")}/../resources/install_service.bat"`, (error, stdout, stderr) => {
  //   if (error) {
  //     console.error(`Error executing batch file: ${error.message}`);
  //     return;
  //   }
  //   if (stderr) {
  //     console.error(`Batch script stderr: ${stderr}`);
  //     return;
  //   }
  //   console.log(`Batch script output: ${stdout}`);
  // });

  // Show restart dialog
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart app', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? info.releaseNotes : info.releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  };

  curWindow.showMessage(dialogOpts.message);

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    // copySystemHealthFile();
    setTimeout(() => {
      if (returnValue.response === 0) {
        // Pass the "--post-update" flag to the new instance
        autoUpdater.quitAndInstall({ args: ['--post-update'] });
      }
    }, 15000);
  });
});

autoUpdater.on("error", (err) => {
  curWindow.showMessage(`Error in auto-updater: ${err}`);
});

// Global exception handler
process.on("uncaughtException", function (err) {
  console.log(err);
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});