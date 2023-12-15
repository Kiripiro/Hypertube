const fs = require('fs');
const axios = require('axios');
const subsrt = require('subsrt');


PATH_SUBTITLES_DIR = "/app/subtitles"

const yellow = "\x1b[33m";
const red = "\x1b[31m";
const reset = "\x1b[0m";

class SubtitlesHelper {

    subtitlesApiUrl = "https://api.opensubtitles.com/api/v1/";
    subtitlesDataEndPoint = "subtitles";
    subtitlesDownloadEndPoint = "download";

    async getSubtitlesFileId(imdbId, lang) {
        try {
            const options = {
                method: 'get',
                url: this.subtitlesApiUrl + this.subtitlesDataEndPoint,
                params: { imdb_id: imdbId, languages: lang },
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': 'j5917xSzcZhmoU238ktBEkElYdYnavoh',
                    'User-Agent': 'hypertube v1.2.3'
                }
            };
            const fileId = await axios(options).then(response => {
                if (response.status != 200) {
                    console.log(red + "SUBTITLES_HELPER getSubtitles api don't work (statusCode == " + response.statusCode + ")" + reset);
                    return -1;
                }
                const bodyParsed = response.data;
                if (bodyParsed.data == null || bodyParsed.data == undefined || bodyParsed.data.length == 0) {
                    console.log(red + "SUBTITLES_HELPER subtitles not found (1)" + reset);
                    return 0;
                }
                const data = bodyParsed.data[0];
                if (data.type == null || data.type == undefined || data.type != "subtitle") {
                    console.log(red + "SUBTITLES_HELPER subtitles not found (2)" + reset);
                    return 0;
                }
                const attributes = data.attributes;
                if (attributes == null || attributes == undefined) {
                    console.log(red + "SUBTITLES_HELPER subtitles not found (3)" + reset);
                    return 0;
                }
                const langReceived = attributes.language;
                if (langReceived == null || langReceived == undefined || langReceived != lang) {
                    console.log(red + "SUBTITLES_HELPER subtitles not found (4)" + reset);
                    return 0;
                }
                const files = attributes.files;
                if (files == null || files == undefined || files.length == 0) {
                    console.log(red + "SUBTITLES_HELPER subtitles not found (5)" + reset);
                    return 0;
                }
                const file = attributes.files[0];
                if (file.file_id == null || file.file_id == undefined || file.file_id.length == 0) {
                    console.log(red + "SUBTITLES_HELPER subtitles not found (6)" + reset);
                    return 0;
                }
                return file.file_id;
            });
            return fileId;
        } catch (error) {
            console.error("Subtitles getSubtitlesFileId error", error);
            return -1;
        }
    }

    async downloadSubtitles(imdbId, lang, fileId) {
        try {
            const url = 'https://api.opensubtitles.com/api/v1/download';
            const data = {
                file_id: fileId
            };
            const headers = {
                'Accept': 'application/json',
                'Api-Key': 'j5917xSzcZhmoU238ktBEkElYdYnavoh',
                'Content-Type': 'application/json',
                'User-Agent': 'hypertube v1.2.3'
            };
            const fileData = await axios.post(url, data, { headers: headers }).then(response => {
                if (response.status != 200) {
                    console.log(red + "SUBTITLES_HELPER downloadSubtitles api don't work (statusCode)" + reset);
                    return -1;
                }
                const bodyParsed = response.data;
                if (bodyParsed.link == null || bodyParsed.link == undefined || bodyParsed.link.length == 0) {
                    return 0;
                }
                if (bodyParsed.file_name == null || bodyParsed.file_name == undefined || bodyParsed.file_name.length == 0) {
                    return 0;
                }
                const link = bodyParsed.link;
                const fileName = bodyParsed.file_name;
                return { link: link, fileName: fileName };
            });
            const name = imdbId + "-" + lang + ".srt";
            const path = PATH_SUBTITLES_DIR + "/srt/" + name;
            if (fs.existsSync(path)) {
                console.log(yellow + "SUBTITLES_HELPER getSubtitles subtitles already exist" + reset);
                return name;
            }
            const ret = await axios.get(fileData.link, { responseType: 'stream' })
            .then(response => {
                const writer = fs.createWriteStream(path);

                response.data.pipe(writer);

                return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
                });
            })
            .then(() => {
                return name;
            })
            .catch(error => {
                console.error('Error downloading the file:', error);
                return -1;
            });
            return ret;
        } catch (error) {
            console.error("Subtitles downloadSubtitles error", error.message ? error.message : error);
            return -1;
        }
    }

    async convertSrtToVtt(fileName) {
        try {
            if (fileName == null || fileName == undefined || fileName.length == 0) {
                return null;
            }
            const pathSrt = PATH_SUBTITLES_DIR + "/srt/" + fileName;
            const pathVtt = PATH_SUBTITLES_DIR + "/vtt/" + fileName.replace(".srt", ".vtt");;
            const srtContent = fs.readFileSync(pathSrt, 'utf8');
            let vttContent = subsrt.convert(srtContent, { format: 'vtt' });
            if (vttContent == null || vttContent == undefined || vttContent.length == 0) {
                return null;
            }
            vttContent = vttContent.replace(/^\d+\s+/gm, '');
            vttContent = vttContent.replace(/(\d{2}),(\d{3})/g, '$1.$2');
            await fs.writeFileSync(pathVtt, vttContent, 'utf8');
            return pathVtt;
        } catch (error) {
            console.error("Subtitles convertSrtToVtt error", error);
            return null;
        }
    }

    async getSubtitles(imdbId, lang) {
        try {
            const fileId = await this.getSubtitlesFileId(imdbId, lang);
            if (fileId == -1 || fileId == 0) {
                console.log(red + "SUBTITLES_HELPER getSubtitles fileId error" + reset);
                return fileId;
            }
            const fileName = await this.downloadSubtitles(imdbId, lang, fileId);
            if (fileName == -1) {
                return fileName;
            } else if (fileName == 0) {
                console.log(yellow + "SUBTITLES_HELPER getSubtitles subtitles not found" + reset);
                return fileName;
            } else {
                // console.log(yellow + "SUBTITLES_HELPER getSubtitles subtitles downloaded: " + fileName + reset);
            }
            const convertRet = await this.convertSrtToVtt(fileName);
            if (convertRet == null) {
                console.log(red + "SUBTITLES_HELPER getSubtitles convertSrtToVtt error" + reset);
                return -1;
            }
            console.log(yellow + "SUBTITLES_HELPER getSubtitles subtitles converted (or already exist): " + convertRet + reset);
            return convertRet;
        } catch (error) {
            console.error("Subtitles getSubtitles error", error.message ? error.message : error);
        }
    }

}

module.exports = new SubtitlesHelper();