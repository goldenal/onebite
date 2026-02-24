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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
    }
    signToken(payload) {
        return jsonwebtoken_1.default.sign(payload, this.getJwtSecret(), {
            expiresIn: this.getAuthTokenTtl(),
        });
    }
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, this.getJwtSecret());
    }
    allowedMembershipRoles(role) {
        if (role === 'admin')
            return ['owner', 'admin'];
        return ['owner', 'admin', 'kitchen', 'staff'];
    }
    async loginWithRole(role, username, password, tenantIdHint) {
        const identity = username.trim();
        const normalizedEmail = identity.toLowerCase();
        const allowedRoles = this.allowedMembershipRoles(role);
        const normalizedTenantIdHint = typeof tenantIdHint === 'string' ? tenantIdHint.trim() : '';
        const memberships = await this.prisma.tenantMembership.findMany({
            where: {
                user: { email: normalizedEmail },
                role: { in: allowedRoles },
                tenant: { status: 'active' },
                ...(normalizedTenantIdHint ? { tenantId: normalizedTenantIdHint } : {}),
            },
            include: { user: true },
            orderBy: { createdAt: 'asc' },
            take: normalizedTenantIdHint ? 1 : 2,
        });
        if (!memberships.length)
            throw new common_1.UnauthorizedException('Invalid username or password');
        if (!normalizedTenantIdHint && memberships.length > 1) {
            throw new common_1.UnauthorizedException('multiple_tenants_for_credentials');
        }
        const membership = memberships[0];
        const ok = await bcryptjs_1.default.compare(password, membership.user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid username or password');
        return {
            id: membership.user.id,
            username: membership.user.email,
            role,
            tenantId: membership.tenantId,
            locationIds: this.toLocationIds(membership.locationIds),
        };
    }
    getJwtSecret() {
        const secret = this.config.get('JWT_SECRET');
        if (!secret)
            throw new Error('JWT_SECRET is required');
        return secret;
    }
    getAuthTokenTtl() {
        return this.config.get('AUTH_TOKEN_TTL') || '24h';
    }
    toLocationIds(value) {
        if (!Array.isArray(value))
            return [];
        return value.filter((entry) => typeof entry === 'string');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], AuthService);
