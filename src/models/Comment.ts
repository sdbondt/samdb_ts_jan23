import { StatusCodes } from 'http-status-codes'
const { BAD_REQUEST, UNAUTHORIZED } = StatusCodes
import mongoose, { Schema, model, Document, Model, } from 'mongoose'
import CustomError from '../errorHandlers/customError'
import { Like } from './Like'
import { IPost, Post } from './Post'
import { IUser } from './User'

export interface IComment extends Document {
    content: string;
    user: IUser;
    post: IPost;
    authorizeAction(user: IUser): void;
}

interface CreatedComment {
    post: IPost;
    comment: IComment
}

interface GetComments {
    post: IPost;
    comments: IComment[]
}

export interface CommentModel extends Model<IComment> {
    createComment(content: string, postId: string, user: IUser | undefined): Promise<CreatedComment>;
    updateComment(content: string, commentId: string, user: IUser | undefined): Promise<IComment>;
    deleteComment(commentId: string, user: IUser | undefined): Promise<void>;
    getComment(commentId: string): Promise<IComment>;
    getComments(postId: string): Promise<GetComments>;
}

const CommentSchema = new Schema({
    content: {
        type: String,
        required: [true, 'You must provide some content for your post.'],
        min: [1, 'Comment content must be at least 1 character long.'],
        max: [10000, 'Comment content must be maximum 10000 characters long.']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A comment must belong to a user.']
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, 'A comment must belong to a post.']
    }
})

CommentSchema.methods.authorizeAction = function (user: IUser) {
    if (!user || this.user.id != user.id) throw new CustomError('Only the author can perform this action.', UNAUTHORIZED)
}

CommentSchema.statics.createComment = async function (content: string, postId, user: IUser) {
    if (!postId || !mongoose.isValidObjectId(postId)) throw new CustomError('Comment must belong to a post.', BAD_REQUEST)
    if (!content) throw new CustomError('You must add some content to your comment.', BAD_REQUEST)
    if (content.length > 10000) throw new CustomError('Your comment content can not be longer than 10000 characters.', BAD_REQUEST)
    const post = await Post.getPost(postId)
    const comment = await this.create({
        content,
        user,
        post
    })
    return {
        comment,
        post
    }
}

CommentSchema.statics.updateComment = async function (content: string, commentId: string, user: IUser) {
    if (!commentId || !mongoose.isValidObjectId(commentId)) throw new CustomError('You must supply a comment to update.', BAD_REQUEST)
    if (!content) throw new CustomError('You must add some content to update your comment.', BAD_REQUEST)
    if (content.length > 10000) throw new CustomError('Your comment content can not be longer than 10000 characters.', BAD_REQUEST)
    const comment = await Comment.getComment(commentId)
    comment.authorizeAction(user)
    comment.content = content
    return comment.save()
}

CommentSchema.statics.deleteComment = async function (commentId: string, user: IUser) {
    const comment = await Comment.getComment(commentId)
    comment.authorizeAction(user)
    await comment.remove()
}

CommentSchema.statics.getComment = async function (commentId: string) {
    if (!commentId || !mongoose.isValidObjectId(commentId)) throw new CustomError('You must supply a correct comment to fetch.', BAD_REQUEST)
    const comment = await this.findById(commentId).populate('user post')
    if (!comment) throw new CustomError('No comment found with that id.', BAD_REQUEST)
    return comment
}

CommentSchema.statics.getComments = async function (postId: string) {
    if (!postId || !mongoose.isValidObjectId(postId)) throw new CustomError('You must supply a correct post to fetch.', BAD_REQUEST)
    const post = await Post.getPost(postId)
    return {
        post,
        comments: post.comments
    }
}

CommentSchema.pre('remove', { document: true, query: false}, async function (next) {
    try {
        await mongoose.model('Like').deleteMany({ onDocument: this.id, onModel: 'Comment'})
    } catch (e: any) {
        next(e)
    }
})

CommentSchema.pre('deleteMany', async function (next) {
    try {
        const comments = await this.model.find(this.getQuery())
        for (const comment of comments) {
            await Like.deleteMany({ onDocument: comment.id, onModel: 'Comment'})
        }
    } catch (e: any) {
        next(e)
    }
})

CommentSchema.virtual('likes', {
    ref: 'Like',
    localField: '_id',
    foreignField: 'onDocument',
    justOne: false
})

export const Comment = model<IComment, CommentModel>('Comment', CommentSchema)