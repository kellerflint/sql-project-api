import config from "config";

export default function test() {
    const dbConfig: any = config.get("Database");
    console.log(dbConfig.Server);
}

export function getDbConfig(): string {
    const dbConfig: any = config.get("Database");
    return `Server=${dbConfig.Server},${dbConfig.Port};Database=${dbConfig.Database};User Id=${dbConfig.User};Password=${dbConfig.Password};Encrypt=true`;
}