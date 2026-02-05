"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBearerToken = getBearerToken;
exports.verifyStaffToken = verifyStaffToken;
exports.signStaffToken = signStaffToken;
exports.toAuthPayload = toAuthPayload;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getBearerToken(req) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer '))
        return header.slice(7);
    return null;
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
