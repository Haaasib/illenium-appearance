const path = require('path');
const https = require('https');

const DEFAULT_PATH = 'illenium-appearance/clothing';
const RESOURCE = GetCurrentResourceName();
const CONFIG_REL = 'shared/config.lua';

let PNG = null;
let pngTried = false;
let fmConfig = {
    apiKey: '',
    path: DEFAULT_PATH,
    baseUrl: '',
};

function getPNG() {
    if (pngTried) return PNG;
    pngTried = true;
    try {
        PNG = require('pngjs').PNG;
    } catch (err) {
        PNG = null;
        console.log('^3[capturecloth]^0 pngjs missing - raw upload only');
    }
    return PNG;
}

function extractBaseUrl(fileUrl) {
    const root = (fmConfig.path || DEFAULT_PATH).replace(/^\/+|\/+$/g, '');
    if (!fileUrl || !root) return '';
    const marker = '/' + root;
    const idx = String(fileUrl).indexOf(marker);
    if (idx <= 0) return '';
    return String(fileUrl).slice(0, idx).replace(/\/$/, '');
}

function saveBaseUrlToConfig(baseUrl) {
    if (!baseUrl || fmConfig.baseUrl) return;
    fmConfig.baseUrl = baseUrl;
    try {
        const text = LoadResourceFile(RESOURCE, CONFIG_REL);
        if (typeof text !== 'string' || !text) {
            console.log('^3[capturecloth]^0 Could not read config for BaseUrl');
            return;
        }
        let next = text.replace(/BaseUrl\s*=\s*""/, 'BaseUrl = "' + baseUrl + '"');
        if (next === text) {
            next = text.replace(/(BaseUrl\s*=\s*")([^"]*)(")/, '$1' + baseUrl + '$3');
        }
        if (next === text) {
            console.log('^3[capturecloth]^0 BaseUrl line not found in config');
            return;
        }
        const ok = SaveResourceFile(RESOURCE, CONFIG_REL, next, -1);
        if (!ok) {
            console.log('^3[capturecloth]^0 SaveResourceFile failed for BaseUrl');
            return;
        }
        console.log('^2[capturecloth]^0 BaseUrl saved to config');
    } catch (err) {
        console.log('^3[capturecloth]^0 BaseUrl save failed: ' + (err.message || err));
    }
}

function loadFmConfigFromFile() {
    const text = LoadResourceFile(RESOURCE, CONFIG_REL);
    if (typeof text !== 'string' || !text) {
        console.log('^3[capturecloth]^0 Could not read config');
        return;
    }
    const key = text.match(/ApiKey\s*=\s*"([^"]*)"/);
    const base = text.match(/BaseUrl\s*=\s*"([^"]*)"/);
    fmConfig.apiKey = key && key[1] ? key[1].trim() : '';
    fmConfig.baseUrl = base && base[1] ? base[1].replace(/\/$/, '') : '';
    fmConfig.path = DEFAULT_PATH;
    console.log('^2[capturecloth]^0 Fivemanage ' + (fmConfig.apiKey ? 'ready' : 'ApiKey MISSING') + (fmConfig.baseUrl ? (' | ' + fmConfig.baseUrl) : ' | BaseUrl empty (fills on first upload)'));
}

function stripDataUri(b64) {
    if (typeof b64 !== 'string') return b64;
    if (!b64.startsWith('data:')) return b64;
    const comma = b64.indexOf(',');
    return comma === -1 ? b64 : b64.slice(comma + 1);
}

function removeChromaKey(png, mode) {
    const d = png.data;
    const w = png.width, h = png.height;
    const isMagenta = mode === 'magenta';
    const totalPx = w * h;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        let kill = false;
        if (isMagenta) {
            kill = r > 40 && b > 40 && g < ((r < b ? r : b) - 15);
        } else {
            kill = g > 40 && g > r + 15 && g > b + 15;
        }
        if (kill) d[i + 3] = 0;
    }
    const src = new Uint8Array(totalPx);
    for (let i = 0; i < totalPx; i++) src[i] = d[(i << 2) + 3];
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            const a = src[idx];
            if (a === 0 || a === 255) {
                if (src[idx - 1] === a && src[idx + 1] === a && src[idx - w] === a && src[idx + w] === a) continue;
            }
            d[(idx << 2) + 3] = ((src[idx] + src[idx - 1] + src[idx + 1] + src[idx - w] + src[idx + w]) / 5 + 0.5) | 0;
        }
    }
    return png;
}

function resizePNG(LibPNG, png, targetW, targetH) {
    if (png.width === targetW && png.height === targetH) return png;
    const srcAspect = png.width / png.height;
    const dstAspect = targetW / targetH;
    let cropX = 0, cropY = 0, cropW = png.width, cropH = png.height;
    if (srcAspect > dstAspect) {
        cropW = Math.round(png.height * dstAspect);
        cropX = Math.round((png.width - cropW) / 2);
    } else if (srcAspect < dstAspect) {
        cropH = Math.round(png.width / dstAspect);
        cropY = Math.round((png.height - cropH) / 2);
    }
    const dst = new LibPNG({ width: targetW, height: targetH, fill: true });
    const sd = png.data, dd = dst.data;
    const sw = png.width;
    const xRatio = cropW / targetW;
    const yRatio = cropH / targetH;
    const maxCropX = cropX + cropW - 1;
    const maxCropY = cropY + cropH - 1;
    for (let y = 0; y < targetH; y++) {
        const srcY = cropY + (y + 0.5) * yRatio - 0.5;
        const y0 = srcY < 0 ? 0 : (srcY | 0);
        const y1 = y0 < maxCropY ? y0 + 1 : maxCropY;
        const yf = srcY < 0 ? 0 : srcY - y0;
        const yf1 = 1 - yf;
        const rowA = y0 * sw;
        const rowB = y1 * sw;
        for (let x = 0; x < targetW; x++) {
            const srcX = cropX + (x + 0.5) * xRatio - 0.5;
            const x0 = srcX < 0 ? 0 : (srcX | 0);
            const x1 = x0 < maxCropX ? x0 + 1 : maxCropX;
            const xf = srcX < 0 ? 0 : srcX - x0;
            const xf1 = 1 - xf;
            const i00 = (rowA + x0) << 2;
            const i10 = (rowA + x1) << 2;
            const i01 = (rowB + x0) << 2;
            const i11 = (rowB + x1) << 2;
            const di = (y * targetW + x) << 2;
            const w00 = xf1 * yf1, w10 = xf * yf1, w01 = xf1 * yf, w11 = xf * yf;
            dd[di] = (sd[i00] * w00 + sd[i10] * w10 + sd[i01] * w01 + sd[i11] * w11 + 0.5) | 0;
            dd[di + 1] = (sd[i00 + 1] * w00 + sd[i10 + 1] * w10 + sd[i01 + 1] * w01 + sd[i11 + 1] * w11 + 0.5) | 0;
            dd[di + 2] = (sd[i00 + 2] * w00 + sd[i10 + 2] * w10 + sd[i01 + 2] * w01 + sd[i11 + 2] * w11 + 0.5) | 0;
            dd[di + 3] = (sd[i00 + 3] * w00 + sd[i10 + 3] * w10 + sd[i01 + 3] * w01 + sd[i11 + 3] * w11 + 0.5) | 0;
        }
    }
    return dst;
}

function splitRelKey(relKey) {
    const clean = String(relKey || '').replace(/\\/g, '/').replace(/\.(png|webp|jpg|jpeg)$/i, '');
    const parts = clean.split('/').filter(Boolean);
    const file = ((parts.pop() || '0').replace(/[^\w.\-]+/g, '_') || '0') + '.png';
    const sub = parts.join('/');
    const root = (fmConfig.path || DEFAULT_PATH).replace(/^\/+|\/+$/g, '');
    return {
        path: sub ? (root + '/' + sub) : root,
        filename: file,
        key: clean,
    };
}

function uploadToFivemanage(buffer, relKey) {
    return new Promise((resolve, reject) => {
        const apiKey = fmConfig.apiKey;
        if (!apiKey) {
            reject(new Error('Fivemanage ApiKey missing in Config.ClothingImages.Fivemanage.ApiKey'));
            return;
        }
        const parts = splitRelKey(relKey);
        const body = JSON.stringify({
            base64: 'data:image/png;base64,' + buffer.toString('base64'),
            filename: parts.filename,
            path: parts.path,
        });
        const req = https.request({
            hostname: 'api.fivemanage.com',
            path: '/api/v3/file/base64',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: apiKey,
                'Content-Length': Buffer.byteLength(body),
                'User-Agent': 'illenium-appearance',
            },
            timeout: 25000,
        }, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                const text = Buffer.concat(chunks).toString('utf8');
                let json = null;
                try { json = JSON.parse(text); } catch (_) {}
                const url = json && json.data && (json.data.url || json.data.originalUrl);
                if (res.statusCode >= 200 && res.statusCode < 300 && url) {
                    resolve({ url: url, key: parts.key, path: parts.path, filename: parts.filename });
                    return;
                }
                reject(new Error('Fivemanage HTTP ' + res.statusCode + ': ' + (text || '').slice(0, 240)));
            });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Fivemanage upload timeout')); });
        req.write(body);
        req.end();
    });
}

const MAX_PAYLOAD_BYTES = 20 * 1024 * 1024;

async function processAndUpload(payload, imageData) {
    const xFilename = typeof payload.filename === 'string' ? payload.filename : '';
    const wantTransp = payload.transparent === true || payload.transparent === '1' || payload.transparent === 1;
    const chromaKey = typeof payload.chromaKey === 'string' ? payload.chromaKey.toLowerCase() : 'green';
    const wantWidth = parseInt(payload.width) || 0;
    const wantHeight = parseInt(payload.height) || 0;

    if (!xFilename || /[\\/]\.\.(?:[\\/]|$)/.test(xFilename) || path.isAbsolute(xFilename)) {
        return { ok: false, message: 'invalid filename: ' + xFilename };
    }
    if (typeof imageData !== 'string' || imageData.length === 0) {
        return { ok: false, message: 'empty image data for ' + xFilename };
    }
    if (imageData.length > Math.ceil(MAX_PAYLOAD_BYTES * 4 / 3) + 64) {
        return { ok: false, message: 'payload too large for ' + xFilename };
    }

    try {
        let outputData = Buffer.from(stripDataUri(imageData), 'base64');
        if (!outputData || outputData.length === 0) {
            return { ok: false, message: 'invalid base64 for ' + xFilename };
        }

        const LibPNG = getPNG();
        if (LibPNG && (wantTransp || (wantWidth > 0 && wantHeight > 0))) {
            try {
                let png = LibPNG.sync.read(outputData);
                if (wantWidth > 0 && wantHeight > 0) {
                    const MAX_DIM = 4096;
                    const clampedW = Math.min(Math.max(wantWidth, 16), MAX_DIM);
                    const clampedH = Math.min(Math.max(wantHeight, 16), MAX_DIM);
                    png = resizePNG(LibPNG, png, clampedW, clampedH);
                }
                if (wantTransp) png = removeChromaKey(png, chromaKey);
                outputData = LibPNG.sync.write(png, { colorType: 6 });
            } catch (e) {
                console.log('^3[capturecloth]^0 Process skipped: ' + e.message);
            }
        }

        const result = await uploadToFivemanage(outputData, xFilename);
        if (!fmConfig.baseUrl) saveBaseUrlToConfig(extractBaseUrl(result.url));
        console.log('^2[capturecloth]^0 Uploaded: ' + result.path + '/' + result.filename);
        return { ok: true, message: result.url };
    } catch (err) {
        const message = err && err.message ? err.message : String(err);
        console.log('^1[capturecloth]^0 Upload error: ' + message);
        return { ok: false, message: message };
    }
}

onNet('illenium-appearance:server:processCapture', (payload) => {
    const src = source;
    const token = payload && payload.token;
    if (!payload || typeof payload !== 'object') {
        if (token != null) emitNet('illenium-appearance:client:captureResult', src, token, false, 'bad payload');
        return;
    }
    processAndUpload(payload, payload.imageData).then((result) => {
        if (token != null) emitNet('illenium-appearance:client:captureResult', src, token, result.ok, result.message || '');
    }).catch((err) => {
        const message = err && err.message ? err.message : String(err);
        console.log('^1[capturecloth]^0 Process error: ' + message);
        if (token != null) emitNet('illenium-appearance:client:captureResult', src, token, false, message);
    });
});

onNet('illenium-appearance:server:setBucket', (bucket) => {
    SetPlayerRoutingBucket(source.toString(), bucket);
});

onNet('illenium-appearance:server:resetBucket', () => {
    SetPlayerRoutingBucket(source.toString(), 0);
});

loadFmConfigFromFile();
console.log('^2[capturecloth]^0 Ready (Fivemanage path urls)');
