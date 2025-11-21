//  __   _  _  __ _  __  _  _  ____  ____  ____  ____
// /  \ ( \/ )(  ( \(  )/ )( \(  __)(  _ \/ ___)(  __)
//(  O )/ \/ \/    / )( \ \/ / ) _)  )   /\___ \ ) _) 
// \__/ \_)(_/\_)__)(__) \__/ (____)(__\_)(____/(____)
//
// DO NOT DISTRIBUTE WITHOUT CREDIT

// CREDITS:
// By xLiam1 | xliam.space


const { app, BrowserWindow, protocol} = require("electron");
const RPC = require("discord-rpc");
const path = require("path");
const fs = require("fs");
const { ElectronBlocker} = require("@cliqz/adblocker-electron");
const fetch = require("cross-fetch");

let gameWindow;
let adblock;
let rpc;
let dir = __dirname;
let funmode;
while (!fs.existsSync(path.join(dir, 'omniverse')) && path.dirname(dir) !== dir)
	dir = path.dirname(dir);

const framerateConfigPath = path.join(dir, 'omniverse', 'src', "settings.json");
if (fs.existsSync(framerateConfigPath)) {
	try {
		const config = JSON.parse(fs.readFileSync(framerateConfigPath, "utf-8"));

		if (config.disableFrameRateLimit === true) {
			app.commandLine.appendSwitch("disable-frame-rate-limit");
		}

		if (config.forceHighPerformanceGPU === true) {
			app.commandLine.appendSwitch("force_high_performance_gpu");
		}
		if (config.funMode === true) {
			funmode = true;
		}

		adblock = config.adblocker;
		rpc = config.rpc;
	} catch (err) {
		console.error("Error parsing framerate.json:", err);
	}
}

const clientId = "1426074176518881373";
let rpcClient;

if (rpc) {
	try {
		rpcClient = new RPC.Client({
			transport: "ipc"
		});

		rpcClient.on("ready", () => {
			console.log("Discord RPC connected");

			rpcClient.setActivity({
				details: "Playing Deadshot.io",
				state: "https://github.com/Typhoonz0/omniverse",
				largeImageKey: "logo",
				largeImageText: "Deadshot.io",
				startTimestamp: Date.now(),
				instance: true,
				buttons: [{
					label: "download",
					url: "https://github.com/Typhoonz0/omniverse"
				},],
			});
		});

		rpcClient.login({
			clientId
		}).catch((err) => {
			console.warn("Discord RPC failed to connect:", err.message);
		});
	} catch (err) {
		console.warn("Discord RPC initialization failed:", err.message);
	}	
}

const createWindow = () => {

	const windowOptions = {
		show: true,
		title: "Deadshot.io",
		fullscreen: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			        webSecurity: false,            // ← allows loading file:// resources
			enableRemoteModule: true,
			sandbox: false,
		},
	};

	// Only add preload when funmode is true
	if (funmode) {
		windowOptions.webPreferences.preload = path.join(__dirname, 'preload.js');
	}

	const gameWindow = new BrowserWindow(windowOptions);
	gameWindow.setMenuBarVisibility(false);
	gameWindow.loadURL("https://deadshot.io");

	gameWindow.webContents.on("did-finish-load", () => {
		// Inject script.js
		const scriptPath = path.join(__dirname, "script.js");
		if (fs.existsSync(scriptPath)) {
			const code = fs.readFileSync(scriptPath, "utf8");
			gameWindow.webContents
				.executeJavaScript(code)
				.then(() => console.log("script.js injected"))
				.catch((err) => console.error("Failed to inject script.js", err));
		}
	});

	return gameWindow;
};

app.whenReady().then(() => {
	const gameWindow = createWindow();
	if (adblock) {
	protocol.handle("custom", async (req) => {
		const relativePath = req.url.slice(7);
		const localPath = path.join(__dirname, "swap", relativePath);

		try {
			const fileData = await fs.promises.readFile(localPath);
			return new Response(fileData, {
				headers: {
					"Content-Type": "image/webp",
				},
			});
		} catch (err) {
			console.error(`Could not read file: ${localPath}`, err);
			return new Response("Not Found", {
				status: 404,
			});
		}
	});

	const resourceFilter = {
		urls: [
			"*://deadshot.io/weapons/awp/*.webp",
			"*://deadshot.io/weapons/ar2/*.webp",
			"*://deadshot.io/weapons/shotgun/*.webp",
			"*://deadshot.io/weapons/vector/*.webp",
			"*://deadshot.io/skins/compressed/*.webp",
			"*://deadshot.io/promo/*.webp",
			"*://deadshot.io/textures/*.webp",
		],
	};

	gameWindow.webContents.session.webRequest.onBeforeRequest(
		resourceFilter,
		(reqDetails, next) => {
			const filePath = path.join(
				__dirname,
				"swap",
				new URL(reqDetails.url).pathname,
			);
			if (fs.existsSync(filePath)) {
				next({
					redirectURL: `custom://${new URL(reqDetails.url).pathname}`,
				});
			} else {
				next({
					cancel: false,
				});
			}
		},
	);
	}

});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});