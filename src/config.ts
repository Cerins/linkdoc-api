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
    controllers: z.object({}),
    routes: z.object({
        http: z.object({
            port: z.number().gt(0)
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

export default config;
