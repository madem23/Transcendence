import { ConfigVariables } from './config-variables';
import { ConfigService } from '@nestjs/config';

export const configVariables = (configService: ConfigService) => {
    return new ConfigVariables(configService);
};