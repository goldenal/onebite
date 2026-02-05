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
exports.CreateLegacyOrderDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateLegacyOrderDto {
}
exports.CreateLegacyOrderDto = CreateLegacyOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [
            { id: 'menu_1', name: 'Jerk Chicken Plate', price: 18.5, quantity: 1 },
            { id: 'menu_2', name: 'Plantains', price: 6, quantity: 2 },
        ],
    }),
    __metadata("design:type", Object)
], CreateLegacyOrderDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30.5 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateLegacyOrderDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Pat Smith' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLegacyOrderDto.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+1-415-555-0199' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateLegacyOrderDto.prototype, "customerPhone", void 0);
