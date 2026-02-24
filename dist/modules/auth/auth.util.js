"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBearerToken = getBearerToken;
exports.toAuthPayload = toAuthPayload;
function getBearerToken(req) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer '))
        return header.slice(7);
    return null;
}
function toAuthPayload(input) {
    if (!input || typeof input !== 'object')
        return null;
    const p = input;
    const role = typeof p.role === 'string' ? p.role : null;
    if (!role)
        return null;
    const sub = typeof p.sub === 'string'
        ? p.sub
        : typeof p.username === 'string'
            ? p.username
            : typeof p.email === 'string'
                ? p.email
                : null;
    if (!sub)
        return null;
    const locationIds = Array.isArray(p.locationIds)
        ? p.locationIds.filter((value) => typeof value === 'string')
        : null;
    return {
        sub,
        role: role,
        tenantId: typeof p.tenantId === 'string' ? p.tenantId : undefined,
        username: typeof p.username === 'string' ? p.username : undefined,
        email: typeof p.email === 'string' ? p.email : undefined,
        locationIds,
    };
}
