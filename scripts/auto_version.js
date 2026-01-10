const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const imagesDir = path.join(projectRoot, 'images');
const htmlFile = path.join(projectRoot, 'playground', 'lumora.html');
const baseName = 'category_accordion';

// 1. Find current version
fs.readdir(imagesDir, (err, files) => {
    if (err) {
        console.error("Error reading images directory:", err);
        return;
    }

    const versionPattern = new RegExp(`^${baseName}_v(\\d+)\\.js$`);
    let maxVersion = 0;
    let currentFile = '';

    files.forEach(file => {
        const match = file.match(versionPattern);
        if (match) {
            const v = parseInt(match[1]);
            if (v > maxVersion) {
                maxVersion = v;
                currentFile = file;
            }
        }
    });

    if (maxVersion === 0) {
        console.error("No versioned file found.");
        return;
    }

    const newVersion = maxVersion + 1;
    const newFile = `${baseName}_v${newVersion}.js`;

    // 2. Rename file
    fs.rename(path.join(imagesDir, currentFile), path.join(imagesDir, newFile), (err) => {
        if (err) {
            console.error("Error renaming file:", err);
            return;
        }
        console.log(`Renamed: ${currentFile} -> ${newFile}`);

        // 3. Update HTML
        fs.readFile(htmlFile, 'utf8', (err, data) => {
            if (err) {
                console.error("Error reading HTML file:", err);
                return;
            }

            const updatedData = data.replace(new RegExp(`${baseName}_v\\d+\\.js`, 'g'), newFile);

            fs.writeFile(htmlFile, updatedData, 'utf8', (err) => {
                if (err) {
                    console.error("Error writing HTML file:", err);
                    return;
                }
                console.log(`Updated HTML reference to: ${newFile}`);
            });
        });
    });
});
