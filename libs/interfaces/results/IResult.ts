export interface IResult<T> {
    data: T | undefined;
    error?: string;
}