require('dotenv').config();

class TorrentHelper {
    
    sortTorrents = (torrents, titleLong) => {
        try {
            if (torrents == null || torrents == undefined || torrents.length <= 0) {
                throw Error("No torrents found");
            }
            let retTab = [];
            let retTab2 = [];
            const encodedUrl = titleLong.replaceAll(" ", "%20");
            for (let i = 0; i < torrents.length; i++) {
                const magnet = `magnet:?xt=urn:btih:${torrents[i].hash}&dn=${encodedUrl}`;
                if (torrents[i].quality != undefined && torrents[i].quality == "720p") {
                    retTab.push(
                        {
                            magnet: magnet,
                            hash: torrents[i].hash,
                            quality: torrents[i].quality,
                            size_bytes: torrents[i].size_bytes,
                            seeds: torrents[i].seeds
                        });
                }
                else {
                    retTab2.push(
                        {
                            magnet: magnet,
                            hash: torrents[i].hash,
                            quality: torrents[i].quality,
                            size_bytes: torrents[i].size_bytes,
                            seeds: torrents[i].seeds
                        });
                }
            }
            retTab = retTab.concat(retTab2);
            retTab.sort((a, b) => {
                return b.seeds - a.seeds
            });
            return retTab;
        } catch (error) {
            console.error('TorrentHelper sortTorrent', error);
            return null;
        }
    };

}

module.exports = new TorrentHelper();