const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const MainScreen = require(path.join(__dirname, './screens/main/mainScreen'));
const sudo = require('sudo-prompt');

let curWindow;

// Path to the Updater EXE
const updaterPath = "C:\\Program Files\\Nexon\\resources\\updater.exe";

// Auto-update settings
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

// **Create Electron Window**
function createWindow() {
    curWindow = new MainScreen();
}

// **Handle Auto-Update Events**
app.whenReady().then(() => {
    createWindow();
    autoUpdater.checkForUpdates();
    console.log(`Checking for updates. Current version: ${app.getVersion()}`);
});

autoUpdater.on("update-available", (info) => {
    curWindow.showMessage(`Update available. Current version ${app.getVersion()}`);
    autoUpdater.downloadUpdate();
  });

// **Update Downloaded: Run Updater EXE**
autoUpdater.on("update-not-available", (info) => {
  curWindow.showMessage(`No update available. Current version ${app.getVersion()}`);
});
autoUpdater.on("update-downloaded", (info) => {
    console.log(`Update downloaded: ${JSON.stringify(info)}`);
    curWindow.showMessage("Update downloaded. Running Updater EXE...");

    if (!fs.existsSync(updaterPath)) {
        console.error("Updater EXE not found:", updaterPath);
        curWindow.showMessage(`Error: Updater not found at ${updaterPath}`);
        return;
    }

    console.log(`Running updater: ${updaterPath}`);
    
    sudo.exec(`"${updaterPath}"`, { name: 'Nexon Updater' }, (error, stdout, stderr) => {
        if (error) {
            console.error("Error running updater with sudo:", error);
            curWindow.showMessage(`Error running updater: ${error.message}`);
            return;
        }
        console.log("Updater executed successfully.");
        curWindow.showMessage("Updater executed successfully.");
    });
});


// **Error Handling**
autoUpdater.on("error", (err) => {
    console.error("Auto-update error:", err);
    curWindow.showMessage(`Error in auto-updater: ${err}`);
});

// **Handle Electron Events**
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

process.on("uncaughtException", (err) => {
    console.error("Unhandled error:", err);
});
