import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Room } from './entities/room.entity';
import { SessionEntity } from './entities/session.entity';

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			useFactory: () => ({
				type: process.env.PGDATABASE as any,
				host: process.env.PGHOST,
				port: parseInt(process.env.PGPORT, 10),
				username: process.env.PGUSER,
				password: process.env.POSTGRES_PASSWORD,
				database: process.env.PGDATABASE,
				entities: [
					User, SessionEntity, Room,
				],
				synchronize: true,
			}),
		}),
	],
})
export class DatabaseModule { }