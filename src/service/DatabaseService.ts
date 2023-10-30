import sql from "mssql";

import { getDbConfig } from "./ConfigService";

export default class DatabaseConnection {
    private connected: boolean = false;

    async connect(): Promise<void> {
        try {
            await sql.connect(getDbConfig());
            this.connected = true;
            console.log("Connected to database");
        } catch (error) {
            console.log(error);
        }
    }

    async exec(query: string): Promise<Array<any>> {
        if (!this.connected) {
            await this.connect();
        }

        const result: sql.IResult<any> = await sql.query(query);
        return result.recordset;
    }
}