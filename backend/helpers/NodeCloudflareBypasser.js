
/**
 * Class: NodeCloudflareBypasser
 * 
 * Summary:
 * The NodeCloudflareBypasser class is used to bypass Cloudflare protection on websites. It provides methods for sending HTTP requests, handling redirects, solving JavaScript challenges, and parsing response objects.
 * 
 * Methods:
 * - constructor(opts): Initializes a new instance of the NodeCloudflareBypasser class with optional parameters.
 * - request(uri, options): Sends an HTTP request to the specified URL with optional request parameters.
 * - userAgent: Gets the user agent string used in the HTTP requests.
 * - jar: Gets the cookie jar used in the HTTP requests.
 * - setupRequestParams(uri, options): Sets up the request parameters with default and user-provided values.
 * - setupHeaders(params): Sets up the request headers.
 * - setupUserAgent(params): Sets up the user-agent header.
 * - setupReferer(params): Sets up the referer header.
 * - setupCookies(params): Sets up cookies from the request headers.
 * - handleResponse(res, params): Handles the HTTP response and performs actions based on the result.
 * - handleRedirect(result, params): Handles the case when a redirect is detected.
 * - handleChallenge(challenge, res, params): Handles the case when a challenge is detected.
 * - buildChallengeQueryString(challenge): Builds the query string for the JavaScript challenge.
 * - handleError(error, params): Handles errors during the HTTP request.
 * - shouldRetry(error, params): Determines whether to retry the request based on the error and parameters.
 * - parse(response): Parses the response object of an HTTP request.
 * - findRedirect(response): Finds the redirect URL in the response object of an HTTP request.
 * - findError(text): Finds the error code in the response body of an HTTP request.
 * - findCaptcha(text): Finds the captcha challenge in the response body of an HTTP request.
 * - solveCaptcha(data): Solves the captcha challenge in the response body of an HTTP request.
 * - findChallenge(text, domain): Finds the JavaScript challenge in the response body of an HTTP request.
 * - solveChallenge(code): Solves the JavaScript challenge in the response body of an HTTP request.
 * 
 * Properties:
 * - userAgent: Gets the user agent string used in the HTTP requests.
 * - jar: Gets the cookie jar used in the HTTP requests.
 * 
 * Example usage:
 * const bypasser = new NodeCloudflareBypasser();
 * bypasser.request('https://example.com', { timeout: 5000 })
 * .then(response => {
 *      console.log(response.body);
 *  })
 *  .catch(error => {
 *      console.error(error);
 *  });
 * 
 * @param {object} opts - Optional parameters for the NodeCloudflareBypasser class.
 * @returns {NodeCloudflareBypasser} - An instance of the NodeCloudflareBypasser class.
 */
'use strict';

const { URL } = require('url');
const Promise = require('bluebird');
const rp = require('request-promise');
const vm = require('vm');

const DELAY = 5 * 1000;

const REGEXP = {
    jschl_vc: /name="jschl_vc" value="(\w+)"/,
    pass: /name="pass" value="(.+?)"/,
    challenge: /setTimeout\(function\(\){\s+(var s,t,o,p,b,r,e,a,k,i,n,g,f.+?\r?\n[\s\S]+?a\.value =.+?)\r?\n/i,
    delay: /setTimeout[\s\S]+f.submit\(\);\s*},\s*(\d+)\);/i
};

const DEFAULT_USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/65.0.3325.181 Chrome/65.0.3325.181 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 7.0; Moto G (5) Build/NPPS25.137-93-8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.137 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 7_0_4 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11B554a Safari/9537.53',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:60.0) Gecko/20100101 Firefox/60.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:59.0) Gecko/20100101 Firefox/59.0',
    'Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:57.0) Gecko/20100101 Firefox/57.0'
];


/** 
 * Function: loLowerCaseObject
 * Converts all keys of an object to lowercase.
 * @param {object} obj - The object to convert.
 * @returns {object} - The converted object.
*/
function loLowerCaseObject(obj) {
    let res = obj;

    Object.keys(res).forEach(oldKey => {
        let newKey = oldKey.toLowerCase();
        if (newKey !== oldKey) {
            res[newKey] = res[oldKey];
            delete res[oldKey];
        }
    });
    return res;
}

class NodeCloudflareBypasser {

    constructor(opts = {}) {
        this._delay = opts.delay || DELAY;
        this._headers = loLowerCaseObject(opts.headers || {});
        this._userAgent = opts.userAgent || DEFAULT_USER_AGENTS[Math.floor(Math.random() * DEFAULT_USER_AGENTS.length)];
        this._jar = opts.jar || rp.jar();
        this._rp = rp.defaults({ jar: this._jar });
    }

    get userAgent() {
        return this._userAgent;
    }

    get jar() {
        return this._jar;
    }

    /**
     * Function: request
     * Sends an HTTP request.
     * @param {string} uri - The URL to send the request to.
     * @param {object} options - Optional parameters for the request, including headers, redirects, and cookies.
     * @returns {Promise} - A Promise that resolves to the response object of the HTTP request.
     */
    request(uri, options) {
        // Set default parameters
        const params = this.setupRequestParams(uri, options);

        // Make the HTTP request
        return this._rp(params)
            .then(res => this.handleResponse(res, params))
            .catch(error => this.handleError(error, params));
    }

    /**
     * Sets up the request parameters with defaults and user-provided values.
     * @param {string} uri - The URL to send the request to.
     * @param {object} options - Optional parameters for the request, including headers, redirects, and cookies.
     * @returns {object} - Request parameters object.
     */
    setupRequestParams(uri, options) {
        const params = {
            headers: {},
            maxRedirects: 10,
            _redirectsCounter: 0,
            resolveWithFullResponse: true,
            simple: false,
            followRedirect: false,
            timeout: options && options.timeout ? options.timeout : undefined,
        };

        // Merge user-provided options with default params
        if (typeof options === 'object') {
            Object.assign(params, options, { uri });
        } else if (typeof uri === 'string') {
            Object.assign(params, { uri });
        } else {
            Object.assign(params, uri);
        }

        // Additional setup
        this.setupHeaders(params);
        this.setupUserAgent(params);
        if (params.uri)
            this.setupReferer(params);
        this.setupCookies(params);

        return params;
    }

    /**
     * Sets up the request headers.
     * @param {object} params - Request parameters object.
     */
    setupHeaders(params) {
        params.headers = Object.assign({}, this._headers, loLowerCaseObject(params.headers));

        // Handle accept-encoding
        if (typeof params.headers['accept-encoding'] === 'string' && params.headers['accept-encoding'].includes('gzip')) {
            params.gzip = true;
        }
    }

    /**
     * Sets up the user-agent header.
     * @param {object} params - Request parameters object.
     */
    setupUserAgent(params) {
        params.headers['user-agent'] = params.headers['user-agent'] || this._userAgent;
    }

    /**
     * Sets up the referer header.
     * @param {object} params - Request parameters object.
     */
    setupReferer(params) {
        if (params.uri && params.uri.protocol && params.uri.host) {
            const referer = `${params.uri.protocol}//${params.uri.host}/`;
            params.headers['referer'] = params.headers['referer'] || referer;
        } else {
            console.error('Invalid URI:', params.uri);
        }
    }

    /**
     * Sets up cookies from the request headers.
     * @param {object} params - Request parameters object.
     */
    setupCookies(params) {
        if (typeof params.headers['cookie'] === 'string') {
            const cookies = params.headers['cookie'].split(';');
            cookies.forEach(cookie => {
                this.jar.setCookie(cookie, params.uri);
            });
            delete params.headers['cookie'];
        }
    }

    /**
     * Handles the HTTP response and performs actions based on the result.
     * @param {object} res - HTTP response object.
     * @param {object} params - Request parameters object.
     * @returns {Promise} - A Promise that resolves to the response object of the HTTP request.
     */
    handleResponse(res, params) {
        const result = NodeCloudflareBypasser.parse(res);

        if (result.redirect) {
            return this.handleRedirect(result, params);
        }
        if (result.error) {
            throw new Error(`ERROR: ${result.error}`);
        }
        if (result.captcha) {
            throw new Error('CAPTCHA');
        }
        if (result.challenge) {
            return this.handleChallenge(result.challenge, res, params);
        }
        return res;
    }

    /**
     * Handles the case when a redirect is detected.
     * @param {object} result - Parsed response object.
     * @param {object} params - Request parameters object.
     * @returns {Promise} - A Promise that resolves to the response object of the HTTP request.
     */
    handleRedirect(result, params) {
        params._redirectsCounter++;

        const maxRedirects = parseInt(params.maxRedirects);
        if (
            !Number.isNaN(params._redirectsCounter) &&
            !Number.isNaN(maxRedirects) &&
            maxRedirects > 0 &&
            params._redirectsCounter >= maxRedirects
        ) {
            return Promise.reject(new Error('TOO_MUCH_REDIRECTS'));
        }

        params.uri = result.redirect;
        delete params.qs;
        delete params.url;
        return this.request(params);
    }

    /**
     * Handles the case when a challenge is detected.
     * @param {object} result - Parsed response object.
     * @param {object} res - HTTP response object.
     * @param {object} params - Request parameters object.
     * - uri: The URL to send the request to.
     * - headers: Request headers.
     * - qs: Query string parameters.
     * @returns {Promise} - A Promise that resolves to the response object of the HTTP request.
     */
    handleChallenge(challenge, res, params) {
        const url = `${res.request.uri.protocol}//${res.request.uri.host}/cdn-cgi/l/chk_jschl`;
        const qs = this.buildChallengeQueryString(challenge);
        params.headers['referer'] = res.request.uri.href;
        params.uri = new URL(url);
        params.qs = qs;
        return Promise.delay(this._delay).then(_ => this.request(params));
    }

    /**
     * Builds the query string for the JavaScript challenge.
     * @param {object} challenge - Parsed challenge object.
     * @returns {object} - Query string parameters.
     */
    buildChallengeQueryString(challenge) {
        return {
            jschl_vc: challenge.jschl_vc,
            pass: challenge.pass,
            jschl_answer: challenge.resolved,
        };
    }

    /**
     * Handles errors during the HTTP request.
     * @param {Error} error - The error object.
     * @param {object} params - Request parameters object.
     * @returns {Promise} - A Promise that rejects with the error object.
     */
    handleError(error, params) {
        console.error(`[${new Date().toISOString()}] Error in request:`, error.message);

        if (error.name === 'RequestError' && error.cause.code === 'ENOTFOUND') {
            console.error('Network error: The server is not reachable.');
        } else if (error.message === 'TOO_MUCH_REDIRECTS') {
            console.error('Error: Too many redirects.');
        } else if (this.shouldRetry(error, params)) {
            console.log('Retrying after delay...');
            return Promise.delay(this._delay).then(() => this.request(params));
        }

        return Promise.reject(error);
    }

    /**
     * Determines whether to retry the request based on the error and parameters.
     * @param {Error} error - The error object.
     * @param {object} params - Request parameters object.
     * @returns {boolean} - True if a retry should be attempted, false otherwise.
     */
    shouldRetry(error, params) {
        return error.name === 'RequestError' && error.cause.code === 'ETIMEDOUT';
    }

    /**
     * Function: parse
     * Parses the response object of an HTTP request.
     * @param {object} response - The response object of an HTTP request.
     * @returns {object} - An object containing information about the response.
     *  - status: The status code of the response.
     * - redirect: The URL to redirect to, if any.
     * - error: An error code, if any.
     * - captcha: A boolean indicating if a captcha challenge is present.
     * - challenge: An object containing information about the JavaScript challenge, if present.
     */
    static parse(response = {}) {
        let body = response.body;
        let uri = response.request.uri;

        let result = {
            status: response.statusCode,
            redirect: null,
            error: null,
            captcha: null,
            challenge: null
        }

        result.redirect = this.findRedirect(response);
        if (result.redirect) return result;

        result.error = this.findError(body);
        if (result.error) return result;

        result.captcha = this.findCaptcha(body);
        if (result.captcha) return result;

        result.challenge = this.findChallenge(body, uri.host);
        if (result.challenge) {
            result.challenge.resolved = this.solveChallenge(result.challenge.challenge);
        }

        return result;
    }

    /**
     * Function: findRedirect
     * Finds the redirect URL in the response object of an HTTP request.
     * @param {object} response - The response object of an HTTP request.
     * @returns {string} - The redirect URL, if any.
     */
    static findRedirect(response = {}) {
        const { request: { uri }, headers } = response;

        if (headers && typeof headers.location === 'string') {
            const url = new URL(headers.location);
            if (url.host) {
                return headers.location;
            }
            return `${uri.protocol}://${uri.host}${headers.location}`;
        }
        return false;
    }

    /**
     * Function: findError
     * Finds the error code in the response body of an HTTP request.
     * @param {string} text - The response body of an HTTP request.
     * @returns {number} - The error code, if any.
     */
    static findError(text = '') {
        const match = text.match(/<\w+\s+class="cf-error-code">(.*)<\/\w+>/i);
        if (match) {
            return parseInt(match[1]);
        }
        return false;
    }

    /**
     * Function: findCaptcha
     * Finds the captcha challenge in the response body of an HTTP request.
     * @param {string} text - The response body of an HTTP request.
     * @returns {boolean} - A boolean indicating if a captcha challenge is present.
     */
    static findCaptcha(text = '') {
        return (text.includes('why_captcha') || text.includes('g-recaptcha'));
    }

    /**
     * Function: solveCaptcha
     * Solves the captcha challenge in the response body of an HTTP request.
     * @param {object} data - The response body of an HTTP request.
     * @returns {object} - An object containing information about the captcha challenge, if present.
     */
    static solveCaptcha(data = {}) {
        if (data.captcha && data.captcha.url) {
            throw new Error('ERROR:captcha');
        }
        return data.captcha;
    }

    /**
     * Function: findChallenge
     * Finds the JavaScript challenge in the response body of an HTTP request.
     * @param {string} text - The response body of an HTTP request.
     * @param {string} domain - The domain name of the request URL.
     * @returns {object} - An object containing information about the JavaScript challenge, if present.
     */
    static findChallenge(text = '', domain = '') {
        let jschl_vc = text.match(REGEXP.jschl_vc)?.[1] || null;
        let pass = text.match(REGEXP.pass)?.[1] || null;
        let delay = text.match(REGEXP.delay)?.[1] || null;
        let challenge = text.match(REGEXP.challenge)?.[1] || null;

        if (challenge) {
            challenge = challenge.replace(/a\.value = (.+ \+ t\.length).+/i, '$1')
                .replace(/\s{3,}[a-z](?: = |\.).+/g, '')
                .replace('t.length', '' + domain.length)
                .replace(/'; \d+'/g, '')
                .replace(/[\n\\']/g, '');

            if (!challenge.includes('toFixed')) {
                throw new Error('ERROR:parsing challenge');
            }
        }

        if (jschl_vc && pass && challenge) {
            return {
                jschl_vc,
                pass,
                challenge,
                delay: parseFloat(delay)
            };
        } else {
            return null;
        }
    }

    /**
     * Function: solveChallenge
     * Solves the JavaScript challenge in the response body of an HTTP request.
     * @param {string} code - The JavaScript challenge code.
     * @returns {number} - The solution to the challenge.
     */
    static solveChallenge(code = '') {
        const sandbox = {};
        vm.createContext(sandbox);
        return vm.runInContext(code, sandbox);
    }

}

module.exports = NodeCloudflareBypasser;