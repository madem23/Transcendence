import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigVariables {
    constructor(private readonly configService: ConfigService) {}

    public readonly host: string = this.configService.get<string>('HOST');
    public readonly port: number = this.configService.get<number>('PORT');
    public readonly nestjs_port: number = this.configService.get<number>('NESTJS_PORT');
}

