import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppTestModule } from './app-test.module';
import { User } from '../src/users/entities/user.entity';

describe('Auth E2E', () => {
  let app: INestApplication;
  let httpServer: any;
  let dataSource: DataSource;

  const userDto = {
    email: 'test@example.com',
    password: 'password',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
  };

  const signupUrl = '/api/auth/signup';
  const loginUrl = '/api/auth/login';

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    httpServer = app.getHttpServer();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.getRepository(User).clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Signup', () => {
    it('should sign up successfully and return user data (without password)', async () => {
      const res = await request(httpServer)
        .post(signupUrl)
        .send(userDto)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(userDto.email);
      expect(res.body.username).toBe(userDto.username);
      expect(res.body.firstName).toBe(userDto.firstName);
      expect(res.body.lastName).toBe(userDto.lastName);
      expect(res.body).not.toHaveProperty('password');

      const userInDb = await dataSource.getRepository(User).findOneBy({
        email: userDto.email,
      });
      expect(userInDb).toBeDefined();
      expect(userInDb?.password).not.toBe(userDto.password);
    });

    it('should fail signup with missing required fields', async () => {
      const incompleteUser = {
        email: '',
        password: '',
        username: '',
      };
      await request(httpServer)
        .post(signupUrl)
        .send(incompleteUser)
        .expect(400);
    });

    it('should fail signup with existing user', async () => {
      await request(httpServer)
        .post(signupUrl)
        .send(userDto);

        await request(httpServer)
        .post(signupUrl)
        .send(userDto)
        .expect(400);
    });

    it('should fail signup with invalid email format', async () => {
      const invalidEmailUser = {
        ...userDto,
        email: 'not-an-email',
      };
      await request(httpServer)
        .post(signupUrl)
        .send(invalidEmailUser)
        .expect(400);
    });

    it('should fail signup with too short password', async () => {
      const shortPassUser = {
        ...userDto,
        password: '123',
      };
      await request(httpServer)
        .post(signupUrl)
        .send(shortPassUser)
        .expect(400);
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      await request(httpServer)
        .post(signupUrl)
        .send(userDto)
        .expect(201);
    });

    it('should login successfully and return accessToken', async () => {
      const res = await request(httpServer)
        .post(loginUrl)
        .send({ email: userDto.email, password: userDto.password })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('should fail login with wrong password', async () => {
      await request(httpServer)
        .post(loginUrl)
        .send({ email: userDto.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('should fail login with unregistered email', async () => {
      await request(httpServer)
        .post(loginUrl)
        .send({ email: 'unknown@e2e.com', password: 'somepassword' })
        .expect(400);
    });

    it('should fail login with missing fields', async () => {
      await request(httpServer)
        .post(loginUrl)
        .send({ email: '', password: '' })
        .expect(400);
    });
  });
});
