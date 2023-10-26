import sql from "mssql";

import { getDbConfig } from "./ConfigService";

export default class DatabaseConnection {
    async connect() {
        try {
            await sql.connect(getDbConfig());
            console.log("Successful");
        } catch (error) {
            console.log(error);
        }
    }
}