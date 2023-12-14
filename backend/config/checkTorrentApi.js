const axiosInstance = require('./axiosConfig');
require('dotenv').config();
_pingTorrentApi = async () => {
    try {
        console.log('Pinging Torrent API');
        const response = await axiosInstance.get(process.env.TORRENT_API + 'list_movies.json');
        console.log(response.headers);
        if (response.status === 200) {
            console.log('Torrent API is up');
        }
    } catch (error) {
        console.error('Torrent API is down, trying backup API');
        try {
            const backupResponse = await axiosInstance.get(process.env.BACKUP_TORRENT_API + 'list_movies.json');
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