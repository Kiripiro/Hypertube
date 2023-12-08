require('dotenv').config();
const Transmission = require('transmission')

class TorrentInfos {

    constructor() {
        this.transmission = new Transmission({
            port: 3000
        })
      }
    

    addTorrent = async (torrentUrl) => {
        try {
            // transmission.addUrl(torrentUrl, (err, result) => {
            //     if (err) {
            //         console.error(err);
            //     } else {
            //         console.log(result);
            //     }
            // });
            // transmission.addUrl(torrentUrl, {
            //     "download-dir" : "/app/download"
            // }, function(err, result) {
            //     if (err) {
            //         console.error(err);
            //     } else {
            //         console.log(result);
            //     }
            // });
            // transmission.add(torrentUrl, {
            //     "download-dir" : "/app/download"
            // }, function(err, result) {
            //     if (err) {
            //         console.error(err);
            //     } else {
            //         console.log(result);
            //     }
            // });
            this.transmission.addUrl(
                torrentUrl,
                { 'download-dir': "/app/download" },
                (err, result) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log(result);
                    }
                }
              )
        } catch (error) {
            console.error('TorrentInfos Error addTorrent:', error);
        }
    };

}

module.exports = new TorrentInfos();