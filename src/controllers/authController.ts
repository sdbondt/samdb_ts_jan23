import { NextFunction, Request, Response } from "express"
import { StatusCodes } from 'http-status-codes'
const { CREATED, OK } = StatusCodes
import asyncHandler from "../errorHandlers/asyncHandler"
import { User } from "../models/User"

export const signup = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, confirmPassword, name } = req.body
    const token = await User.signup(email, name, password, confirmPassword)
    res.status(CREATED).json({ token })
})

export const login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body
    const token = await User.login(email, password)
    res.status(OK).json({ token })
})