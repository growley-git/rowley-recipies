export class ContentParseError extends Error {
    path;
    constructor(message, path) {
        super(message);
        this.path = path;
        this.name = "ContentParseError";
    }
}
//# sourceMappingURL=errors.js.map