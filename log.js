import fs from 'fs';
import https from 'https';

const main = async () => {
    const args = process.argv.slice(2);
    let packageData = {};
    try {
        packageData = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    } catch {
        process.exit(0);
    }
    const event = args[0] || 'unknown';
    const phaserVersion = packageData.dependencies?.phaser || '4.0.0';

    const options = {
        hostname: 'gryzor.co',
        port: 443,
        path: `/v/${event}/${phaserVersion}/${packageData.name || 'pyramid-secret-chamber'}`,
        method: 'GET'
    };

    try {
        const req = https.request(options, (res) => {
            res.on('data', () => {});
            res.on('end', () => {
                process.exit(0);
            });
        });

        req.on('error', () => {
            process.exit(0);
        });

        req.end();
    } catch {
        process.exit(0);
    }
};

main();
