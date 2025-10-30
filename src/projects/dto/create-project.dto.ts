import { IsString, IsUUID, Length } from 'class-validator';

export class CreateProjectDto {
	@IsUUID()
	organizationId: string;

	@IsString()
	@Length(2, 20)
	name: string;
}
