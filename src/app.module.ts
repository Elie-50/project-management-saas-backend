import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { Organization } from './organizations/entities/organization.entity';
import { MembershipsModule } from './memberships/memberships.module';
import { Membership } from './memberships/entities/membership.entity';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				type: 'postgres',
				host: config.get<string>('DB_HOST'),
				port: config.get<number>('DB_PORT'),
				username: config.get<string>('DB_USER'),
				password: config.get<string>('DB_PASS'),
				database: config.get<string>('DB_NAME'),
				synchronize: config.get<boolean>('SYNCHRONIZE'),
				entities: [User, Organization, Membership],
			}),
		}),
		UsersModule,
		AuthModule,
		OrganizationsModule,
		MembershipsModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule {}
