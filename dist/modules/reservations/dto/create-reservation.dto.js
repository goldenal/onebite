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
exports.CreateReservationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateReservationDto {
}
exports.CreateReservationDto = CreateReservationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Sam Taylor' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'sam@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+1-415-555-0123' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '4' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "guests", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-02-14' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '19:30' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "time", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Window seat if available.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "specialRequests", void 0);
