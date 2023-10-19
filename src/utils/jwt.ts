import { sign, verify } from 'jsonwebtoken';
import config from '../config';

const { secret, expiresIn } = config.utils.JWT;

class JWT {
    private payload: Record<string, unknown>;

    public constructor(payload: Record<string, unknown>) {
        this.payload = payload;
    }

    public sign(): string {
        return sign(this.payload, secret, {
            expiresIn
        });
    }

    public get<T>(key: string): unknown {
        return this.payload[key];
    }

    public static validate(
        token: string
    ): JWT {
        const payload = verify(token, secret) as Record<string, unknown>;
        return new JWT(payload);
    }
}

export default JWT;