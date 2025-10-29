import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppTestModule } from './app-test.module';
import { User } from '../src/users/entities/user.entity';
import { Organization } from '../src/organizations/entities/organization.entity';
import { Membership } from '../src/memberships/entities/membership.entity';

jest.setTimeout(30000);

describe('Membership e2e', () => {
	let app: INestApplication;
	let httpServer: any;
	let dataSource: DataSource;

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
		const userDto = {
			email: 'test@example.com',
			password: 'password',
			username: 'testuser',
			firstName: 'Test',
			lastName: 'User',
		};

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

	describe('Organization memberships', () => {
		it('should make a membership', async () => {
			//create organization
			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org-1' });
			const { token } = await registerAndLogin();

			const newUser = await dataSource.getRepository(User).save({
				email: 'user@example.com',
				password: 'password',
				username: 'user2',
				firstName: 'Test',
				lastName: 'User',
			});

			await request(httpServer)
				.post(`/api/organizations/${org.id}/members`)
				.set('Authorization', `Bearer ${token}`)
				.send({ userId: newUser.id })
				.expect(201);

			const inDb = await dataSource.getRepository(Membership).findOne({
				where: {
					user: { id: newUser.id },
					organization: { id: org.id },
				},
			});

			expect(inDb).toBeDefined();
		});

		it('should remove a membership', async () => {
			//create organization
			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org-1' });
			const { token } = await registerAndLogin();

			const newUser = await dataSource.getRepository(User).save({
				email: 'user@example.com',
				password: 'password',
				username: 'user2',
				firstName: 'Test',
				lastName: 'User',
			});

			await dataSource.getRepository(Membership).save({
				user: newUser,
				organization: org,
			});

			await request(httpServer)
				.delete(`/api/organizations/${org.id}/members/${newUser.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(204);

			const inDb = await dataSource.getRepository(Membership).findOne({
				where: {
					user: { id: newUser.id },
					organization: { id: org.id },
				},
			});

			expect(inDb).toBeNull();
		});

		it('should fetch all members', async () => {
			//create organization
			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org-1' });
			const { token, user } = await registerAndLogin();

			const newUser = await dataSource.getRepository(User).save({
				email: 'user@example.com',
				password: 'password',
				username: 'user2',
				firstName: 'Test',
				lastName: 'User',
			});

			await dataSource.getRepository(Membership).save({
				user: newUser,
				organization: org,
			});

			await dataSource.getRepository(Membership).save({
				user: user,
				organization: org,
			});

			const res = await request(httpServer)
				.get(`/api/organizations/${org.id}/members`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			console.log(res.body);

			expect(res.body.length).toBe(2);
			expect(res.body[0].id).toBeDefined();
			expect(res.body[0].username).toBeDefined();
			expect(res.body[0].email).toBeDefined();
			expect(res.body[0].joinedAt).toBeDefined();
		});
	});
	describe('User membership test', () => {
		it('should return the user memberships', async () => {
			const { token, user } = await registerAndLogin();

			for (let i = 0; i < 3; i++) {
				const org = await dataSource
					.getRepository(Organization)
					.save({ name: `Org-${i}` });

				await dataSource.getRepository(Membership).save({
					user: user,
					organization: org,
				});
			}

			const res = await request(httpServer)
				.get('/api/users/me/memberships')
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(res.body).toBeInstanceOf(Array);
			expect(res.body.length).toBe(3);
			expect(res.body[0]?.id).toBeDefined();
			expect(res.body[0]?.organization?.name).toBeDefined();
			expect(res.body[0]?.joinedAt).toBeDefined();
		});
	});
});
