// sync-version.js
// Sync version from package.json to tauri.conf.json and Cargo.toml
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = pkg.version;
console.log(`Version: ${version}`);

// Update tauri.conf.json
const tauriConfPath = path.join(root, "src-tauri", "tauri.conf.json");
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, "utf8"));
tauriConf.version = version;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + "\n");
console.log("  ✓ tauri.conf.json");

// Update Cargo.toml
const cargoPath = path.join(root, "src-tauri", "Cargo.toml");
let cargo = fs.readFileSync(cargoPath, "utf8");
cargo = cargo.replace(/^version\s*=\s*".*"/m, `version = "${version}"`);
fs.writeFileSync(cargoPath, cargo);
console.log("  ✓ Cargo.toml");

console.log("Done!");
