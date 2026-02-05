"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KitchenGuard = exports.AdminGuard = exports.RoleGuard = exports.KitchenAccessGuard = exports.OptionalAuthGuard = exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const auth_util_1 = require("./auth.util");
let AuthGuard = class AuthGuard {
    constructor(auth) {
        this.auth = auth;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const token = (0, auth_util_1.getBearerToken)(req) || (0, auth_util_1.parseCookie)(req.headers.cookie, this.auth.getAuthCookieName());
        if (!token)
            throw new common_1.UnauthorizedException('Unauthorized');
        try {
            const payload = (0, auth_util_1.toAuthPayload)(this.auth.verifyToken(token));
            if (!payload)
                throw new common_1.UnauthorizedException('Unauthorized');
            req.user = payload;
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('Unauthorized');
        }
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthGuard);
let OptionalAuthGuard = class OptionalAuthGuard {
    constructor(auth) {
        this.auth = auth;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const token = (0, auth_util_1.getBearerToken)(req) || (0, auth_util_1.parseCookie)(req.headers.cookie, this.auth.getAuthCookieName());
        if (!token)
            return true;
        try {
            const payload = (0, auth_util_1.toAuthPayload)(this.auth.verifyToken(token));
            if (payload)
                req.user = payload;
        }
        catch {
            // Ignore invalid token for optional auth
        }
        return true;
    }
};
exports.OptionalAuthGuard = OptionalAuthGuard;
exports.OptionalAuthGuard = OptionalAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], OptionalAuthGuard);
let KitchenAccessGuard = class KitchenAccessGuard {
    constructor(auth, config) {
        this.auth = auth;
        this.config = config;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const token = (0, auth_util_1.getBearerToken)(req) ||
            (0, auth_util_1.parseCookie)(req.headers.cookie, this.auth.getAuthCookieName()) ||
            req.query.token;
        if (token) {
            try {
                const payload = (0, auth_util_1.toAuthPayload)(this.auth.verifyToken(token));
                if (payload && (payload.role === 'admin' || payload.role === 'kitchen')) {
                    req.user = payload;
                    return true;
                }
            }
            catch {
                // fall through to legacy token
            }
        }
        const kitchenToken = this.config.get('KITCHEN_API_TOKEN');
        if (kitchenToken) {
            const provided = (req.headers.authorization || '').replace('Bearer ', '');
            const providedQuery = typeof req.query.token === 'string' ? req.query.token : '';
            if (provided === kitchenToken || providedQuery === kitchenToken)
                return true;
        }
        throw new common_1.UnauthorizedException('Unauthorized');
    }
};
exports.KitchenAccessGuard = KitchenAccessGuard;
exports.KitchenAccessGuard = KitchenAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService, config_1.ConfigService])
], KitchenAccessGuard);
class RoleGuard {
    constructor(role) {
        this.role = role;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (!user)
            throw new common_1.UnauthorizedException('Unauthorized');
        if (user.role !== this.role)
            throw new common_1.UnauthorizedException('Unauthorized');
        return true;
    }
}
exports.RoleGuard = RoleGuard;
const AdminGuard = () => new RoleGuard('admin');
exports.AdminGuard = AdminGuard;
const KitchenGuard = () => new RoleGuard('kitchen');
exports.KitchenGuard = KitchenGuard;
