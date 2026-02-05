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
    async loginWithRole(role, username, password) {
        const user = await this.prisma.staffUser.findUnique({ where: { username } });
        if (!user || user.role !== role)
            throw new common_1.UnauthorizedException('Invalid username or password');
        const ok = bcryptjs_1.default.compareSync(password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid username or password');
        return { username: user.username, role };
    }
    async createKitchenUser(username, password) {
        const hash = bcryptjs_1.default.hashSync(password, 10);
        const user = await this.prisma.staffUser.upsert({
            where: { username },
            update: { passwordHash: hash, role: 'kitchen' },
            create: { username, passwordHash: hash, role: 'kitchen' },
        });
        return { username: user.username, role: 'kitchen' };
    }
    async createAdminUser(username, password) {
        const hash = bcryptjs_1.default.hashSync(password, 10);
        const user = await this.prisma.staffUser.upsert({
            where: { username },
            update: { passwordHash: hash, role: 'admin' },
            create: { username, passwordHash: hash, role: 'admin' },
        });
        return { username: user.username, role: 'admin' };
    }
    getStaffPortalCode() {
        return (this.config.get('STAFF_PORTAL_CODE') || '').trim();
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, config_1.ConfigService])
], AuthService);
