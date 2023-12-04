const axios = require('axios');
require('dotenv').config();
_pingTorrentApi = async () => {
    try {
        const response = await axios.get(process.env.TORRENT_API + 'list_movies.json');
        if (response.status === 200) {
            console.log('Torrent API is up');
        }
    } catch (error) {
        console.error('Torrent API is down, trying backup API');
        try {
            const backupResponse = await axios.get(process.env.BACKUP_TORRENT_API + 'list_movies.json');
            if (backupResponse.status === 200) {
                console.log('Backup Torrent API is up');
                process.env.TORRENT_API = process.env.BACKUP_TORRENT_API;
            } else {
                console.error('Both Torrent APIs are down. Exiting process.');
                process.exit(1); // Exit the process with an error code
            }
        } catch (backupError) {
            console.error('Backup Torrent API is down. Exiting process.');
            // console.error(backupError);
            process.exit(1); // Exit the process with an error code
        }
    }
};
module.exports = _pingTorrentApi;