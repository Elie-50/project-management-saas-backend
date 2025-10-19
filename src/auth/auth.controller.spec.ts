import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

describe('AuthController', () => {
	let controller: AuthController;
	let authService: jest.Mocked<AuthService>;

	const mockUser: User = {
		id: 'user-id-123',
		email: 'test@example.com',
		password: '$2b$10$hashedPassword',
		username: 'user123',
		firstName: 'Test',
		lastName: 'User',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(async () => {
		const mockAuthService = {
			login: jest.fn(),
			signUp: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [AuthController],
			providers: [
				{
					provide: AuthService,
					useValue: mockAuthService,
				},
			],
		}).compile();

		controller = module.get<AuthController>(AuthController);
		authService = module.get(AuthService);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('signIn', () => {
		it('should call authService.login and return token', async () => {
			const loginDto: LoginDto = {
				email: 'user@example.com',
				password: 'securePassword',
			};

			const mockToken = { accessToken: 'mock-jwt-token' };
			authService.login.mockResolvedValueOnce(mockToken);

			const result = await controller.signIn(loginDto);

			expect(authService.login).toHaveBeenCalledWith(loginDto);
			expect(result).toEqual(mockToken);
		});
	});

	describe('signUp', () => {
		it('should call authService.signUp and return created user', async () => {
			const createUserDto: CreateUserDto = {
				email: 'new@example.com',
				password: 'newpass123',
				username: 'newuser',
				firstName: 'New',
				lastName: 'User',
			};

			authService.signUp.mockResolvedValueOnce(mockUser);

			const result = await controller.signUp(createUserDto);

			expect(authService.signUp).toHaveBeenCalledWith(createUserDto);
			expect(result).toEqual(mockUser);
		});
	});
});
