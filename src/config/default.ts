export = {
    linkdoc: {
    // All app model
        app: {
            model: {
                User: {
                    // How many rounds of salt to use when hashing passwords
                    saltRounds: 10
                }
            }
        },
        controllers: {},
        routes: {
            http: {
                port: 3000
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
