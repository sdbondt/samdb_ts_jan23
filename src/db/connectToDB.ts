import mongoose from 'mongoose'
import CustomError from '../errorHandlers/customError'
import { StatusCodes } from 'http-status-codes'
const { INTERNAL_SERVER_ERROR } = StatusCodes

export const connectToDB = async (url: string) => {
    try {
        return mongoose.connect(url)
    } catch (e) {
        throw new CustomError('Mongoose connection error.', INTERNAL_SERVER_ERROR)
    }
}

