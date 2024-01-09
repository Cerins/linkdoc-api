import { sign, verify } from 'jsonwebtoken';
import config from '../config';

const { secret, expiresIn } = config.utils.JWT;

/**
 * Represents a JSON Web Token (JWT) utility class.
 */
class JWT {
    private payload: Record<string, unknown>;

    /**
     * Creates a new instance of the JWT class.
     * @param payload - The payload object to be included in the JWT.
     */
    public constructor(payload: Record<string, unknown>) {
        this.payload = payload;
    }

    /**
     * Signs the JWT using a secret key and returns the signed token.
     * @returns The signed JWT.
     */
    public sign(): string {
        return sign(this.payload, secret, {
            expiresIn
        });
    }

    /**
     * Retrieves the value associated with the specified key from the JWT payload.
     * @param key - The key to retrieve the value for.
     * @returns The value associated with the specified key.
     */
    public get<T>(key: string) {
        return this.payload[key] as T;
    }

    /**
     * Validates a JWT and returns a new instance of the JWT class.
     * @param token - The JWT to validate.
     * @returns A new instance of the JWT class.
     */
    public static validate(token: string): JWT {
        const payload = verify(token, secret) as Record<string, unknown>;
        return new JWT(payload);
    }
}

export default JWT;