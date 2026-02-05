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
exports.ReservationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const reservations_service_1 = require("./reservations.service");
const create_reservation_dto_1 = require("./dto/create-reservation.dto");
const update_reservation_dto_1 = require("./dto/update-reservation.dto");
const auth_guard_1 = require("../auth/auth.guard");
let ReservationsController = class ReservationsController {
    constructor(reservations) {
        this.reservations = reservations;
    }
    async list() {
        return this.reservations.list();
    }
    async get(id) {
        return this.reservations.get(id);
    }
    async create(body) {
        return this.reservations.create(body);
    }
    async update(id, body) {
        return this.reservations.update(id, body);
    }
    async remove(id) {
        return this.reservations.remove(id);
    }
};
exports.ReservationsController = ReservationsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReservationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReservationsController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_reservation_dto_1.CreateReservationDto]),
    __metadata("design:returntype", Promise)
], ReservationsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_reservation_dto_1.UpdateReservationDto]),
    __metadata("design:returntype", Promise)
], ReservationsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, (0, auth_guard_1.AdminGuard)()),
    (0, swagger_1.ApiBearerAuth)('bearer'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReservationsController.prototype, "remove", null);
exports.ReservationsController = ReservationsController = __decorate([
    (0, swagger_1.ApiTags)('reservations'),
    (0, common_1.Controller)('reservations'),
    __metadata("design:paramtypes", [reservations_service_1.ReservationsService])
], ReservationsController);
