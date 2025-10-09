// write-commit.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
    // get the short commit hash
    const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
    const commitDate = execSync('git log -1 --format=%cd --date=iso').toString().trim();

    // write to a JSON file in your app directory
    const outFile = path.join(__dirname, 'commit.json');
    fs.writeFileSync(outFile, JSON.stringify({ commit: commitHash, date: commitDate }, null, 2));

    console.log(`Commit info written: ${commitHash} (${commitDate})`);
} catch (e) {
    console.error('Failed to write commit hash:', e);
    process.exit(1);
}
