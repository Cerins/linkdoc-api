export = {
    linkdoc: {
    // All app model
        app: {
            model: {
                User: {
                    // How many rounds of salt to use when hashing passwords
                    saltRounds: 10
                }
            },
            source: {
                sqlite: {
                    // The filename of the sqlite database or :memory: to use in-memory
                    filename: ':memory:'
                }
            }
        },
        controllers: {
            websocket: {
                trustProxy: false,
                baseUrl: 'http://localhost:3001'
            }
        },
        routers: {
            http: {
                cors: {
                    origin: ''
                },
                trustProxy: false,
                port: 3000,
                // The secret of the session, allow to validate incoming
                session: {
                    secret: '',
                    cookie: {
                        maxAge: 24*60*60*1000, // 24 hours
                        // Force cookies over https
                        secure: true,
                        httpOnly: true,
                        sameSite: 'strict'
                    }
                }
            },
            websocket: {
                port: 3001
            }
        },
        utils: {
            JWT: {
                // The secret to use when signing JWTs
                // This should be a long, random string
                // And should be kept extremely secret
                secret: '',
                // The time for which the JWT is valid
                // is set for a short time to ensure that
                // after login it is immediately used and invalidated
                expiresIn: '1m'
            }
        }
    }
};
