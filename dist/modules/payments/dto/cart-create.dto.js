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
exports.CartCreateDto = exports.CartItemDto = exports.CartMenuItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CartMenuItemDto {
}
exports.CartMenuItemDto = CartMenuItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '7c44f4ef-404f-42dd-963b-52c2d87099f6' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CartMenuItemDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Whole Wing' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CartMenuItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Crispy deep-fried whole chicken wing with your choice of sauce.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CartMenuItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2.35 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CartMenuItemDto.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a-la-carte' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CartMenuItemDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://images.unsplash.com/photo-1608039755401-742074f0548d?w=800&q=80' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CartMenuItemDto.prototype, "image", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: [] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CartMenuItemDto.prototype, "dietary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CartMenuItemDto.prototype, "popular", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: [] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CartMenuItemDto.prototype, "variations", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: [] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CartMenuItemDto.prototype, "optionGroups", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: [] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CartMenuItemDto.prototype, "includes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CartMenuItemDto.prototype, "notes", void 0);
class CartItemDto {
}
exports.CartItemDto = CartItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: CartMenuItemDto }),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CartMenuItemDto),
    __metadata("design:type", CartMenuItemDto)
], CartItemDto.prototype, "menuItem", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CartItemDto.prototype, "quantity", void 0);
class CartCreateDto {
}
exports.CartCreateDto = CartCreateDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'user_123' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CartCreateDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [CartItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CartItemDto),
    __metadata("design:type", Array)
], CartCreateDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 30.5 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CartCreateDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pickup', enum: ['pickup', 'delivery', 'tablet'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['pickup', 'delivery', 'tablet']),
    __metadata("design:type", String)
], CartCreateDto.prototype, "fulfillment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'web', enum: ['web', 'phone', 'tablet', 'ai'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['web', 'phone', 'tablet', 'ai']),
    __metadata("design:type", String)
], CartCreateDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Chris Brown' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CartCreateDto.prototype, "customerName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '+1-415-555-0199' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CartCreateDto.prototype, "customerPhone", void 0);
