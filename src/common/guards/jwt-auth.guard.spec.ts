import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access to public routes', () => {
    const mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({})),
      })),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const result = guard.canActivate(mockExecutionContext);

    expect(result).toBe(true);
  });

  it('should call super.canActivate for protected routes', () => {
    const mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => ({})),
      })),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    const superProto = Object.getPrototypeOf(Object.getPrototypeOf(guard));
    const superCanActivate = jest.spyOn(superProto as any, 'canActivate').mockReturnValue(true);

    guard.canActivate(mockExecutionContext);

    expect(superCanActivate).toHaveBeenCalled();
  });
});
