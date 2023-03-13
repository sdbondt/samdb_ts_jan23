require('dotenv').config()
const mongoose = require('mongoose')
const { Comment } = require('../../src/models/Comment')
const { Like } = require('../../src/models/Like')
const { Post } = require('../../src/models/Post')
const { User } = require('../../src/models/User')
const { setupDatabase, userOne, server, postOneID, postOne, userOneID } = require('../setup')

beforeEach(setupDatabase)
afterEach(async () => {
    await mongoose.connection.close()
    server.close()
})

describe('posts unit tests', () => {
    it('can create a post', async () => {
        await Post.createPost('title', 'content', userOne)
        const post = await Post.findOne({ title: 'title'})
        expect(post).not.toBeNull()
    })

    it('can update a post', async () => {
        const user = await User.findById(userOneID)
        await Post.updatePost(postOneID, { title: 'update' }, user)
        const post = await Post.findOne({ title: 'update' })
        expect(post).not.toBeNull()
    })

    it('can delete a post', async () => {
        const user = await User.findById(userOneID)
        await Post.deletePost(postOneID, user)
        const post = await Post.findOne({ title: postOne.title })
        expect(post).toBeNull()
    })

    it('can get a post', async () => {
        const post = await Post.getPost(postOneID)
        expect(post).not.toBeNull()
        expect(post.title).toEqual(postOne.title)
    })

    it('can get all posts', async () => {
        const { posts, limit, page } = await Post.getPosts()
        expect(posts.length).toBe(2)
        expect(page).toBe(1)
        expect(limit).toBe(5)
    })

    it('can search for posts', async () => {
        const { posts } = await Post.getPosts({ q: postOne.title })
        expect(posts.length).toBe(1)
    })

    it('belongs to a user', async () => {
        const post = await Post.findById(postOneID).populate('user')
        expect(post.user instanceof User).toBe(true)
    })

    it('can have comments', async () => {
        const post = await Post.findById(postOneID).populate('comments')
        expect(post.comments[0] instanceof Comment).toBe(true)
    })

    it('can have likes', async () => {
        const post = await Post.findById(postOneID).populate('likes')
        expect(post.likes[0] instanceof Like).toBe(true)
    })

    it('removes all related likes and comments when a posts gets deleted', async () => {
        const post = await Post.findById(postOneID)
        await post.remove()
        const comments = await Comment.find({ post: postOneID })
        const likes = await Like.find({ onDocument: postOneID, onModel: 'Post'})
        expect(comments.length).toBe(0)
        expect(likes.length).toBe(0)
    })

    it('removes all comments and likes when all posts get deleted', async () => {
        await Post.deleteMany({})
        const comments = await Comment.find()
        expect(comments.length).toBe(0)
    })
})
