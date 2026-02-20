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
exports.VoiceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
let VoiceController = class VoiceController {
    async tts(body) {
        // Placeholder stub; ElevenLabs integration will be wired next.
        throw new common_1.ServiceUnavailableException('elevenlabs_not_configured');
    }
};
exports.VoiceController = VoiceController;
__decorate([
    (0, common_1.Post)('tts'),
    (0, swagger_1.ApiBody)({ schema: { example: { text: 'Your order will be ready shortly.' } } }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoiceController.prototype, "tts", null);
exports.VoiceController = VoiceController = __decorate([
    (0, swagger_1.ApiTags)('voice'),
    (0, common_1.Controller)('voice')
], VoiceController);
