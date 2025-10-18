import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { hash } from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return accessToken if credentials are valid', async () => {
      usersService.findOne.mockResolvedValueOnce(mockUser);
      jest.spyOn(service, 'comparePasswords').mockResolvedValueOnce(true);
      jwtService.signAsync.mockResolvedValueOnce('mock-jwt-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'plaintext-password',
      });

      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
      expect(usersService.findOne).toHaveBeenCalledWith('test@example.com');
      expect(jwtService.signAsync).toHaveBeenCalledWith({ id: mockUser.id });
    });

    it('should throw BadRequestException if user not found', async () => {
      usersService.findOne.mockResolvedValueOnce(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'password' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findOne.mockResolvedValueOnce(mockUser);
      jest.spyOn(service, 'comparePasswords').mockResolvedValueOnce(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signUp', () => {
    it('should create user with hashed password', async () => {
      const createDto = {
        email: 'new@example.com',
        password: 'newpass123',
        username: 'user',
        firstName: 'First',
        lastName: 'Last',
      };

      const createdUser: User = {
        ...mockUser,
        email: createDto.email,
      };

      usersService.create.mockResolvedValueOnce(createdUser);

      const result = await service.signUp(createDto);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createDto.email,
          password: expect.any(String),
        }),
      );

      // Verify that the password was actually hashed
      const hashedPwd = usersService.create.mock.calls[0][0].password;
      expect(hashedPwd).not.toBe(createDto.password);
      expect(await hash(createDto.password, 10)).not.toBe(hashedPwd);
      
      const { password, ...res } = createdUser;
      expect(result).toEqual(res);
    });

    it('should throw BadRequestException if password is missing', async () => {
      await expect(
        service.signUp({
          email: 'missing@pw.com',
          password: '',
          username: '',
          firstName: '',
          lastName: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if usersService.create fails', async () => {
      const createDto = {
        email: 'new@example.com',
        password: 'password',
        username: 'user',
        firstName: 'First',
        lastName: 'Last',
      };

      usersService.create.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.signUp(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
