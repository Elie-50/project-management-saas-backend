import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppTestModule } from './app-test.module';
import { User } from '../src/users/entities/user.entity';
import { Task } from '../src/tasks/entities/task.entity';
import { Project } from '../src/projects/entities/project.entity';
import { Organization } from '../src/organizations/entities/organization.entity';
import { Membership } from '../src/memberships/entities/membership.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { randomUUID } from 'crypto';

jest.setTimeout(30000);

describe('Tasks E2E', () => {
	let app: INestApplication;
	let httpServer: any;
	let dataSource: DataSource;

	const ownerDto = {
		email: 'owner@example.com',
		password: 'password',
		username: 'owner',
		firstName: 'Owner',
		lastName: 'User',
	};

	const memberDto = {
		email: 'member@example.com',
		password: 'password',
		username: 'member',
		firstName: 'Member',
		lastName: 'User',
	};

	const outsiderDto = {
		email: 'outsider@example.com',
		password: 'password',
		username: 'outsider',
		firstName: 'Out',
		lastName: 'Sider',
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
		const entities = dataSource.entityMetadatas.map(
			(meta) => `"${meta.tableName}"`,
		);
		const tables = entities.join(', ');

		await dataSource.query(`TRUNCATE ${tables} RESTART IDENTITY CASCADE;`);
	});

	afterAll(async () => {
		await app.close();
	});

	async function registerAndLogin(
		userDto: CreateUserDto,
	): Promise<{ token: string; user: User }> {
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

	describe("Project's tasks", () => {
		it("should allow user to see the project's tasks if they are owner or member only", async () => {
			// Register and login main user (organization owner)
			const { token: ownerToken, user: owner } =
				await registerAndLogin(ownerDto);
			const { token: memberToken, user: memberUser } =
				await registerAndLogin(memberDto);
			const { token: outsiderToken } = await registerAndLogin(outsiderDto);

			// Create organization owned by this user
			const org = await dataSource.getRepository(Organization).save({
				name: 'Owner Org',
				owner,
			});

			// Create a project within that organization
			const project = await dataSource.getRepository(Project).save({
				name: 'Owner Project',
				organization: org,
			});

			// Create a membership linking the member to the same organization
			await dataSource.getRepository(Membership).save({
				user: memberUser,
				organization: org,
			});

			// Add tasks to the project
			for (let i = 0; i < 5; i++) {
				await dataSource.getRepository(Task).save({
					name: `OwnerTask-${i}`,
					description: 'Owner task',
					project,
					assignee: owner,
					dueDate: new Date(),
				});
			}
			for (let i = 0; i < 5; i++) {
				await dataSource.getRepository(Task).save({
					name: `MemberTask-${i}`,
					description: 'Member task',
					project,
					assignee: memberUser,
					dueDate: new Date(),
				});
			}

			// Owner can view all project tasks
			const ownerRes = await request(httpServer)
				.get(`/api/projects/${project.id}/tasks`)
				.set('Authorization', `Bearer ${ownerToken}`)
				.expect(200);

			expect(ownerRes.body).toBeInstanceOf(Array);
			expect(ownerRes.body.length).toBe(10);
			expect(ownerRes.body[0].assignee).toBeDefined();
			expect(ownerRes.body[0].assignee.username).toBeDefined();

			// Member can view all project tasks
			const memberRes = await request(httpServer)
				.get(`/api/projects/${project.id}/tasks`)
				.set('Authorization', `Bearer ${memberToken}`)
				.expect(200);

			expect(memberRes.body).toBeInstanceOf(Array);
			expect(memberRes.body.length).toBe(5);
			expect(memberRes.body[0].assignee).toBeUndefined();

			// Outsider (not in org) should be forbidden
			await request(httpServer)
				.get(`/api/projects/${project.id}/tasks`)
				.set('Authorization', `Bearer ${outsiderToken}`)
				.expect(403);
		});
	});

	async function createInitialData(withTask: boolean) {
		const { token: ownerToken, user: owner } = await registerAndLogin(ownerDto);
		const { token: memberToken, user: member } =
			await registerAndLogin(memberDto);

		const organization = await dataSource.getRepository(Organization).save({
			name: 'Org-1',
			owner: owner,
		});

		const project = await dataSource.getRepository(Project).save({
			name: 'Project',
			organization: organization,
		});

		await dataSource.getRepository(Membership).save({
			user: member,
			organization: organization,
		});
		let task: Task | null = null;
		if (withTask) {
			task = await dataSource.getRepository(Task).save({
				name: 'Task',
				description: 'descrption',
				project: project,
				assignee: member,
				dueDate: new Date(),
			});
		}

		return {
			ownerToken,
			owner,
			memberToken,
			member,
			organization,
			project,
			task,
		};
	}

	describe('Tasks Endpoints', () => {
		describe('POST', () => {
			it('should create a new task', async () => {
				const { ownerToken, project, member } = await createInitialData(false);

				const createDto = {
					name: 'Task',
					description: 'Task Description',
					projectId: project.id,
					assigneeId: member.id,
					dueDate: new Date().toISOString(),
				};

				const res = await request(httpServer)
					.post('/api/tasks')
					.send(createDto)
					.set('Authorization', `Bearer ${ownerToken}`)
					.expect(201);

				expect(res.body.id).toBeDefined();

				// should get added to the database;
				const tasks = await dataSource.getRepository(Task).find({
					where: {
						assignee: { id: member.id },
						project: { id: project.id },
					},
				});

				expect(tasks).toHaveLength(1);
			});

			it('should forbid non-owners from creating tasks', async () => {
				const { memberToken, project, member } = await createInitialData(false);

				const createDto = {
					name: 'Task',
					description: 'Task Description',
					projectId: project.id,
					assigneeId: member.id,
					dueDate: new Date().toISOString(),
				};

				await request(httpServer)
					.post('/api/tasks')
					.send(createDto)
					.set('Authorization', `Bearer ${memberToken}`)
					.expect(403);

				// should get added to the database;
				const tasks = await dataSource.getRepository(Task).find({
					where: {
						assignee: { id: member.id },
						project: { id: project.id },
					},
				});

				expect(tasks).toHaveLength(0);
			});
		});

		describe('GET/:id', () => {
			it('should return the task', async () => {
				const { task, ownerToken, memberToken } = await createInitialData(true);

				const ownerResponse = await request(httpServer)
					.get(`/api/tasks/${task?.id}`)
					.set('Authorization', `Bearer ${ownerToken}`)
					.expect(200);

				expect(ownerResponse.body.id).toBeDefined();

				const memberResponse = await request(httpServer)
					.get(`/api/tasks/${task?.id}`)
					.set('Authorization', `Bearer ${memberToken}`)
					.expect(200);

				expect(memberResponse.body.id).toBeDefined();
			});

			it('should return 404 when not found', async () => {
				const { ownerToken } = await createInitialData(false);
				const fakeId = randomUUID();
				await request(httpServer)
					.get(`/api/tasks/${fakeId}`)
					.set('Authorization', `Bearer ${ownerToken}`)
					.expect(404);
			});

			it('should return forbidden if not owner or assignee', async () => {
				const { task } = await createInitialData(true);
				const { token: outsiderToken } = await registerAndLogin(outsiderDto);
				await request(httpServer)
					.get(`/api/tasks/${task?.id}`)
					.set('Authorization', `Bearer ${outsiderToken}`)
					.expect(403);
			});
		});

		describe('DELETE', () => {
			it('should delete the task', async () => {
				const { task, ownerToken } = await createInitialData(true);

				await request(httpServer)
					.delete(`/api/tasks/${task?.id}`)
					.set('Authorization', `Bearer ${ownerToken}`)
					.expect(204);

				// should be remove from the database
				const inDb = await dataSource.getRepository(Task).findOne({
					where: {
						id: task?.id,
					},
				});

				expect(inDb).toBeFalsy();
			});

			it('should return 404 if not found', async () => {
				const { token: ownerToken } = await registerAndLogin(ownerDto);
				const fakeId = randomUUID();
				await request(httpServer)
					.delete(`/api/tasks/${fakeId}`)
					.set('Authorization', `Bearer ${ownerToken}`)
					.expect(404);
			});

			it('should only allow owner to delete', async () => {
				const { task, memberToken } = await createInitialData(true);

				await request(httpServer)
					.delete(`/api/tasks/${task?.id}`)
					.set('Authorization', `Bearer ${memberToken}`)
					.expect(404);

				// should be remove from the database
				const inDb = await dataSource.getRepository(Task).findOne({
					where: {
						id: task?.id,
					},
				});

				expect(inDb).toBeTruthy();
			});
		});

		describe('PATCH', () => {
			it("should return 404 if the task doesn't exist", async () => {
				const { token } = await registerAndLogin(ownerDto);
				const fakeId = randomUUID();

				await request(httpServer)
					.patch(`/api/tasks/${fakeId}`)
					.set('Authorization', `Bearer ${token}`)
					.send({})
					.expect(404);
			});

			it('should not allow owner to update task status', async () => {
				const { task, ownerToken } = await createInitialData(true);

				const updateDto = {
					status: 'Done',
				};

				await request(httpServer)
					.patch(`/api/tasks/${task?.id}`)
					.set('Authorization', `Bearer ${ownerToken}`)
					.send(updateDto)
					.expect(403);

				// shouldn't update the database
				const dbInstance = await dataSource.getRepository(Task).findOne({
					where: {
						id: task?.id,
					},
				});

				expect(dbInstance?.status).toBe('To Do');
			});

			it('should not allow members to edit forbidden fields', async () => {
				const { task, memberToken } = await createInitialData(true);

				const updateDto = {
					name: 'new name',
				};

				await request(httpServer)
					.patch(`/api/tasks/${task?.id}`)
					.set('Authorization', `Bearer ${memberToken}`)
					.send(updateDto)
					.expect(403);

				// shouldn't update the database
				const dbInstance = await dataSource.getRepository(Task).findOne({
					where: {
						id: task?.id,
					},
				});

				expect(dbInstance?.name).toBe('Task');
			});

			it('should update the task status', async () => {
				const { task, memberToken } = await createInitialData(true);

				const updateDto = {
					status: 'Done',
				};

				const res = await request(httpServer)
					.patch(`/api/tasks/${task?.id}`)
					.set('Authorization', `Bearer ${memberToken}`)
					.send(updateDto)
					.expect(200);

				expect(res.body.status).toBe('Done');

				// should update the database
				const dbInstance = await dataSource.getRepository(Task).findOne({
					where: {
						id: task?.id,
					},
				});

				expect(dbInstance?.status).toBe('Done');
			});

			it('should update the task data', async () => {
				const { task, ownerToken } = await createInitialData(true);

				const updateDto = {
					color: '#ff00ff',
					name: 'new name',
					description: 'A new description',
				};

				const res = await request(httpServer)
					.patch(`/api/tasks/${task?.id}`)
					.set('Authorization', `Bearer ${ownerToken}`)
					.send(updateDto)
					.expect(200);

				expect(res.body.color).toBe('#ff00ff');
				expect(res.body.name).toBe('new name');
				expect(res.body.description).toBe('A new description');
				expect(res.body.status).toBe('To Do');

				// should update the database
				const dbInstance = await dataSource.getRepository(Task).findOne({
					where: {
						id: task?.id,
					},
				});

				expect(dbInstance?.status).toBe('To Do');
				expect(dbInstance?.name).toBe('new name');
				expect(dbInstance?.description).toBe('A new description');
				expect(dbInstance?.color).toBe('#ff00ff');
			});
		});
	});
});
