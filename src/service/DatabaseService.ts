import { getDbConfig } from "./ConfigService";

export default class DatabaseConnection {
    sql: any; 

    constructor() {
        this.sql = require("mssql");
    }

    async connect() {
        try {
            await this.sql.connect(getDbConfig());
            console.log("Successful");
        } catch (error) {
            console.log(error);
        }
    }


}