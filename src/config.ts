import appConfig from 'config';
import { z } from 'zod';

const rawConfig = appConfig.get('linkdoc');

// Validate using zod
const schema = z.object({
    app: z.object({
        model: z.object({
            User: z.object({
                saltRounds: z.number()
            })
        }),
        source: z.object({
            sqlite: z.object({
                filename: z.string()
            })
        })
    }),
    controllers: z.object({
        websocket: z.object({
            trustProxy: z.boolean(),
            baseUrl: z.string()
        })
    }),
    routers: z.object({
        http: z.object({
            cors:  z.object({
                origin: z.string()
            }),
            trustProxy: z.boolean(),
            port: z.number().gt(0),
            session: z.object({
                secret: z.string(),
                cookie: z.object({
                    maxAge: z.number().gt(0),
                    secure: z.boolean(),
                    httpOnly: z.boolean(),
                    sameSite: z.union([
                        z.literal('none'),
                        z.literal('strict'),
                        z.literal('lax')
                    ])
                })
            })
        }),
        websocket: z.object({
            port: z.number().gt(0)
        })
    }),
    utils: z.object({
        JWT: z.object({
            secret: z.string(),
            expiresIn: z.string()
        })
    })
});
const config = schema.parse(rawConfig);

type Config = typeof config

export default config;
export type { Config };
