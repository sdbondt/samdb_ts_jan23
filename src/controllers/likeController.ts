import asyncHandler from "../errorHandlers/asyncHandler"
import { NextFunction, Response } from "express"
import { Like } from '../models/Like'
import { StatusCodes } from "http-status-codes"
import { AuthRequest } from "../middleware/auth"
const { CREATED, OK } = StatusCodes

export const handleLike = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { postId, commentId } = req.params
    const documentId = postId || commentId
    const model = postId ? 'Post': 'Comment'
    const document = await Like.handleLike(model, documentId, req.user)
    res.status(CREATED).json({ document })
})