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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../auth/auth.service");
const auth_util_1 = require("../auth/auth.util");
let StaffController = class StaffController {
    constructor(auth, config) {
        this.auth = auth;
        this.config = config;
    }
    access(body) {
        const portalCode = this.auth.getStaffPortalCode();
        if (!portalCode)
            throw new common_1.UnauthorizedException('staff_code_not_configured');
        if (!body?.code || body.code !== portalCode)
            throw new common_1.UnauthorizedException('invalid_code');
        const secret = this.config.get('JWT_SECRET');
        if (!secret)
            throw new common_1.UnauthorizedException('JWT_SECRET is required');
        const token = (0, auth_util_1.signStaffToken)(secret, this.config.get('AUTH_TOKEN_TTL') || '24h');
        return { success: true, token };
    }
    verify(req, res) {
        const portalCode = this.auth.getStaffPortalCode();
        if (!portalCode)
            return res.status(500).json({ ok: false });
        const secret = this.config.get('JWT_SECRET');
        if (!secret)
            return res.status(500).json({ ok: false });
        const token = (0, auth_util_1.getBearerToken)(req);
        if (!token)
            return res.status(401).json({ ok: false });
        try {
            const ok = (0, auth_util_1.verifyStaffToken)(token, secret);
            if (!ok)
                return res.status(401).json({ ok: false });
            return res.json({ ok: true });
        }
        catch {
            return res.status(401).json({ ok: false });
        }
    }
    logout() {
        return { success: true };
    }
};
exports.StaffController = StaffController;
__decorate([
    (0, common_1.Post)('access'),
    (0, swagger_1.ApiBody)({ schema: { example: { code: '123456' } } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "access", null);
__decorate([
    (0, common_1.Get)('verify'),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "logout", null);
exports.StaffController = StaffController = __decorate([
    (0, swagger_1.ApiTags)('staff'),
    (0, common_1.Controller)('staff'),
    __metadata("design:paramtypes", [auth_service_1.AuthService, config_1.ConfigService])
], StaffController);
