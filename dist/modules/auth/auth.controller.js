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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const create_staff_dto_1 = require("./dto/create-staff.dto");
const auth_guard_1 = require("./auth.guard");
let AuthController = class AuthController {
    constructor(auth) {
        this.auth = auth;
    }
    async adminLogin(body) {
        const user = await this.auth.loginWithRole('admin', body.username, body.password);
        const token = this.auth.signToken({ username: user.username, role: 'admin' });
        return { success: true, username: user.username, role: 'admin', token, message: 'Login successful' };
    }
    async kitchenLogin(body) {
        const user = await this.auth.loginWithRole('kitchen', body.username, body.password);
        const token = this.auth.signToken({ username: user.username, role: 'kitchen' });
        return { success: true, username: user.username, role: 'kitchen', token, message: 'Login successful' };
    }
    // Public admin credential creation (dev only). Do not use in production.
    async seedAdmin(body) {
        const user = await this.auth.createAdminUser(body.username, body.password);
        return { success: true, username: user.username, role: user.role };
    }
    // Public kitchen credential creation (dev only). Do not use in production.
    async seedKitchen(body) {
        const user = await this.auth.createKitchenUser(body.username, body.password);
        return { success: true, username: user.username, role: user.role };
    }
    adminVerify(res) {
        res.json({ valid: true });
    }
    kitchenVerify(res) {
        res.json({ valid: true });
    }
    logout() {
        return { success: true, message: 'Logged out' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('admin/login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.Post)('kitchen/login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "kitchenLogin", null);
__decorate([
    (0, common_1.Post)('admin/seed'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.CreateStaffDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "seedAdmin", null);
__decorate([
    (0, common_1.Post)('kitchen/seed'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_staff_dto_1.CreateStaffDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "seedKitchen", null);
__decorate([
    (0, common_1.Get)('admin/verify'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "adminVerify", null);
__decorate([
    (0, common_1.Get)('kitchen/verify'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.KitchenGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "kitchenVerify", null);
__decorate([
    (0, common_1.Post)('logout'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
