export interface QueryResult {
    success: boolean;
    rows: Array<any>;
    error: string;
}

/**
 * Given an error object of an unknown type, this method will return a QueryResult configured to indicate that an error occurred, and store a description of the error.
 * @param error The error
 * @returns A QueryResult representing the given error
 */
export function formatQueryError(error: unknown): QueryResult {
    let message: string;
    
    if (error instanceof Error) {
        message = error.message
    } else if (typeof error === 'string') {
        message = error;
    } else {
        message = `Unknown error: ${typeof error}`;
    }

    return {
        success: false,
        rows: [],
        error: message
    };
}