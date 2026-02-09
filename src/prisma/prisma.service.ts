import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService 
  extends PrismaClient<Prisma.PrismaClientOptions, 'query'> 
  implements OnModuleInit, OnModuleDestroy {
  
  private readonly logger = new Logger(PrismaService.name);
  private activeQueries = new Map<string, { query: string; startTime: number }>();

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
      ],
    });
    
    this.$on('query' as any, (e: any) => {
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
}