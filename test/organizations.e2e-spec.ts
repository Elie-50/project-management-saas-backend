import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppTestModule } from './app-test.module';
import { User } from '../src/users/entities/user.entity';
import { Organization } from '../src/organizations/entities/organization.entity';

jest.setTimeout(30000);

describe('Organization E2E', () => {
	let app: INestApplication;
	let httpServer: any;
	let dataSource: DataSource;

	const organizationUrl = '/organizations';

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
		await dataSource.getRepository(Organization).clear();
		await dataSource.getRepository(User).clear();
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

	describe('GET /:id', () => {
		it('should return a specific organization of the current user, only if it is theirs', async () => {
			// login
			const { token, user } = await registerAndLogin();

			// create user's organization
			const org1: Organization = await dataSource
				.getRepository(Organization)
				.save({ name: `Org-1`, owner: user });

			// create other organization
			const user2: User = await dataSource.getRepository(User).save({
				email: 'test2@example.com',
				password: 'password',
				username: 'testuser2',
				firstName: 'Test2',
				lastName: 'User2',
			});

			const org2: Organization = await dataSource
				.getRepository(Organization)
				.save({ name: `Org-2`, owner: user2 });

			const res = await request(httpServer)
				.get(`${organizationUrl}/${org1.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(res.body?.name).toBe(org1.name);

			// should add to the database
			const inDb = await dataSource
				.getRepository(Organization)
				.find({ where: { owner: { id: user.id } } });

			expect(inDb).toBeTruthy();
			expect(inDb.length).toBe(1);

			// should fail if the user try accessing other's organizations
			await request(httpServer)
				.get(`${organizationUrl}/${org2.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(404);
		});
	});

	describe('GET /', () => {
		it('should return all organizations of the current user and theirs only', async () => {
			// login
			const { token, user } = await registerAndLogin();

			// create user's organizations
			for (let i = 0; i < 3; i++) {
				await dataSource
					.getRepository(Organization)
					.save({ name: `Org-${i}`, owner: user });
			}

			// create other organizations
			const user2: User = await dataSource.getRepository(User).save({
				email: 'test2@example.com',
				password: 'password',
				username: 'testuser2',
				firstName: 'Test2',
				lastName: 'User2',
			});

			for (let i = 0; i < 3; i++) {
				await dataSource
					.getRepository(Organization)
					.save({ name: `Organization-${i}`, owner: user2 });
			}

			const res = await request(httpServer)
				.get(organizationUrl)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(res.body?.length).toBe(3);

			// should add to the database
			const inDb = await dataSource
				.getRepository(Organization)
				.find({ where: { owner: { id: user.id } } });

			expect(inDb).toBeTruthy();
			expect(inDb.length).toBe(3);
		});
	});

	describe('POST /', () => {
		it('should create a new organization for the user', async () => {
			// login
			const { token, user } = await registerAndLogin();

			const res = await request(httpServer)
				.post(organizationUrl)
				.set('Authorization', `Bearer ${token}`)
				.send({ name: 'Org-1' })
				.expect(201);

			expect(res.body.id).toBeDefined();

			// should add to the database
			const inDb = await dataSource
				.getRepository(Organization)
				.find({ where: { owner: { id: user.id } } });

			expect(inDb).toBeTruthy();
			expect(inDb.length).toBe(1);
			expect(inDb.at(0)?.name).toBe('Org-1');
		});
	});

	describe('PATCH /:id', () => {
		it('should update the give name of the organization for the user if the data is valid and the org is theirs', async () => {
			// login
			const { token, user } = await registerAndLogin();

			// create user's organization
			const org1: Organization = await dataSource
				.getRepository(Organization)
				.save({ name: `Org-1`, owner: user });

			await request(httpServer)
				.patch(`${organizationUrl}/${org1.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send({ name: 'New-Org' })
				.expect(200);

			// should update the database
			const dbOrg = await dataSource
				.getRepository(Organization)
				.findOne({ where: { id: org1.id } });

			expect(dbOrg).toBeDefined();
			expect(dbOrg?.name).toBe('New-Org');

			// create other organization
			const user2: User = await dataSource.getRepository(User).save({
				email: 'test2@example.com',
				password: 'password',
				username: 'testuser2',
				firstName: 'Test2',
				lastName: 'User2',
			});

			const org2: Organization = await dataSource
				.getRepository(Organization)
				.save({ name: `Org-2`, owner: user2 });

			// Fail to update the other org name
			await request(httpServer)
				.patch(`${organizationUrl}/${org2.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send({ name: 'New-Org' })
				.expect(404);

			// should NOT update the database
			const dbOrg2 = await dataSource
				.getRepository(Organization)
				.findOne({ where: { id: org2.id } });

			expect(dbOrg2?.name).toBe('Org-2');

			// Should fail if the data is invalid
			await request(httpServer)
				.patch(`${organizationUrl}/${org1.id}`)
				.set('Authorization', `Bearer ${token}`)
				.send({ name: '' })
				.expect(400);

			const dbOrgFail = await dataSource
				.getRepository(Organization)
				.findOne({ where: { id: org1.id } });

			expect(dbOrgFail?.name).toBe(dbOrg?.name);
		});
	});

	describe('DELETE /:id', () => {
		it('should DELETE the organization for the user if the org is theirs', async () => {
			// login
			const { token, user } = await registerAndLogin();

			// create user's organization
			const org1: Organization = await dataSource
				.getRepository(Organization)
				.save({ name: `Org-1`, owner: user });

			await request(httpServer)
				.delete(`${organizationUrl}/${org1.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(204);

			// should update the database
			const dbOrg = await dataSource
				.getRepository(Organization)
				.findOne({ where: { id: org1.id } });

			expect(dbOrg).toBeNull();

			// create other organization
			const user2: User = await dataSource.getRepository(User).save({
				email: 'test2@example.com',
				password: 'password',
				username: 'testuser2',
				firstName: 'Test2',
				lastName: 'User2',
			});

			const org2: Organization = await dataSource
				.getRepository(Organization)
				.save({ name: `Org-2`, owner: user2 });

			// Fail to update the other org name
			await request(httpServer)
				.delete(`${organizationUrl}/${org2.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(404);

			// should NOT delete from the database
			const dbOrg2 = await dataSource
				.getRepository(Organization)
				.findOne({ where: { id: org2.id } });

			expect(dbOrg2).toBeDefined();
		});
	});
});
