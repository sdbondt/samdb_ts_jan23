import asyncHandler from "../errorHandlers/asyncHandler"
import { NextFunction, Response } from "express"
import { Post } from "../models/Post"
import { StatusCodes } from "http-status-codes"
import { AuthRequest } from "../middleware/auth"
const { CREATED, OK } = StatusCodes

export const createPost = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { title, content } = req.body
    const post = await Post.createPost(title, content, req.user)
    res.status(CREATED).json({ post })
})

export const updatePost = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { postId } = req.params
    const post = await Post.updatePost(postId, req.body, req.user)
    res.status(OK).json({ post })
})

export const deletePost = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { postId } = req.params
    await Post.deletePost(postId, req.user)
    res.status(OK).json({ msg: 'Post got deleted.' })
})

export const getPost = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { postId } = req.params
    const post = await Post.getPost(postId)
    res.status(OK).json({ post })
})

export const getPosts = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { posts, limit, page } = await Post.getPosts(req.query)
    res.status(OK).json({
        posts,
        limit,
        page
    })
})