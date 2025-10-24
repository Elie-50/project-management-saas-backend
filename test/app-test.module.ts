import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';
import { User } from '../src/users/entities/user.entity';
import { OrganizationsModule } from '../src/organizations/organizations.module';
import { Organization } from '../src/organizations/entities/organization.entity';
import { MembershipsModule } from '../src/memberships/memberships.module';
import { Membership } from '../src/memberships/entities/membership.entity';

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'sqlite',
			database: ':memory:',
			entities: [User, Organization, Membership],
			synchronize: true,
			dropSchema: true,
		}),
		UsersModule,
		AuthModule,
		OrganizationsModule,
		MembershipsModule,
	],
})
export class AppTestModule {}
