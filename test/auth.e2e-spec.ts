import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTestDatabaseConfig } from './helpers/test-setup';

describe('Authentication (e2e) - Simplified', () => {
  let app: INestApplication;
  const prefix = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(getTestDatabaseConfig()), AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', () => {
      return request(app.getHttpServer())
        .post(`${prefix}/auth/register`)
        .send({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          firstName: 'New',
          lastName: 'User',
          role: 'ADMIN',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user).toHaveProperty('email', 'newuser@example.com');
        });
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      await request(app.getHttpServer()).post(`${prefix}/auth/register`).send({
        email: 'logintest@example.com',
        password: 'SecurePass123!',
        firstName: 'Login',
        lastName: 'Test',
        role: 'ADMIN',
      });

      return request(app.getHttpServer())
        .post(`${prefix}/auth/login`)
        .send({
          email: 'logintest@example.com',
          password: 'SecurePass123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
        });
    });
  });
});
