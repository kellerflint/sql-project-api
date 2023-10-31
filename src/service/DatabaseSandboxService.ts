import alasql from "alasql";
import { formatQueryError, QueryResult } from "./DatabaseService";

export class TemporaryDatabase {
    static id: number = 0;
    name: string;
    destroyed: boolean = false;

    /**
     * @param context A SQL query which will be executed immediately.
     * Intended to initialize the database with predetermined tables and data.
     */
    constructor(context: string = "") {
        this.name = `_tempdb${TemporaryDatabase.id++}`;

        alasql(`CREATE DATABASE ${this.name}`);
        
        const contextResult = this.exec(context);
        if (!contextResult.success) {
            throw new Error(contextResult.error);
        }
    }

    /**
     * Executes a query in the temporary database.
     * 
     * While these queries will not have access to external databases,
     * they will have access to other AlaSQL databases if the user includes a USE statement.
     * 
     * @param query A SQL query.
     * @returns Result of the query, or null if the database has been destroyed.
     */
    exec(query: string): QueryResult {
        // Do not execute the query if the database has been destroyed.
        if (this.destroyed) {
            return {
                success: false,
                rows: [],
                error: "Database no longer exists"
            };
        }

        try {
            alasql(`USE ${this.name}`);
            const result: Array<any> = alasql(query);
            return {
                rows: result,
                success: true,
                error: ""
            };
        } catch (error: unknown) {
            return formatQueryError(error);
        }
    }

    /**
     * Drops the entire temporary database. This method should be called after a database is no longer needed.
     * Once it is called, queries can no longer be executed using this database.
     */
    destroy(): void {
        alasql(`DROP DATABASE IF EXISTS ${this.name}`);
        this.destroyed = true;
    }
}