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
exports.DeliveryWebhookDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class DeliveryWebhookDto {
}
exports.DeliveryWebhookDto = DeliveryWebhookDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ord_12345' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveryWebhookDto.prototype, "order_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'delivered' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveryWebhookDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-02-05T19:45:00Z' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveryWebhookDto.prototype, "eta", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'del_67890' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeliveryWebhookDto.prototype, "delivery_id", void 0);
