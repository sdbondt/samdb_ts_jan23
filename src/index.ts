import { config } from 'dotenv'
import { app } from './app/app'
import { connectToDB } from './db/connectToDB'
config()
const PORT = parseInt(process.env.PORT as string) || 8000

const start = async () => {
    try {
        await connectToDB(process.env.MONGO_URI as string)
        app.listen(PORT, () => {
            console.log(`Server is listening on port ${PORT}.`)
        })

    } catch (e) {
        console.log('Connection error.')
    }
}


start()