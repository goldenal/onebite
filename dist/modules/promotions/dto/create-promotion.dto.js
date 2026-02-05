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
exports.CreatePromotionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePromotionDto {
}
exports.CreatePromotionDto = CreatePromotionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Lunch Special' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '10% off entrees from 11am-2pm' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'percentage' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePromotionDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['menu_1', 'menu_2'] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreatePromotionDto.prototype, "applicableItems", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['entrees', 'lunch'] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreatePromotionDto.prototype, "applicableCategories", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-02-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-03-01' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePromotionDto.prototype, "active", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'LUNCH10' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "code", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePromotionDto.prototype, "minimumPurchase", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 100 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreatePromotionDto.prototype, "maxUses", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreatePromotionDto.prototype, "daysOfWeek", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '11:00' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "timeStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '14:00' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePromotionDto.prototype, "timeEnd", void 0);
