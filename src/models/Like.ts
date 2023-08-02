import { StatusCodes } from 'http-status-codes'
const { BAD_REQUEST } = StatusCodes
import mongoose, { Schema, model, Document, Model, } from 'mongoose'
import CustomError from '../errorHandlers/customError'
import { IUser } from './User'
import { IPost } from './Post'
import { IComment } from './Comment'

export interface ILike extends Document {
    user: string;
    receiver: string;
    onModel: 'Comment' | 'Post';
    onDocument: string;
}

export interface LikeModel extends Model<ILike> {
    handleLike(onModel: 'Comment' | 'Post', documentID: string, user: IUser | undefined): Promise<IPost | IComment>
}

const LikeSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A like must belong to a user.']
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'The liked document must belong to a user.']
    },
    onModel: {
        type: String,
        required: [true, 'You must add a type to your like.'],
        enum: ['Comment', 'Post']
    },
    onDocument: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'onModel',
        required: [true, 'A like must belong to a post or comment.']
    }
})

LikeSchema.statics.handleLike = async function (onModel: string, documentID: string, user: IUser) {
    if ((onModel !== 'Comment' && onModel !== 'Post') || !mongoose.isValidObjectId(documentID)) throw new CustomError('Like must belong to a comment or post.', BAD_REQUEST)
    const document = await mongoose.model(onModel).findById(documentID)
    if (!document) throw new CustomError('Like must belong to a comment or post.', BAD_REQUEST)
    const likeExists = await this.findOne({
        user,
        onDocument: documentID,
        onModel,
        receiver: document.user
    })
    if (!likeExists) {
        await this.create({
            onModel,
            onDocument: documentID,
            receiver: document.user,
            user,
        })
    } else {
        await likeExists.remove()
    }
    return document.populate('likes user')
}

export const Like = model<ILike, LikeModel>('Like', LikeSchema)