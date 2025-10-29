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
		username: 'testx',
		firstName: 'Test',
		lastName: 'Test',
	};

	const updatedUserDto = {
		firstName: 'Updated',
		lastName: 'Name',
	};

	const meUrl = '/api/users/me';

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
		await dataSource.query(
			'TRUNCATE TABLE "memberships", "organizations", "users" RESTART IDENTITY CASCADE;',
		);
	});

	afterAll(async () => {
		await app.close();
	});

	async function registerAndLogin(): Promise<{ token: string; user: User }> {
		const signupRes = await request(httpServer)
			.post('/api/auth/signup')
			.send(userDto)
			.expect(201);

		const user = signupRes.body;

		const loginRes = await request(httpServer)
			.post('/api/auth/login')
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

			const res = await request(httpServer)
				.patch(meUrl)
				.set('Authorization', `Bearer ${token}`)
				.send(updatedUserDto)
				.expect(200);

			expect(res.body?.id).toBeDefined();
			expect(res.body?.firstName).toBe('Updated');

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

	describe('GET /params', () => {
		it('should return the found users with the count and total pages', async () => {
			// create users
			for (let i = 0; i < 50; i++) {
				const data = {
					username: '',
					email: '',
					firstName: '',
					lastName: '',
					password: 'password',
				};
				if (i % 2 == 0) {
					data.username = `User${i}`;
					data.firstName = `FName${i}`;
					data.lastName = `LName${i}`;
					data.email = `user${i}@example.com`;
				} else {
					data.username = `Test${i}`;
					data.firstName = `TestFirstName${i}`;
					data.lastName = `TestLastName${i}`;
					data.email = `testuser${i}@example.com`;
				}
				await dataSource.getRepository(User).save(data);
			}

			const { token } = await registerAndLogin();

			const res = await request(httpServer)
				.get(`/api/users/search?q=user&page=1`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(res.body?.data).toBeInstanceOf(Array);
			expect(res.body?.data.length).toBe(20);
			expect(res.body?.total).toBe(25);
			expect(res.body?.pageCount).toBe(2);
		});
	});
});
