import jwt, { JwtPayload } from 'jsonwebtoken'
import { NextFunction, Request, Response } from "express"
import { StatusCodes } from "http-status-codes"
import CustomError from "../errorHandlers/customError"
import { IUser, User } from '../models/User'
import asyncHandler from '../errorHandlers/asyncHandler'
import mongoose from 'mongoose'
const { UNAUTHORIZED } = StatusCodes

export interface AuthRequest extends Request {
    user?: IUser
}

export const auth = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer')) throw new CustomError('Unauthorized.', UNAUTHORIZED)
    const token = authHeader.split(' ')[1]
    if (!token) throw new CustomError('Unauthorized.', UNAUTHORIZED)
    let payload:JwtPayload = {}
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload
    } catch (e) {
        throw new CustomError('Authentication invalid.', UNAUTHORIZED)
    }
    if (!payload || !payload?.userId || !mongoose.isValidObjectId(payload.userId)) throw new CustomError('Authentication invalid.', UNAUTHORIZED)
    const user = await User.findById(payload.userId).select('-password')
    if (!user) throw new CustomError('Authentication invalid.', UNAUTHORIZED)
    req.user = user
    next()
})

