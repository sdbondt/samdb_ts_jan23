import bcrypt from 'bcryptjs'
import { StatusCodes } from 'http-status-codes'
const { BAD_REQUEST } = StatusCodes
import jwt from 'jsonwebtoken'
import mongoose, { Schema, model, Document, Model } from 'mongoose'
import { emailRegex, passwordRegex } from '../constants/constants'
import CustomError from '../errorHandlers/customError'
import { Comment } from './Comment'
import { Like } from './Like'
import { Post } from './Post'

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    getJWt(): string;
    comparePassword(): Promise<boolean>;
}

export interface UserModel extends Model<IUser> {
    signup(email: string, name: string, password: string, confirmPassword: string): Promise<string>;
    login(email: string, password: string): Promise<string>
}

const UserSchema = new Schema({
    name: {
        type: String,
        required: [true, "Please provide a name."],
        maxlength: [50, "Name cannot be more than 50 characters."],
        minlength: [2, "Name must be at least 2 characters."],
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: [true, "Please provide email"],
        match: [emailRegex, "Please provide a valid email."],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        minlength: [6, "Password must be at least 6 charachters long."],
        maxlength: [100, "Password cannot be longer than 100 characters."],
        match: [passwordRegex, "Password must be 6 characters long, contain a lower and uppercase letter and a number"]
    }
})

UserSchema.pre("save", async function () {
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10)
      this.password = await bcrypt.hash(this.password, salt)
    }
})

UserSchema.pre('findOne', function () {
    this.populate('posts')
})

UserSchema.pre('remove', { document: true, query: false}, async function () {
    try {
        await mongoose.model('Post').deleteMany({ user: this.id })
        await mongoose.model('Comment').deleteMany({ user: this.id })
        await mongoose.model('Like').deleteMany({ user: this.id })
    } catch (e) {
        console.log(e)
    }
})


UserSchema.pre('deleteMany', async function (next) {
    try {
        const users = await User.find(this.getQuery())
        for (const user of users) {
            await Post.deleteMany({ user: user.id })
            await Comment.deleteMany({ user: user.id })
            await Like.deleteMany({ user: user.id })
        }
    } catch(e: any) {
        next(e)
    }
})

UserSchema.methods.getJWT = function (): string {
    return jwt.sign(
        { userId: this._id },
        process.env.JWT_SECRET as string,
        {
            expiresIn: "30d",
        }
    )
}

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password)
}

UserSchema.statics.signup = async function (email: string, name: string, password: string, confirmPassword: string): Promise<string> {
    if (password !== confirmPassword) throw new CustomError('Invalid request: passwords don\'t match.', BAD_REQUEST)
    if (!email || !name || !password || !confirmPassword) throw new CustomError('Invalid request, must supply a name, an email and a password.', BAD_REQUEST)
    if (!emailRegex.test(email)) throw new CustomError('Must submit a valid email address.', BAD_REQUEST)   
    if (!passwordRegex.test(password)) throw new CustomError('Passwords must contain at least 6 characters and should contain an uppercase, lowercase and numeric value.', BAD_REQUEST)
    const emailExists = await this.findOne({ email })
    if (emailExists) throw new CustomError('Email address is already in use.', BAD_REQUEST)
    const nameExists = await this.findOne({ name })
    if (nameExists) throw new CustomError('Name is already in use.', BAD_REQUEST)
    const user = await this.create({
        email,
        name,
        password
    })
    return user.getJWT() 
}

UserSchema.statics.login = async function (email: string, password: string): Promise<string> {
    if (!email || !password) throw new CustomError('Please provide an email and password.', BAD_REQUEST)
    const user = await this.findOne({ email })
    if (!user) throw new CustomError('Invalid credentials.', BAD_REQUEST)
    const isMatch = await user.comparePassword(password)
    if (!isMatch) throw new CustomError('Invalid credentials.', BAD_REQUEST)
    return user.getJWT()
}

UserSchema.virtual('posts', {
    ref: 'Post',
    localField: '_id',
    foreignField: 'user',
    justOne: false
})

UserSchema.virtual('comments', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'user',
    justOne:false
})

UserSchema.virtual('likes', {
    ref: 'Like',
    localField: '_id',
    foreignField: 'user',
    justOne: false
})

UserSchema.virtual('receivedLikes', {
    ref: 'Like',
    localField: '_id',
    foreignField: 'receiver',
    justOne: false
})

export const User = model<IUser, UserModel>('User', UserSchema)
