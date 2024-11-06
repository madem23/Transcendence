import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Exclude } from 'class-transformer';
import { Message, log } from "src/utils/types";

@Entity({ name: 'users' })
export class User {
	@PrimaryGeneratedColumn({ type: 'integer' })
	id: number;

	@Column({ unique: true })
	login: string;

	@Column({ nullable: true })
	avatarUrl: string;

	@Column({ type: 'bytea', nullable: true })
	avatarData: Buffer;

	@Column({ unique: true})
	username: string;

	@Column({ nullable: true })
	password: string;

	@Column({ default: 'offline' })
	status: string;

	@Column({ type: 'double precision', default: 0 })
	level: number;

	@Column({ type: 'integer', default: 0 })
	wins: number;

	@Column({ type: 'integer', default: 0 })
	losses: number;

	@Column({ type: 'varchar', array: true, default: () => 'ARRAY[]::varchar[]' })
	friends: string[];

	@Column({ type: 'varchar', array: true, default: () => 'ARRAY[]::varchar[]' })
	blocked_users: string[];

	@Column({ type: 'jsonb', array: false, default: () => "'[]'", })
	match_history: {
		date: Date;
		opponent_login: string;
		victory: boolean;
		opponent_score: number;
		user_score: number;

	}[];

	@Column({
		nullable: true
	})

	@Exclude() //excluded of the serialized output
	public currentHashedRefreshToken?: string;


	@Column({ nullable: true, default: false })
	is2FAEnabled: boolean;

	@Column({ nullable: true })
	public twoFASecret?: string;

	@Column({ nullable: true })
	authStrategy: string;

	@Column('json', { default: [] })
	logs: log[];

	@Column({ type: 'jsonb', array: false, default: () => "'[]'" })
	achievements: { name: string; date: Date | null }[] = [
		{ name: 'welcome_mdemma', date: null },
		{ name: 'first_play', date: null },
		{ name: 'first_blood', date: null },
		{ name: 'first_loss', date: null },
		{ name: 'first_friend', date: null },
		{ name: 'win_vs_mmidon', date: null },
		{ name: 'hidden_cjunker', date: null },
		{ name: 'dm_bleotard', date: null },
		{ name: 'level_21', date: null },
		{ name: '100_wins', date: null },
		{ name: 'kiss_it_flemaitr', date: null },
		{ name: 'b4rb4te', date: null },
	];

	@Column({ type: 'json', default: {} })
	privateMessages: Record<number, Message[]>
}