require('dotenv').config()
const mongoose = require('mongoose')
const { Comment } = require('../../src/models/Comment')
const { Like } = require('../../src/models/Like')
const { Post } = require('../../src/models/Post')
const { User } = require('../../src/models/User')
const { setupDatabase, userOne, server, postOneID, postOne, commentOneID, userTwo, likeOneID, likeTwoID } = require('../setup')

beforeEach(setupDatabase)
afterEach(async () => {
    await mongoose.connection.close()
    server.close()
})

describe('likes unit test', () => {
    it('can create a like for a comment if doesn\'t exist yet.', async () => {
        await Like.handleLike('Comment', commentOneID, userTwo)
        const like = await Like.findOne({
            onModel: 'Comment',
            user: userTwo._id,
            onDocument: commentOneID
        })
        const comment = await Comment.findById(commentOneID).populate('likes')
        expect(like).not.toBeNull()
        expect(comment.likes.length).toBe(2)
    })

    it('can remove a like for a comment if it already exists', async () => {
        await Like.handleLike('Comment', commentOneID, userOne)
        const like = await Like.findOne({
            onModel: 'Comment',
            user: userOne._id,
            onDocument: commentOneID
        })
        const comment = await Comment.findById(commentOneID).populate('likes')
        expect(like).toBeNull()
        expect(comment.likes.length).toBe(0)
    })

    it('can create a like for a post if it doesn\'t exist yet', async() => {
        await Like.handleLike('Post', postOneID, userTwo)
        const like = await Like.findOne({
            onModel: 'Post',
            user: userTwo._id,
            onDocument: postOneID
        })
        const post = await Post.findById(postOneID).populate('likes')
        expect(like).not.toBeNull()
        expect(post.likes.length).toBe(2)
    })

    it('can remove a like for a post if it already exists', async() => {
        await Like.handleLike('Post', postOneID, userOne)
        const like = await Like.findOne({
            onModel: 'Post',
            user: userOne._id,
            onDocument: postOneID
        })
        const post = await Post.findById(postOneID).populate('likes')
        expect(like).toBeNull()
        expect(post.likes.length).toBe(0)
    })

    it('belongs to a user', async () => {
        const like = await Like.findById(likeOneID).populate('user')
        expect(like.user instanceof User).toBe(true)
    })

    it('belongs to either a post or comment', async () => {
        const likeOne = await Like.findById(likeOneID).populate('onDocument')
        const likeTwo = await Like.findById(likeTwoID).populate('onDocument')
        expect(likeOne.onDocument instanceof Post).toBe(true)
        expect(likeTwo.onDocument instanceof Comment).toBe(true)
    })
})