import Writer from '.';

class STDWriter extends Writer {
    public print(message: string): void {
        process.stdout.write(message);
    }

    public error(message: string): void {
        process.stderr.write(message);
    }
}

export default STDWriter;