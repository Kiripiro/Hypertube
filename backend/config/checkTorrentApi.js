require('dotenv').config();
const NodeCloudflareBypasser = require('../helpers/NodeCloudflareBypasser');
let cf = new NodeCloudflareBypasser();

_pingTorrentApi = async () => {
    try {
        console.log('Pinging Torrent API...');
        const response = cf.request({
            url: process.env.TORRENT_API + 'list_movies.json',
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            }
        });
        if (response.status === 200) {
            console.log('Torrent API is up');
        }
    } catch (error) {
        console.error('Torrent API is down, trying backup API');
        try {
            const backupResponse = await cf.request({
                url: process.env.BACKUP_TORRENT_API + 'list_movies.json',
                headers: {
                    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                }
            });
            if (backupResponse.status === 200) {
                console.log('Backup Torrent API is up');
                process.env.TORRENT_API = process.env.BACKUP_TORRENT_API;
            } else {
                console.error('Both Torrent APIs are down. Exiting process.');
                process.exit(1); // Exit the process with an error code
            }
        } catch (backupError) {
            console.error('Backup Torrent API is down. Exiting process.');
            console.error(backupError);
            process.exit(1); // Exit the process with an error code
        }
    }
};

const main = async () => {
    await _pingTorrentApi();
};

main();