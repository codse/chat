import { Result, err, ok } from 'neverthrow';

async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T, Error>>;
async function tryCatch<T>(
  fn: () => Promise<Result<T, Error>>
): Promise<Result<T, Error>>;
async function tryCatch<T>(
  promise: Promise<Result<T, Error>>
): Promise<Result<T, Error>>;
async function tryCatch<T>(promise: Promise<T>): Promise<Result<T, Error>>;
async function tryCatch<T>(
  fnOrPromise:
    | (() => Promise<T>)
    | (() => Promise<Result<T, Error>>)
    | Promise<Result<T, Error>>
    | Promise<T>
): Promise<Result<T, Error>> {
  try {
    let promise: Promise<T> | Promise<Result<T, Error>>;
    if (fnOrPromise instanceof Promise) {
      promise = fnOrPromise;
    } else {
      promise = fnOrPromise();
    }

    const result = await promise;
    if (typeof result === 'object' && result !== null && 'isOk' in result) {
      return result;
    }
    return ok(result as T);
  } catch (error) {
    console.error('Error in tryCatch', error);
    return err(
      error instanceof Error ? error : new Error('Failed to execute function')
    );
  }
}

export { tryCatch };
