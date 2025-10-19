import {
	Injectable,
	UnauthorizedException,
	BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { compare, hash } from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

export type JwtPayload = {
	id: string;
};

export type TokenResponseData = {
	accessToken: string;
	refreshToken: string;
};

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
	) {}

	async login(loginData: LoginDto): Promise<{ accessToken: string }> {
		const { email, password } = loginData;
		const user: User | null = await this.usersService.findOne(email);

		if (!user || !user?.password) {
			throw new BadRequestException();
		}

		const valid = await this.comparePasswords(password, user.password);
		if (!valid) {
			throw new UnauthorizedException();
		}
		const payload: JwtPayload = { id: user.id };

		return {
			accessToken: await this.jwtService.signAsync(payload),
		};
	}

	async signUp(userData: CreateUserDto): Promise<Omit<User, 'password'>> {
		const saltRounds = 10;

		if (!userData?.password) {
			throw new BadRequestException();
		}

		const hashedPassword = await hash(userData.password, saltRounds);
		const newUser: CreateUserDto = {
			...userData,
			password: hashedPassword,
		};

		try {
			const user = await this.usersService.create(newUser);
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { password, ...result } = user;
			return result;
		} catch {
			throw new BadRequestException();
		}
	}

	comparePasswords(plainText: string, hashed: string): Promise<boolean> {
		return compare(plainText, hashed);
	}
}
