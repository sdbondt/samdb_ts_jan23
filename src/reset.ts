import { config } from "dotenv"
import { connectToDB } from "./db/connectToDB"
import resetDB from "./db/resetDB"
config()
const reset = async () => {
    try {
        await connectToDB(process.env.MONGO_URI as string)
        await resetDB()
        console.log('Database got deleted.')
    } catch (e) {
        console.log(e)
    }
}
reset()