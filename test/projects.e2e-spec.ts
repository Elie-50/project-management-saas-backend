import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppTestModule } from './app-test.module';
import { User } from '../src/users/entities/user.entity';
import { Organization } from '../src/organizations/entities/organization.entity';
import { Project } from '../src/projects/entities/project.entity';
import { Membership } from '../src/memberships/entities/membership.entity';

jest.setTimeout(30000);

describe('Projects E2E', () => {
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
			'TRUNCATE TABLE "memberships", "organizations", "users", "projects" RESTART IDENTITY CASCADE;',
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

	describe('Organization GET Project', () => {
		it('should return the organization projects', async () => {
			const { token, user } = await registerAndLogin();

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user });

			for (let i = 0; i < 3; i++) {
				await dataSource
					.getRepository(Project)
					.save({ name: `Project-${i}`, organization: org });
			}

			const res = await request(httpServer)
				.get(`/api/organizations/${org.id}/projects`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(res.body).toBeInstanceOf(Array);
			expect(res.body.length).toBe(3);
			expect(res.body[0]?.id).toBeDefined();
			expect(res.body[0]?.name).toBe('Project-0');
		});

		it('should throw errors when forbidden', async () => {
			const { token } = await registerAndLogin();

			const user2 = await dataSource.getRepository(User).save({
				username: 'user2',
				email: 'testuser2@example.com',
				password: 'password',
				firstName: 'FirstName',
				lastName: 'LastName',
			});

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user2 });

			for (let i = 0; i < 3; i++) {
				await dataSource
					.getRepository(Project)
					.save({ name: `Project-${i}`, organization: org });
			}

			await request(httpServer)
				.get(`/api/organizations/${org.id}/projects`)
				.set('Authorization', `Bearer ${token}`)
				.expect(403);
		});

		it('should allow members to see the organization projects', async () => {
			const { token, user } = await registerAndLogin();

			const user2 = await dataSource.getRepository(User).save({
				username: 'user2',
				email: 'testuser2@example.com',
				password: 'password',
				firstName: 'FirstName',
				lastName: 'LastName',
			});

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user2 });

			await dataSource.getRepository(Membership).save({
				organization: org,
				user: user,
			});

			for (let i = 0; i < 3; i++) {
				await dataSource
					.getRepository(Project)
					.save({ name: `Project-${i}`, organization: org });
			}

			const res = await request(httpServer)
				.get(`/api/organizations/${org.id}/projects`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(res.body).toBeInstanceOf(Array);
			expect(res.body.length).toBe(3);
			expect(res.body[0]?.id).toBeDefined();
			expect(res.body[0]?.name).toBe('Project-0');
		});
	});

	describe('Project POST', () => {
		it('should forbid users from creating projects to other organizations', async () => {
			const { token } = await registerAndLogin();

			const user2 = await dataSource.getRepository(User).save({
				username: 'user2',
				email: 'testuser2@example.com',
				password: 'password',
				firstName: 'FirstName',
				lastName: 'LastName',
			});

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user2 });

			const projectDto = { organizationId: org.id, name: 'Project' };
			await request(httpServer)
				.post(`/api/projects`)
				.send(projectDto)
				.set('Authorization', `Bearer ${token}`)
				.expect(403);

			// ensure it is not added to the database
			const inDb = await dataSource.getRepository(Project).findOne({
				where: {
					organization: { id: org.id },
				},
				select: ['id'],
			});

			expect(inDb).toBeNull();
		});

		it('should return the created project', async () => {
			const { token, user } = await registerAndLogin();

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user });

			const projectDto = { organizationId: org.id, name: 'Project' };
			const res = await request(httpServer)
				.post(`/api/projects`)
				.send(projectDto)
				.set('Authorization', `Bearer ${token}`)
				.expect(201);

			expect(res.body.id).toBeDefined();
			expect(res.body.name).toBe('Project');

			// ensure it is added to the database
			const inDb = await dataSource.getRepository(Project).findOne({
				where: {
					organization: { id: org.id },
				},
				select: ['id'],
			});

			expect(inDb).toBeDefined();
		});
	});

	describe('Project GET/:id', () => {
		it('should forbid users from seeing projects of other organizations', async () => {
			const { token } = await registerAndLogin();

			const user2 = await dataSource.getRepository(User).save({
				username: 'user2',
				email: 'testuser2@example.com',
				password: 'password',
				firstName: 'FirstName',
				lastName: 'LastName',
			});

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user2 });

			const project = await dataSource
				.getRepository(Project)
				.save({ name: 'Project', organization: org });

			await request(httpServer)
				.get(`/api/projects/${project.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(403);
		});

		it('should show users their project', async () => {
			const { token, user } = await registerAndLogin();

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user });

			const project = await dataSource
				.getRepository(Project)
				.save({ name: 'Project', organization: org });

			const res = await request(httpServer)
				.get(`/api/projects/${project.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(res.body.name).toBe('Project');
		});

		it('should show organization members its project', async () => {
			const { token, user } = await registerAndLogin();

			const user2 = await dataSource.getRepository(User).save({
				username: 'user2',
				email: 'testuser2@example.com',
				password: 'password',
				firstName: 'FirstName',
				lastName: 'LastName',
			});

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user2 });

			await dataSource.getRepository(Membership).save({
				organization: org,
				user: user,
			});

			const project = await dataSource
				.getRepository(Project)
				.save({ name: 'Project', organization: org });

			const res = await request(httpServer)
				.get(`/api/projects/${project.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(res.body.name).toBe('Project');
		});
	});

	describe('DELETE /:id', () => {
		it('should forbid users from deleting projects of other organizations', async () => {
			const { token } = await registerAndLogin();

			const user2 = await dataSource.getRepository(User).save({
				username: 'user2',
				email: 'testuser2@example.com',
				password: 'password',
				firstName: 'FirstName',
				lastName: 'LastName',
			});

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user2 });

			const project = await dataSource
				.getRepository(Project)
				.save({ name: 'Project', organization: org });

			await request(httpServer)
				.delete(`/api/projects/${project.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(403);

			// ensure it is still in the database
			const inDb = await dataSource.getRepository(Project).findOne({
				where: {
					id: project.id,
				},
				select: ['id'],
			});

			expect(inDb).toBeDefined();
		});

		it('should delete a project', async () => {
			const { token, user } = await registerAndLogin();

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user });

			const project = await dataSource
				.getRepository(Project)
				.save({ name: 'Project', organization: org });

			await request(httpServer)
				.delete(`/api/projects/${project.id}`)
				.set('Authorization', `Bearer ${token}`)
				.expect(204);

			// ensure it is not in the database
			const inDb = await dataSource.getRepository(Project).findOne({
				where: {
					id: project.id,
				},
				select: ['id'],
			});

			expect(inDb).toBeFalsy();
		});
	});

	describe('PATCH /:id', () => {
		it('should forbid users from updating projects of other organizations', async () => {
			const { token } = await registerAndLogin();

			const user2 = await dataSource.getRepository(User).save({
				username: 'user2',
				email: 'testuser2@example.com',
				password: 'password',
				firstName: 'FirstName',
				lastName: 'LastName',
			});

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user2 });

			const project = await dataSource
				.getRepository(Project)
				.save({ name: 'Original Project', organization: org });

			const patchDto = { name: 'Updated Project' };

			await request(httpServer)
				.patch(`/api/projects/${project.id}`)
				.send(patchDto)
				.set('Authorization', `Bearer ${token}`)
				.expect(403);

			// Ensure project name remains unchanged
			const inDb = await dataSource.getRepository(Project).findOne({
				where: { id: project.id },
				select: ['name'],
			});

			expect(inDb?.name).toBe('Original Project');
		});

		it('should update the project name successfully', async () => {
			const { token, user } = await registerAndLogin();

			const org = await dataSource
				.getRepository(Organization)
				.save({ name: 'Org', owner: user });

			const project = await dataSource
				.getRepository(Project)
				.save({ name: 'Old Project', organization: org });

			const patchDto = { name: 'New Project Name' };

			const res = await request(httpServer)
				.patch(`/api/projects/${project.id}`)
				.send(patchDto)
				.set('Authorization', `Bearer ${token}`)
				.expect(200);

			expect(res.body.id).toBe(project.id);
			expect(res.body.name).toBe('New Project Name');

			// Ensure it was updated in the database
			const inDb = await dataSource.getRepository(Project).findOne({
				where: { id: project.id },
				select: ['name'],
			});

			expect(inDb?.name).toBe('New Project Name');
		});
	});
});
