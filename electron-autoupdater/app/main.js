const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const MainScreen = require("./screens/main/mainScreen");
const { autoUpdater } = require("electron-updater");

let curWindow;

// Basic flags
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  curWindow = new MainScreen();
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  autoUpdater.checkForUpdates();
  curWindow.showMessage(`Checking for updates. Current version ${app.getVersion()}`);
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
  // Prompt user to install the update
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart app', 'Later'],
    title: 'Application Update',
    message: process.platform === 'win32' ? info.releaseNotes : info.releaseName,
    detail: 'A new version has been downloaded. Restart the application to apply the updates.'
  };

  curWindow.showMessage(dialogOpts.message);

  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) autoUpdater.quitAndInstall();
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