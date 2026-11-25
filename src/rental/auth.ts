import { Injectable, UnauthorizedException, SetMetadata, createParamDecorator } from '@nestjs/common';
import type { NestMiddleware, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'node:crypto';

export type Role = 'admin' | 'staff';
type User = { username: string; role: Role };
type AuthRequest = Request & { user?: User };
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthRequest>().user,
);

function matches(actual: string, expected: string | undefined): boolean {
    if (!expected) return false;
    const a = Buffer.from(actual), b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
    use(req: AuthRequest, res: Response, next: NextFunction) {
        const header = req.headers.authorization;
        const fail = () => {
            res.setHeader('WWW-Authenticate', 'Basic realm="Vehicle Rental"');
            throw new UnauthorizedException('Invalid or missing credentials');
        };
        if (!header?.startsWith('Basic ')) return fail();
        const raw = Buffer.from(header.slice(6), 'base64').toString('utf8');
        const colon = raw.indexOf(':');
        if (colon < 0) return fail();
        const username = raw.slice(0, colon), password = raw.slice(colon + 1);
        if (username === 'admin' && matches(password, process.env.QUIZ_ADMIN_PASSWORD)) {
            req.user = { username, role: 'admin' };
        } else if (username === 'staff' && matches(password, process.env.QUIZ_STAFF_PASSWORD)) {
            req.user = { username, role: 'staff' };
        } else return fail();
        next();
    }
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }
    canActivate(context: ExecutionContext): boolean {
        const user = context.switchToHttp().getRequest<AuthRequest>().user;
        if (!user) throw new UnauthorizedException();
        const roles = this.reflector.getAllAndOverride<Role[]>('roles', [context.getHandler(), context.getClass()]);
        return !roles || roles.includes(user.role);
    }
}
