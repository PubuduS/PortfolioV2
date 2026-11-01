/** Result of a data request. */
export interface IResult<T> {
  /** Payload when the request succeeded. */
  data: T | undefined;
  /** Message when the request failed. */
  error?: string;
}
