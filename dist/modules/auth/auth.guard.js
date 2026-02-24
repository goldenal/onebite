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
exports.PlatformGuard = exports.CustomerGuard = exports.KitchenGuard = exports.AdminGuard = exports.RoleGuard = exports.KitchenAccessGuard = exports.OptionalAuthGuard = exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const auth_util_1 = require("./auth.util");
let AuthGuard = class AuthGuard {
    constructor(auth) {
        this.auth = auth;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const token = (0, auth_util_1.getBearerToken)(req);
        if (!token)
            throw new common_1.UnauthorizedException('Unauthorized');
        try {
            const payload = (0, auth_util_1.toAuthPayload)(this.auth.verifyToken(token));
            if (!payload)
                throw new common_1.UnauthorizedException('Unauthorized');
            const reqTenantId = req.tenant?.id;
            if (reqTenantId && payload.tenantId && payload.tenantId !== reqTenantId) {
                throw new common_1.UnauthorizedException('tenant_scope_mismatch');
            }
            if (reqTenantId && ['admin', 'kitchen', 'customer'].includes(payload.role) && !payload.tenantId) {
                throw new common_1.UnauthorizedException('tenant_required_in_token');
            }
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
        const token = (0, auth_util_1.getBearerToken)(req);
        if (!token)
            return true;
        try {
            const payload = (0, auth_util_1.toAuthPayload)(this.auth.verifyToken(token));
            if (payload) {
                const reqTenantId = req.tenant?.id;
                if (reqTenantId && payload.tenantId && payload.tenantId !== reqTenantId)
                    return true;
                req.user = payload;
            }
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
    constructor(auth) {
        this.auth = auth;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const reqTenantId = req.tenant?.id;
        const token = (0, auth_util_1.getBearerToken)(req) || (typeof req.query.token === 'string' ? req.query.token : null);
        if (token) {
            try {
                const payload = (0, auth_util_1.toAuthPayload)(this.auth.verifyToken(token));
                if (payload &&
                    (payload.role === 'admin' || payload.role === 'kitchen') &&
                    payload.tenantId &&
                    (!reqTenantId || payload.tenantId === reqTenantId)) {
                    req.user = payload;
                    return true;
                }
            }
            catch {
                // keep unauthorized flow below
            }
        }
        throw new common_1.UnauthorizedException('Unauthorized');
    }
};
exports.KitchenAccessGuard = KitchenAccessGuard;
exports.KitchenAccessGuard = KitchenAccessGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
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
        if (this.role !== 'platform' && user.role === 'admin')
            return true;
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
const CustomerGuard = () => new RoleGuard('customer');
exports.CustomerGuard = CustomerGuard;
const PlatformGuard = () => new RoleGuard('platform');
exports.PlatformGuard = PlatformGuard;
