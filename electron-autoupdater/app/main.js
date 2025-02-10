const { app, BrowserWindow, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const MainScreen = require(path.join(__dirname, './screens/main/mainScreen'));
const sudo = require('sudo-prompt');

let curWindow;

const updateMarkerFile = path.join(app.getPath("userData"), "update-in-progress");
const postUpdateScript = "C:\\Program Files\\Nexon\\resources\\post-update.bat";

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
    console.log('postUpdateScript', postUpdateScript)
    // Check for update marker file
    if (fs.existsSync(updateMarkerFile)) {
      const options = {
        name: 'Nexon Updater',
        icns: '/path/to/icon.icns' // Windows ignores this
      };
      curWindow.showMessage(`Post-update exist: ${postUpdateScript} ${postUpdateScript}`);
      sudo.exec(`"${postUpdateScript}"`, options,
        (error, stdout, stderr) => {
          if (error) {
            console.error('Error:', error);
            curWindow.showMessage(`Post-update failed: ${error.message}`);
            return;
          }
          console.log('stdout:', stdout);
          console.error('stderr:', stderr);
          
          // Delete marker file regardless of success
          if (fs.existsSync(updateMarkerFile)) {
            fs.unlinkSync(updateMarkerFile);
          }
        }
      );
    }
  
    autoUpdater.checkForUpdates();
  });

autoUpdater.on("update-available", (info) => {
    curWindow.showMessage(`Update available. Current version ${app.getVersion()} ${updateMarkerFile, postUpdateScript}`);
    
    // ✅ Create "update-in-progress" marker file
    fs.writeFileSync(updateMarkerFile, "update");

    
    autoUpdater.downloadUpdate();
});

autoUpdater.on("update-not-available", (info) => {
    curWindow.showMessage(`No update available. Current version ${app.getVersion()}`);
  });

// **Update Downloaded: Prompt User to Restart**
// Modify the update-downloaded event handler to force close
autoUpdater.on("update-downloaded", (info) => {
    curWindow.showMessage(`Update downloaded. Restarting for installation..., ${postUpdateScript}`);

    const dialogOpts = {
        type: 'info',
        buttons: ['Restart now', 'Later'],
        title: 'Application Update',
        message: "A new version has been downloaded. Restart to complete the update.",
        detail: `Current version: ${app.getVersion()}`
    };

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) {
            // Force close all windows before quitting
            app.exit(0);
            autoUpdater.quitAndInstall(true, true); // Force quit for installation
        }
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
