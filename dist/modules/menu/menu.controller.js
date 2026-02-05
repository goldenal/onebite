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
exports.MenuController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const menu_service_1 = require("./menu.service");
const create_menu_item_dto_1 = require("./dto/create-menu-item.dto");
const update_menu_item_dto_1 = require("./dto/update-menu-item.dto");
const auth_guard_1 = require("../auth/auth.guard");
let MenuController = class MenuController {
    constructor(menu) {
        this.menu = menu;
    }
    async list() {
        return this.menu.listMenu();
    }
    async getOne(id) {
        const item = await this.menu.getMenuItem(id);
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        return item;
    }
    async create(body) {
        return this.menu.createMenuItem(body);
    }
    async update(id, body) {
        return this.menu.updateMenuItem(id, body);
    }
    async remove(id) {
        return this.menu.deleteMenuItem(id);
    }
};
exports.MenuController = MenuController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "getOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_menu_item_dto_1.CreateMenuItemDto]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_menu_item_dto_1.UpdateMenuItemDto]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MenuController.prototype, "remove", null);
exports.MenuController = MenuController = __decorate([
    (0, swagger_1.ApiTags)('menu'),
    (0, common_1.Controller)('menu'),
    __metadata("design:paramtypes", [menu_service_1.MenuService])
], MenuController);
