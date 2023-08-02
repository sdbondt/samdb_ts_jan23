import { StatusCodes } from 'http-status-codes'
const { BAD_REQUEST, UNAUTHORIZED } = StatusCodes
import mongoose, { Schema, model, Document, Model, } from 'mongoose'
import CustomError from '../errorHandlers/customError'
import { Comment, IComment } from './Comment'
import { Like } from './Like'
import { IUser } from './User'

export interface IPost extends Document {
    title: string;
    content: string;
    user: IUser;
    comments: IComment[];
    authorizeAction(user: IUser): void;
}

interface updateObject {
    title?: string,
    content?: string
}

interface searchQuery {
    direction?: string;
    limit?: string | number;
    page?: string | number;
    sortBy?: string;
    q?: string
}

interface getPostsInterface {
    posts: IPost[];
    limit: number;
    page: number;
    totalCount: number;
}

interface PostModel extends Model<IPost> {
    createPost(title: string, content: string, user: IUser | undefined): Promise<IPost>;
    updatePost(postId: string, obj: updateObject, user: IUser | undefined): Promise<IPost>,
    deletePost(postId: string, user: IUser | undefined): Promise<void>,
    getPost(postId: string): Promise<IPost>
    getPosts(query: searchQuery): Promise<getPostsInterface>;
    validateID(postId: string): void
}

const PostSchema = new Schema({
    title: {
        type: String,
        required: [true, 'You must provide a title for your post.'],
        min: [1, 'Post title must be at least 1 character long.'],
        max: [100, 'Post title must be maximum 100 characters long.']
    },
    content: {
        type: String,
        required: [true, 'You must provide some content for your post.'],
        min: [1, 'Post content must be at least 1 character long.'],
        max: [10000, 'Post content must be maximum 10000 characters long.']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'A post must belong to a user.'],
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

PostSchema.methods.authorizeAction = function (user: IUser) {
    if (!user || this.user.id != user.id) throw new CustomError('Only the author can perform this action.', UNAUTHORIZED)
}

PostSchema.statics.validateID = function(postId: string) {
    if (!postId || !mongoose.isValidObjectId(postId)) throw new CustomError('Invalid request, no post with that id.', BAD_REQUEST)
}

PostSchema.statics.createPost = async function (title: string, content: string, user: IUser) {
    if (!title || !content) throw new CustomError('You must supply a title and some content to your post.', BAD_REQUEST)
    if (!user) throw new CustomError('Post must belong to a user.', BAD_REQUEST)
    if (title.length > 100) throw new CustomError('Title can be maximum 100 characters long.', BAD_REQUEST)
    if (content.length > 10000) throw new CustomError('Post content can be maximum 10000 characters long.', BAD_REQUEST)
    return this.create({
        title, 
        content,
        user
    })
}

PostSchema.statics.updatePost = async function ( postId: string, obj: updateObject, user: IUser) {
    const { title, content } = obj
    if (!title && !content) throw new CustomError('You must supply something to update.', BAD_REQUEST)
    if (title && title.length > 100) throw new CustomError('Title can be maximum 100 characters long.', BAD_REQUEST)
    if (content && content.length > 10000) throw new CustomError('Post content can be maximum 10000 characters long.', BAD_REQUEST)
    Post.validateID(postId)
    const post = await Post.getPost(postId)
    post.authorizeAction(user)
    if (title) post.title = title
    if (content) post.content = content
    return post.save()
}

PostSchema.statics.deletePost = async function (postId: string, user: IUser) {
    Post.validateID(postId)
    const post = await Post.getPost(postId)
    post.authorizeAction(user)
    await post.remove()
}

PostSchema.statics.getPost = async function (postId: string) {
    Post.validateID(postId)
    const post = await this.findById(postId)
        .populate('user')
        .populate({
            path: 'comments',
            populate: {
                path: 'user',
                model: 'User'
            }
        })
        .populate({
            path: 'comments',
            populate: {
                path: 'likes',
                model: 'Like'
            }
        })
        .populate('likes')
    if(!post) throw new CustomError('No post found.', BAD_REQUEST)
    return post
}

interface QueryObj  {
    $or?: Array<Object>;
}

PostSchema.statics.getPosts = async function (query: searchQuery) {
    let q = query?.q || undefined
    let sortBy = (query?.sortBy === 'title') ? 'title' : 'updatedAt'
    let direction = (query?.direction === 'asc') ? '-' : ''
    let page = query?.page || 1
    let limit = query?.limit || 5
    sortBy = `${direction}${sortBy}`
    page = Number(page) || 1
    if (page < 0 || isNaN(page) || !Number.isInteger(page)) page = 1
    limit = Number(limit) || 5
    if (limit < 0 || isNaN(limit) || !Number.isInteger(limit)) limit = 5
    const skip = (page - 1) * limit
    let queryObj: QueryObj = {};
    if (q) queryObj.$or = [{ title: { $regex: q, $options: 'i'}}, { content: { $regex: q, $options: 'i'}}]
    const totalCount = await this.countDocuments(queryObj)
    const posts = await this.find(queryObj).sort(sortBy).skip(skip).limit(limit).populate('user')
    return {
        posts,
        page,
        limit,
        totalCount
    }
}

PostSchema.pre('remove', {document: true, query: false}, async function (next) {
    try {
        await mongoose.model('Comment').deleteMany({ post: this.id })
        await mongoose.model('Like').deleteMany({ onDocument: this.id, onModel: 'Post' })
    } catch(e: any) {
        next(e)
    }
})

PostSchema.pre('deleteMany', async function (next) {
    try {
        const posts = await Post.find(this.getQuery());
        for (const post of posts) {
            await Comment.deleteMany({ post: post.id });
            await Like.deleteMany({ onDocument: post.id, onModel: 'Post' });
        }
    } catch(e: any) {
       next(e)
    }
})

PostSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'post',
    justOne:false
})

PostSchema.virtual('likes', {
    ref: 'Like',
    localField: '_id',
    foreignField: 'onDocument',
    justOne: false
})

export const Post = model<IPost, PostModel>('Post', PostSchema)