"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookie = parseCookie;
exports.getBearerToken = getBearerToken;
exports.setCookie = setCookie;
exports.clearCookie = clearCookie;
exports.verifyStaffToken = verifyStaffToken;
exports.signStaffToken = signStaffToken;
exports.toAuthPayload = toAuthPayload;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function parseCookie(header, name) {
    if (!header)
        return null;
    const parts = header.split(';').map((part) => part.trim());
    for (const part of parts) {
        if (part.startsWith(`${name}=`)) {
            return decodeURIComponent(part.slice(name.length + 1));
        }
    }
    return null;
}
function getBearerToken(req) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer '))
        return header.slice(7);
    return null;
}
function setCookie(res, name, token, opts) {
    const parts = [
        `${name}=${encodeURIComponent(token)}`,
        'HttpOnly',
        'Path=/',
        `Max-Age=${opts.maxAge}`,
        `SameSite=${opts.sameSite}`,
    ];
    if (opts.secure)
        parts.push('Secure');
    if (opts.domain)
        parts.push(`Domain=${opts.domain}`);
    res.setHeader('Set-Cookie', parts.join('; '));
}
function clearCookie(res, name, opts) {
    const parts = [
        `${name}=`,
        'HttpOnly',
        'Path=/',
        'Max-Age=0',
        `SameSite=${opts.sameSite}`,
    ];
    if (opts.secure)
        parts.push('Secure');
    if (opts.domain)
        parts.push(`Domain=${opts.domain}`);
    res.setHeader('Set-Cookie', parts.join('; '));
}
function verifyStaffToken(token, secret) {
    const payload = jsonwebtoken_1.default.verify(token, secret);
    return payload?.type === 'staff';
}
function signStaffToken(secret, ttl) {
    return jsonwebtoken_1.default.sign({ type: 'staff' }, secret, { expiresIn: ttl });
}
function toAuthPayload(input) {
    if (!input || typeof input !== 'object')
        return null;
    const p = input;
    if (!p.username || !p.role)
        return null;
    return p;
}
