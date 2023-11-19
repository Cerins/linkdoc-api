
// Class, that abstracts the writing to stdout and stderr
abstract class Writer {
    public abstract print(message: string): void
    public printLn(message: string) {
        this.print(`${message}\n`);
    }
    public abstract error(message: string): void
    public errorLn(message: string) {
        this.error(`${message}\n`);
    }
}

export default Writer;