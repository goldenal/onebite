"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const error_response_1 = require("../errors/error-response");
let HttpExceptionFilter = class HttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const isHttp = exception instanceof common_1.HttpException;
        const status = isHttp ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const payload = isHttp ? exception.getResponse() : null;
        const payloadObject = payload && typeof payload === 'object' ? payload : {};
        const payloadMessage = typeof payload === 'string' ? payload : payloadObject.message;
        const details = Array.isArray(payloadMessage) ? payloadMessage : payloadObject.details;
        const message = Array.isArray(payloadMessage) ? 'validation_failed' : typeof payloadMessage === 'string' ? payloadMessage : '';
        const codeCandidate = typeof payloadObject.code === 'string'
            ? payloadObject.code
            : typeof payloadObject.error === 'string'
                ? payloadObject.error
                : message;
        const body = (0, error_response_1.createErrorEnvelope)({
            statusCode: status,
            code: codeCandidate,
            message: message || (isHttp ? String(common_1.HttpStatus[status] || '') : 'internal_server_error'),
            details,
            path: request.url,
        });
        response.status(status).json(body);
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
