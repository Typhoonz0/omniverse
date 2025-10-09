const { app, BrowserWindow, protocol } = require('electron');

const path = require('path');
const fs = require('fs');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');

let gameWindow;

const createWindow = () => {
    gameWindow = new BrowserWindow({
        show: true,
        title: 'Deadshot.io',
        fullscreen: true,
        
        webPreferences: {
  //          preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            enableRemoteModule: true,
            sandbox: false
        }
    });

    gameWindow.setMenuBarVisibility(false);
    gameWindow.loadURL('https://deadshot.io');

    gameWindow.webContents.on('did-finish-load', () => {
        // Inject script.js
        const scriptPath = path.join(__dirname, 'script.js');
        if (fs.existsSync(scriptPath)) {
            const code = fs.readFileSync(scriptPath, 'utf8');
            gameWindow.webContents.executeJavaScript(code)
                .then(() => console.log('script.js injected'))
                .catch(err => console.error('Failed to inject script.js', err));
        }
    });

    return gameWindow;
};

app.whenReady().then(() => {
    const gameWindow = createWindow();

    protocol.handle('custom', async (req) => {
        const relativePath = req.url.slice(7);
        const localPath = path.join(__dirname, 'swap', relativePath);

        try {
            const fileData = await fs.promises.readFile(localPath);
            return new Response(fileData, { headers: { 'Content-Type': 'image/webp' } });
        } catch (err) {
            console.error(`Could not read file: ${localPath}`, err);
            return new Response('Not Found', { status: 404 });
        }
    });

    const resourceFilter = {
        urls: [
            '*://deadshot.io/weapons/awp/*.webp',
            '*://deadshot.io/weapons/ar2/*.webp',
            '*://deadshot.io/weapons/shotgun/*.webp',
            '*://deadshot.io/weapons/vector/*.webp',
            '*://deadshot.io/skins/compressed/*.webp',
            '*://deadshot.io/promo/*.webp',
            '*://deadshot.io/textures/*.webp'
        ]
    };

    gameWindow.webContents.session.webRequest.onBeforeRequest(resourceFilter, (reqDetails, next) => {
        const filePath = path.join(__dirname, 'swap', new URL(reqDetails.url).pathname);
        if (fs.existsSync(filePath)) {
            next({ redirectURL: `custom://${new URL(reqDetails.url).pathname}` });
        } else {
            next({ cancel: false });
        }
    });
    // adblocker is being dum so cant use it atm
    //ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
    //    // Disable blocking for deadshot.io assets
    //    blocker.on('request-blocked', (details) => {
    //        if (details.url.includes('deadshot.io')) {
    //            blocker.disableBlockingInSession(gameWindow.webContents.session);
    //        }
    //    });
    //    blocker.enableBlockingInSession(gameWindow.webContents.session);
    //});

});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
