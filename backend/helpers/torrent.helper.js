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
                // console.log("torrents[i]", torrents[i])
                const magnet = `magnet:?xt=urn:btih:${torrents[i].hash}&dn=${encodedUrl}`;
                // const magnet = `magnet:?xt=urn:btih:0719223EC1C863C85454DAD4F297F2D35F22B15E&amp;dn=Kla%20Fun%20(2024)&amp;tr=udp%3A%2F%2Fglotorrents.pw%3A6969%2Fannounce&amp;tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A80&amp;tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&amp;tr=udp%3A%2F%2Fp4p.arenabg.ch%3A1337&amp;tr=udp%3A%2F%2Ftracker.internetwarriors.net%3A1337`
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