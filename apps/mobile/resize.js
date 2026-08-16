const sharp = require('sharp');
const fs = require('fs');

async function resizeToSquare(filePath) {
    if (!fs.existsSync(filePath)) return;
    try {
        const metadata = await sharp(filePath).metadata();
        const size = Math.min(metadata.width, metadata.height);
        
        await sharp(filePath)
            .extract({
                left: Math.floor((metadata.width - size) / 2),
                top: Math.floor((metadata.height - size) / 2),
                width: size,
                height: size
            })
            .toFile(filePath + '.tmp');
            
        fs.renameSync(filePath + '.tmp', filePath);
        console.log('Successfully resized', filePath, 'to', size + 'x' + size);
    } catch (err) {
        console.error('Error resizing', filePath, ':', err);
    }
}

async function run() {
    await resizeToSquare('./assets/icon.png');
    await resizeToSquare('./assets/adaptive-icon.png');
}

run();
