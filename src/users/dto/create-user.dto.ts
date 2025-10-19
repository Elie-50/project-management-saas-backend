import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class CreateUserDto {
	@IsString()
	@MinLength(3)
	username: string;

	@IsString()
	@MinLength(3)
	firstName: string;

	@IsString()
	@MinLength(3)
	lastName: string;

	@IsEmail()
	email: string;

	@IsString()
	@Length(6, 24)
	password: string;
}
