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
exports.CreateMenuItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateMenuItemDto {
}
exports.CreateMenuItemDto = CreateMenuItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Jerk Chicken Plate' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Grilled jerk chicken with rice and peas.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 18.5 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateMenuItemDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'entrees' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://cdn.example.com/menu/jerk.jpg' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['gluten-free'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateMenuItemDto.prototype, "dietary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMenuItemDto.prototype, "popular", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: [{ name: 'Spice Level', options: ['Mild', 'Hot'] }] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateMenuItemDto.prototype, "variations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: [{ name: 'Sides', options: ['Fries', 'Salad'] }] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateMenuItemDto.prototype, "optionGroups", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: ['Plantains'] }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateMenuItemDto.prototype, "includes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Contains nuts.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMenuItemDto.prototype, "notes", void 0);
