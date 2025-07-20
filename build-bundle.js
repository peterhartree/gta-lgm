const fs = require('fs');
const path = require('path');

// Read all JavaScript files in order
const files = [
    'src/entities/Vehicle.js',
    'src/entities/PoliceVehicle.js',
    'src/entities/Pedestrian.js',
    'src/entities/Bullet.js',
    'src/ui/ControlsUI.js',
    'src/ui/WantedLevelUI.js',
    'src/audio/SoundManager.js',
    'src/scenes/BootScene.js',
    'src/scenes/PreloadScene.js',
    'src/scenes/StartScene.js',
    'src/scenes/GameScene.js',
    'src/game.js'
];

// Combine all files
let bundleContent = '// Auto-generated bundle - ' + new Date().toISOString() + '\n\n';

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    bundleContent += `// === ${file} ===\n${content}\n\n`;
});

// Generate hash based on content
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(bundleContent).digest('hex').substring(0, 8);
const bundleFilename = `game.bundle.${hash}.js`;

// Write bundle
fs.writeFileSync(path.join('dist', bundleFilename), bundleContent);

// Update index.html in dist
const indexPath = path.join('dist', 'index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

// Remove all individual script tags
indexContent = indexContent.replace(/<script src="src\/.*?\.js"><\/script>\n/g, '');

// Add bundle script tag before closing body
const bundleScript = `<script src="${bundleFilename}"></script>`;
indexContent = indexContent.replace('</body>', `    ${bundleScript}\n</body>`);

fs.writeFileSync(indexPath, indexContent);

console.log(`Bundle created: ${bundleFilename}`);