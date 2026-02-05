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
exports.MarkReadDto = exports.MyReviewsDto = exports.RequestAccessDto = exports.CreatePublicReplyDto = exports.CreateReplyDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateReplyDto {
}
exports.CreateReplyDto = CreateReplyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'admin' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReplyDto.prototype, "senderType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Ava Manager' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReplyDto.prototype, "senderName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Thanks for the feedback!' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReplyDto.prototype, "message", void 0);
class CreatePublicReplyDto {
}
exports.CreatePublicReplyDto = CreatePublicReplyDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Thanks for reaching out.' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePublicReplyDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'rev_9f2a31' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePublicReplyDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'John Doe' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePublicReplyDto.prototype, "senderName", void 0);
class RequestAccessDto {
}
exports.RequestAccessDto = RequestAccessDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'guest@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RequestAccessDto.prototype, "email", void 0);
class MyReviewsDto {
}
exports.MyReviewsDto = MyReviewsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'guest@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], MyReviewsDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'rev_9f2a31' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MyReviewsDto.prototype, "accessToken", void 0);
class MarkReadDto {
}
exports.MarkReadDto = MarkReadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'customer' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkReadDto.prototype, "senderType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'rev_9f2a31' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkReadDto.prototype, "accessToken", void 0);
