import { DataSource } from "typeorm"
import { env } from "./env"
import debug from "debug"

const log = debug('datasource')
const AppDataSource = new DataSource({
    type: process.env.DB_TYPE as any,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: env.app.dirs.entites,
    synchronize: env.isDevelopment
})
AppDataSource.initialize()
    .then(() => {
        log("Data Source has been initialized!")
    })
    .catch((err) => {
        log("Error during Data Source initialization", err)
    })
export { AppDataSource };