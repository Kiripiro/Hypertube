const axios = require('axios');
const cheerio = require('cheerio');

FREE_TORRENTS_FILES_TO_COLLECT = [
    {
        name: "big-buck-bunny",
        imdbId: "tt1254207",
        magnet: ""
    },
    {
        name: "cosmos-laundromat",
        imdbId: "tt4957236",
        magnet: ""
    },
    {
        name: "sintel",
        imdbId: "tt1727587",
        magnet: ""
    },
    {
        name: "tears-of-steel",
        imdbId: "tt2285752",
        magnet: ""
    }
]

class freeTorrentScrapper {

    data = [];
    
    constructor() {
    }

    movieBaseUrl = 'https://webtorrent.io/free-torrents';

    async init() {
        try {
            const movies = await axios.get(this.movieBaseUrl).then(async response => {
                const html = response.data;
                const $ = cheerio.load(html);
                const magnetLinks = [];

                $('a').each((i, link) => {
                const href = $(link).attr('href');
                if (href && href.includes('.torrent') && href.includes('magnet:') && FREE_TORRENTS_FILES_TO_COLLECT.some(file => href.includes(file.name))) {
                    magnetLinks.push(href);
                }
                });
                // console.log(magnetLinks);
                this.data = [];
                magnetLinks.forEach(async (magnet) => {
                    const movie = FREE_TORRENTS_FILES_TO_COLLECT.find(file => magnet.includes(file.name));
                    this.data.push({
                        imdbId: movie.imdbId,
                        magnet: magnet
                    })
                });
                return this.data;
            })
            .catch(console.error);
            return movies;
        } catch (error) {
            console.error('freeTorrentScrapper init', error);
            return null;
        }
    }

    getMovieMagnet(id) {
        try {
            console.log("freeTorrentScrapper getMovieMagnet", id)
            console.log("freeTorrentScrapper getMovieMagnet", this.data)
            const movie = this.data.find(movie => movie.imdbId == id);
            if (movie == null || movie == undefined) {
                return null;
            }
            return movie.magnet;
        } catch (error) {
            console.error('freeTorrentScrapper getMovieMagnet', error);
            return null;
        }
    }
    
}

module.exports = new freeTorrentScrapper();