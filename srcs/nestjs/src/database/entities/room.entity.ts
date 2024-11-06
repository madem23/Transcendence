import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Room {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ default: 'public' })
    type: string;

    @Column({ default: '' })
    password: string;

    @Column({ type: 'json', default: {} })
    users: Record<string, string>;

    @Column({ type: 'varchar', array: true, default: () => 'ARRAY[]::varchar[]' })
    banlist: string[];
}