import { Response, Request, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import CustomError from './customError'
const { INTERNAL_SERVER_ERROR } = StatusCodes

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) return res.status(err.statusCode).json({ message: err.message })
  return res.status(INTERNAL_SERVER_ERROR).json({ message: "Server Error" })
}
