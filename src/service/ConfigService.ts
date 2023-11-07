import config from "config";

export function getDbConfig(): string {
    const dbConfig: any = config.get("Database");
    return `Server=${dbConfig.Server},${dbConfig.Port};Database=${dbConfig.Database};User Id=${dbConfig.User};Password=${dbConfig.Password};Encrypt=true`;
}