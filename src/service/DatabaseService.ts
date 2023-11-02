import sql from "mssql";

import { getDbConfig } from "./ConfigService";
import { QueryResult, formatQueryError } from "../model/QueryResult";

export default class DatabaseConnection {
    private connected: boolean = false;

    async connect(): Promise<void> {
        try {
            await sql.connect(getDbConfig());
            this.connected = true;
            console.log("Connected to database");
        }
        catch (error) {
            console.log(error);
        }
    }

    async exec(query: string): Promise<QueryResult> {
        if (!this.connected) {
            await this.connect();
        }

        try {
            const sqlResult: sql.IResult<any> = await sql.query(query);
            return {
                rows: sqlResult.recordset,
                success: true,
                error: ""
            };
        }
        catch (error: unknown) {
            return formatQueryError(error);
        }
    }
}