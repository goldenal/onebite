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
exports.LogBodyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const nestjs_pino_1 = require("nestjs-pino");
let LogBodyInterceptor = class LogBodyInterceptor {
    constructor(logger) {
        this.logger = logger;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const start = Date.now();
        const reqBody = req.body;
        return next.handle().pipe((0, operators_1.tap)({
            next: (responseBody) => {
                const durationMs = Date.now() - start;
                this.logger.log({
                    msg: `${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${durationMs}ms`,
                    method: req.method,
                    url: req.originalUrl || req.url,
                    statusCode: res.statusCode,
                    durationMs,
                    reqBody,
                    resBody: responseBody,
                }, 'api');
            },
            error: (error) => {
                const durationMs = Date.now() - start;
                const statusCode = error.status || 500;
                this.logger.error({
                    msg: `ERROR ${req.method} ${req.originalUrl || req.url} ${statusCode} - ${durationMs}ms`,
                    method: req.method,
                    url: req.originalUrl || req.url,
                    statusCode,
                    durationMs,
                    reqBody,
                    error: error.message || error,
                }, error.stack, 'api');
            },
        }));
    }
};
exports.LogBodyInterceptor = LogBodyInterceptor;
exports.LogBodyInterceptor = LogBodyInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_pino_1.Logger])
], LogBodyInterceptor);
