import asyncHandler from "../errorHandlers/asyncHandler"
import { NextFunction, Response } from "express"
import { Comment } from '../models/Comment'
import { StatusCodes } from "http-status-codes"
import { AuthRequest } from "../middleware/auth"

const { CREATED, OK } = StatusCodes

export const createComment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { postId } = req.params
    const { content } = req.body
    const { post, comment } = await Comment.createComment(content, postId, req.user)
    res.status(CREATED).json({
        post,
        comment
    })
})

export const updateComment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { commentId } = req.params
    const { content } = req.body
    const comment = await Comment.updateComment(content, commentId, req.user)
    res.status(OK).json({
        comment
    })
})

export const deleteComment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { commentId } = req.params
    await Comment.deleteComment(commentId, req.user)
    res.status(OK).json({
        msg: 'Comment deleted.'
    })
})

export const getComment = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { commentId } = req.params
    const comment = await Comment.getComment(commentId)
    res.status(OK).json({
        comment
    })
})

export const getComments = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { postId } = req.params
    const { comments, post } = await Comment.getComments(postId)
    res.status(OK).json({
        post,
        comments
    })
})