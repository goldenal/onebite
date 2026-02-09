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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({
            log: [
                { emit: 'event', level: 'query' },
            ],
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.activeQueries = new Map();
        this.$on('query', (e) => {
            const queryId = `${Date.now()}-${Math.random()}`;
            // Track query start
            this.activeQueries.set(queryId, {
                query: e.query,
                startTime: Date.now(),
            });
            // Log when query completes (this fires after query finishes)
            setTimeout(() => {
                const duration = e.duration || 0;
                this.activeQueries.delete(queryId);
                if (duration > 5000) {
                    this.logger.warn(`🐌 SLOW QUERY (${duration}ms): ${e.query.substring(0, 100)}`);
                }
                // Log active connection count
                if (this.activeQueries.size > 5) {
                    this.logger.warn(`⚠️ High active queries: ${this.activeQueries.size}`);
                    this.activeQueries.forEach((info, id) => {
                        const age = Date.now() - info.startTime;
                        if (age > 10000) {
                            this.logger.error(`🔥 STUCK QUERY (${age}ms): ${info.query.substring(0, 100)}`);
                        }
                    });
                }
            }, 0);
        });
    }
    async onModuleInit() {
        await this.$connect();
        // Monitor connection pool every 30s
        setInterval(() => {
            if (this.activeQueries.size > 3) {
                this.logger.warn(`Active queries: ${this.activeQueries.size}/10 connections`);
            }
        }, 30000);
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
