
class JWT {
    private payload: Record<string, unknown>;

    public constructor(payload: Record<string, unknown>) {
        this.payload = payload;
    }

    public sign(): string {
        return this.payload.usrID as string;
    }

    public static validate(
        token: string
    ): JWT {
        return new JWT({
            usrID: token
        });
    }
}

export default JWT;