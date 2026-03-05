import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type PrismaHttpError = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
};

function isKnownPrismaCode(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    typeof error.code === 'string' &&
    error.code === code
  );
}

export function mapPrismaError(error: unknown): PrismaHttpError | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const details = { prismaCode: error.code, meta: error.meta };

    if (isKnownPrismaCode(error, 'P2002')) {
      const target = error.meta?.target;
      const fields = Array.isArray(target)
        ? target.join(', ')
        : typeof target === 'string'
          ? target
          : null;
      const message = fields
        ? `${fields} already exists`
        : 'resource already exists';
      return {
        statusCode: HttpStatus.CONFLICT,
        code: 'conflict',
        message,
        details,
      };
    }

    if (isKnownPrismaCode(error, 'P2003')) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'foreign key violation',
        message: 'related record was not found',
        details,
      };
    }

    if (isKnownPrismaCode(error, 'P2025')) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        code: 'not found',
        message: 'record not found',
        details,
      };
    }

    if (
      isKnownPrismaCode(error, 'P2024') ||
      isKnownPrismaCode(error, 'P1008') ||
      isKnownPrismaCode(error, 'P1017')
    ) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'database timeout',
        message: 'database request timed out',
        details,
      };
    }

    if (
      isKnownPrismaCode(error, 'P2000') ||
      isKnownPrismaCode(error, 'P2006') ||
      isKnownPrismaCode(error, 'P2011')
    ) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        code: 'invalid input',
        message: 'one or more input fields are invalid',
        details,
      };
    }

    if (isKnownPrismaCode(error, 'P2034')) {
      return {
        statusCode: HttpStatus.CONFLICT,
        code: 'transaction conflict',
        message: 'operation could not be completed due to a concurrent update',
        details,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'database request failed',
      message: 'database operation failed',
      details,
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'validation failed',
      message: 'database query validation failed',
      details: { error: error.message },
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      code: 'database unavailable',
      message: 'database connection failed',
      details: { error: error.message },
    };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'database engine error',
      message: 'database engine failed while processing the request',
      details: { error: error.message },
    };
  }

  return null;
}
