require('dotenv').config()
const mongoose = require('mongoose')
const { User } = require('../../src/models/User')
const { Post } = require('../../src/models/Post')
const{  setupDatabase, userOne, server, userOneID } = require('../setup')
const { Comment } = require('../../src/models/Comment')
const { Like } = require('../../src/models/Like')
const testUser = {
    email: process.env.TESTUSER_EMAIL,
    password: process.env.TESTUSER_PASSWORD,
    confirmPassword: process.env.TESTUSER_PASSWORD,
    name: process.env.TESTUSER_NAME
}

beforeEach(setupDatabase)
afterEach(async () => {
    await mongoose.connection.close()
    server.close()
})

describe('auth unit tests', () => {
    it('can signup users', async () => {
        const token = await User.signup(testUser.email, testUser.name, testUser.password, testUser.password)
        const user = await User.findOne({ name: testUser.name })
        expect(user).not.toBeNull()
        expect(token).not.toBeNull()
    })

    it('can login users', async () => {
        const token = await User.login(userOne.email, userOne.password)
        expect(token).not.toBeNull()
    })

    it('can have posts', async () => {
        const user = await User.findById(userOneID).populate('posts')
        expect(user.posts[0] instanceof Post).toBe(true)

    })

    it('can have comments', async () => {
        const user = await User.findById(userOneID).populate('comments')
        expect(user.comments[0] instanceof Comment).toBe(true)
    })

    it('can have likes', async () => {
        const user = await User.findById(userOneID).populate('likes')
        expect(user.likes[0] instanceof Like).toBe(true)
    })

    it('can receive likes', async () => {
        const user = await User.findById(userOneID).populate('receivedLikes')
        expect(user.receivedLikes[0] instanceof Like).toBe(true)
    })

    it('deletes all users posts, comments and likes on remove', async () => {
        const user = await User.findById(userOneID)
        await user.remove()
        const posts = await Post.find({ user: userOneID })
        const comments = await Comment.find({ user: userOneID })
        const likes = await Like.find({ user: userOneID })
        expect(posts.length).toBe(0)
        expect(comments.length).toBe(0)
        expect(likes.length).toBe(0)
    })

    it('deleting all users removes all posts, comments and likes', async () => {
        await User.deleteMany({})
        const posts = await Post.find()
        const comments = await Comment.find()
        const likes = await Like.find()
        expect(posts.length).toBe(0)
        expect(comments.length).toBe(0)
        expect(likes.length).toBe(0)
    })
})