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
        })
    }),
    controllers: z.object({}),
    routes: z.object({}),
    utils: z.object({
        JWT: z.object({
            secret: z.string(),
            expiresIn: z.string()
        })
    })
});

const config = schema.parse(rawConfig);

export default config;
