export class ContentParseError extends Error {
  constructor(
    message: string,
    readonly path?: string
  ) {
    super(message);
    this.name = "ContentParseError";
  }
}
