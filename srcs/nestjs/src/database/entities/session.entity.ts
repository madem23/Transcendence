import { ISession } from 'connect-typeorm';
import { Entity, Column, Index, PrimaryColumn } from 'typeorm';

@Entity()
export class SessionEntity implements ISession {

	@Index()
	@Column('integer')
	expiredAt = Date.now();

	@PrimaryColumn('varchar', { length: 255 })
	id = '';

	@Column('text')
	json = '';
}