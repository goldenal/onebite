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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../auth/auth.service");
const auth_util_1 = require("../auth/auth.util");
const error_response_1 = require("../../common/errors/error-response");
const current_tenant_decorator_1 = require("../../common/tenant/current-tenant.decorator");
const tenant_required_guard_1 = require("../../common/tenant/tenant-required.guard");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
let StaffController = class StaffController {
    constructor(auth, config) {
        this.auth = auth;
        this.config = config;
    }
    access(tenant, body) {
        const portalCode = this.auth.getStaffPortalCode();
        if (!portalCode)
            throw new common_1.UnauthorizedException('staff_code_not_configured');
        if (!body?.code || body.code !== portalCode)
            throw new common_1.UnauthorizedException('invalid_code');
        const secret = this.config.get('JWT_SECRET');
        if (!secret)
            throw new common_1.UnauthorizedException('JWT_SECRET is required');
        const token = (0, auth_util_1.signStaffToken)(secret, this.config.get('AUTH_TOKEN_TTL') || '24h', tenant.id);
        return { success: true, token, tenantId: tenant.id };
    }
    verify(req, res) {
        const portalCode = this.auth.getStaffPortalCode();
        if (!portalCode) {
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json((0, error_response_1.createErrorEnvelope)({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'staff_code_not_configured',
                path: req.url,
            }));
        }
        const secret = this.config.get('JWT_SECRET');
        if (!secret) {
            return res
                .status(common_1.HttpStatus.INTERNAL_SERVER_ERROR)
                .json((0, error_response_1.createErrorEnvelope)({
                statusCode: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
                code: 'jwt_secret_required',
                path: req.url,
            }));
        }
        const token = (0, auth_util_1.getBearerToken)(req);
        if (!token) {
            return res
                .status(common_1.HttpStatus.UNAUTHORIZED)
                .json((0, error_response_1.createErrorEnvelope)({ statusCode: common_1.HttpStatus.UNAUTHORIZED, code: 'unauthorized', path: req.url }));
        }
        try {
            const ok = (0, auth_util_1.verifyStaffToken)(token, secret);
            const tenantId = req.tenant?.id;
            const payloadTenantId = (() => {
                try {
                    const payload = jsonwebtoken_1.default.decode(token);
                    return payload?.tenantId;
                }
                catch {
                    return undefined;
                }
            })();
            if (!ok) {
                return res
                    .status(common_1.HttpStatus.UNAUTHORIZED)
                    .json((0, error_response_1.createErrorEnvelope)({ statusCode: common_1.HttpStatus.UNAUTHORIZED, code: 'unauthorized', path: req.url }));
            }
            if (tenantId && payloadTenantId && payloadTenantId !== tenantId) {
                return res
                    .status(common_1.HttpStatus.UNAUTHORIZED)
                    .json((0, error_response_1.createErrorEnvelope)({ statusCode: common_1.HttpStatus.UNAUTHORIZED, code: 'unauthorized', path: req.url }));
            }
            return res.json({ ok: true });
        }
        catch {
            return res
                .status(common_1.HttpStatus.UNAUTHORIZED)
                .json((0, error_response_1.createErrorEnvelope)({ statusCode: common_1.HttpStatus.UNAUTHORIZED, code: 'unauthorized', path: req.url }));
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
    __param(0, (0, current_tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
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
    (0, common_1.UseGuards)(tenant_required_guard_1.TenantRequiredGuard),
    __metadata("design:paramtypes", [auth_service_1.AuthService, config_1.ConfigService])
], StaffController);
