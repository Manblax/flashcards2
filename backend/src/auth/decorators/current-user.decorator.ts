import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtUser } from '../interfaces/jwt-user.interface';

export const CurrentUser = createParamDecorator(
  (field: keyof JwtUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user: JwtUser }>();

    if (!field) {
      return request.user;
    }

    return request.user?.[field];
  },
);
