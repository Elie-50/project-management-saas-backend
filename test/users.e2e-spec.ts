import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppTestModule } from './app-test.module';
import { User } from '../src/users/entities/user.entity';

jest.setTimeout(30000);

describe('Users E2E', () => {
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

	const updatedUserDto = {
		firstName: 'Updated',
		lastName: 'Name',
	};

	const meUrl = '/users/me';

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

	async function registerAndLogin(): Promise<{ token: string; user: User }> {
		const signupRes = await request(httpServer)
			.post('/auth/signup')
			.send(userDto)
			.expect(201);

		const user = signupRes.body;

		const loginRes = await request(httpServer)
			.post('/auth/login')
			.send({ email: userDto.email, password: userDto.password })
			.expect(200);

		const token = loginRes.body.accessToken;

		return { token, user };
	}

	describe('GET /me', () => {
		it('should return the current user', async () => {
			const { token, user } = await registerAndLogin();

			const res = await request(httpServer)
				.get(meUrl)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(res.body.id).toBe(user.id);
			expect(res.body.email).toBe(user.email);
			expect(res.body.password).toBeUndefined();
		});

		it('should return 401 without token', async () => {
			await request(httpServer).get(meUrl).expect(401);
		});
	});

	describe('PATCH /me', () => {
		it('should update the user info', async () => {
			const { token, user } = await registerAndLogin();

			await request(httpServer)
				.patch(meUrl)
				.set('Authorization', `Bearer ${token}`)
				.send(updatedUserDto)
				.expect(200);

			const updatedUser = await dataSource
				.getRepository(User)
				.findOneBy({ id: user.id });
			expect(updatedUser?.firstName).toBe(updatedUserDto.firstName);
		});

		it('should return 401 without token', async () => {
			await request(httpServer).patch(meUrl).send(updatedUserDto).expect(401);
		});

		it('should return 400 for invalid update data', async () => {
			const { token } = await registerAndLogin();

			await request(httpServer)
				.patch(meUrl)
				.set('Authorization', `Bearer ${token}`)
				.send({ firstName: '' })
				.expect(400);
		});
	});

	describe('DELETE /me', () => {
		it('should delete the user and return 204', async () => {
			const { token, user } = await registerAndLogin();

			await request(httpServer)
				.delete(meUrl)
				.set('Authorization', `Bearer ${token}`)
				.expect(204);

			// User should no longer exist
			const deleted = await dataSource
				.getRepository(User)
				.findOneBy({ id: user.id });
			expect(deleted).toBeNull();
		});

		it('should return 401 without token', async () => {
			await request(httpServer).delete(meUrl).expect(401);
		});
	});
});
