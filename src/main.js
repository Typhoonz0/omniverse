//  __   _  _  __ _  __  _  _  ____  ____  ____  ____
// /  \ ( \/ )(  ( \(  )/ )( \(  __)(  _ \/ ___)(  __)
//(  O )/ \/ \/    / )( \ \/ / ) _)  )   /\___ \ ) _) 
// \__/ \_)(_/\_)__)(__) \__/ (____)(__\_)(____/(____)
//
// DO NOT DISTRIBUTE WITHOUT CREDIT

// CREDITS:
// By xLiam1 | xliam.space


const { app, BrowserWindow, protocol } = require("electron");
const RPC = require("discord-rpc");
const path = require("path");
const fs = require("fs");
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');
// for multiple listeners on session
const betterWebRequest = require('electron-better-web-request');

let resourceSwapper;
let rpc;

// Checks a few locations for the rest of the code as path.dirname and __dirname by default is different on the compiled release and the interpreted release 
// This is an Electron issue and i can't fix it
// This function would go in utils.js as it will belong in multiple files but I can't find utils.js without it 
function resolveBase(startDir) {
	function findFolder(dir, name) {
		while (!fs.existsSync(path.join(dir, name)) && path.dirname(dir) !== dir) {
			dir = path.dirname(dir);
		}
		return fs.existsSync(path.join(dir, name)) ?
			path.join(dir, name) :
			null;
	}

	let omniversePath =
		findFolder(startDir, "omniverse") ||
		findFolder(startDir, "app") ||
		findFolder(startDir, "src");

	if (!omniversePath) {
		console.error('Neither "omniverse", "app", nor "src" was found!');
		return null;
	}

	return omniversePath;
}
omniversePath = resolveBase(__dirname);


const settingsPath = path.join(omniversePath, 'src', "settings.json");

if (fs.existsSync(settingsPath)) {
	try {
		const config = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
		if (config.disableFrameRateLimit) app.commandLine.appendSwitch("disable-frame-rate-limit"); // This usually makes the gameplay experience awful but kids like when FPS go up so whatever
		if (config.forceHighPerformanceGPU) app.commandLine.appendSwitch("force_high_performance_gpu");
		resourceSwapper = config.swapper;
		rpc = config.rpc;
	} catch (err) {
		console.error("Error parsing settings.json:", err);
	}
}

// Shows Omniverse on the user's Discord status
if (rpc) {
	const clientId = "1426074176518881373";
	let rpcClient;
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
				}, ],
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

// Creates a window and executes the rest of the Javascript the client needs to
const createWindow = () => {
	const windowOptions = {
		show: true,
		title: "Omniverse",
		fullscreen: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			nodeIntegration: true,
			contextIsolation: false,
			webSecurity: false,
			enableRemoteModule: true,
			sandbox: false
		},
	};

	const gameWindow = new BrowserWindow(windowOptions);
	gameWindow.setMenuBarVisibility(false);
	gameWindow.loadURL("https://deadshot.io");

	gameWindow.webContents.on("did-finish-load", () => {
		const scriptPath = path.join(__dirname, "script.js");
		if (fs.existsSync(scriptPath)) {
			console.log("If the error is 'An object could not be cloned' that doesn't affect us.")
			const code = fs.readFileSync(scriptPath, "utf8");
			gameWindow.webContents
				.executeJavaScript(code)
				.then(() => console.log("script.js injected"))
				.catch((err) => console.error("Failed to inject script.js", err));
		}
	});
	
	return gameWindow;
};

// Recursively search for a file by name
function findFileRecursive(baseDir, targetName) {
	const entries = fs.readdirSync(baseDir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(baseDir, entry.name);

		if (entry.isFile() && entry.name === targetName) {
			return fullPath;
		}

		if (entry.isDirectory()) {
			const result = findFileRecursive(fullPath, targetName);
			if (result) return result;
		}
	}

	return null;
}

app.whenReady().then(() => {

	const gameWindow = createWindow();

	// allow multiple onBeforeRequest listeners
	betterWebRequest.default(gameWindow.webContents.session);
	gameWindow.webContents.session.webRequest.setResolver(
		"onBeforeRequest",
		async (listeners) => {
			let finalResponse = { cancel: false };

			for (const listener of listeners) {
				const result = await listener.apply();
				finalResponse = { ...finalResponse, ...result };
			}

			return finalResponse;
		},
	);

	if (resourceSwapper) {
		// custom:// protocol handler
		protocol.handle("custom", async (req) => {
			const relativePath = req.url.slice(7);
			const localPath = path.join(__dirname, "swap", relativePath);

			try {
				const fileData = await fs.promises.readFile(localPath);
				return new Response(fileData, {
					headers: { "Content-Type": "image/webp" },
				});
			} catch {
				return new Response("Not Found", { status: 404 });
			}
		});

		const resourceFilter = {
			urls: [
				"*://deadshot.io/weapons/*",
				"*://deadshot.io/skins/*",
				"*://deadshot.io/promo/*",
				"*://deadshot.io/textures/*",
				"*://deadshot.io/character/*",
				"*://deadshot.io/maps/*",
			],
		};

		gameWindow.webContents.session.webRequest.onBeforeRequest(
			resourceFilter,
			(reqDetails, next) => {
				const url = new URL(reqDetails.url);
				const fileName = path.basename(url.pathname);
				const swapRoot = path.join(__dirname, "swap");

				let foundFile = null;

				if (fs.existsSync(swapRoot)) {
					foundFile = findFileRecursive(swapRoot, fileName);
				}

				if (foundFile) {
					const relative = path.relative(swapRoot, foundFile);

					next({
						redirectURL: `custom://${relative.replace(/\\/g, "/")}`,
					});
				} else {
					next({ cancel: false });
				}
			},
		);
	}

	ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
		blocker.enableBlockingInSession(gameWindow.webContents.session);
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});