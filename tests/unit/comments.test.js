require('dotenv').config()
const mongoose = require('mongoose')
const { Comment } = require('../../src/models/Comment')
const { Like } = require('../../src/models/Like')
const { Post } = require('../../src/models/Post')
const { User } = require('../../src/models/User')
const { setupDatabase, userOne, commentOneID, server, postOneID, commentOne, userOneID } = require('../setup')

beforeEach(setupDatabase)
afterEach(async () => {
    await mongoose.connection.close()
    server.close()
})

describe('comments unit tests', () => {
    it('can create a comment', async () => {
        await Comment.createComment('comment', postOneID, userOneID)
        const comment = await Comment.findOne({ content: 'comment' })
        expect(comment).not.toBeNull()
    })

    it('can update a comment', async () => {
        const user = await User.findById(userOneID)
        await Comment.updateComment('update', commentOneID, user)
        const comment = await Comment.findOne({ content: 'update' })
        expect(comment).not.toBeNull()
    })

    it('can delete a comment', async () => {
        const user = await User.findById(userOneID)
        await Comment.deleteComment(commentOneID, user)
        const comment = await Comment.findById(commentOneID)
        expect(comment).toBeNull()
    })

    it('can fetch a comment', async () => {
        const comment = await Comment.getComment(commentOneID)
        expect(comment).not.toBeNull()
        expect(comment.content).toEqual(commentOne.content)
    })

    it('can fetch comments', async () => {
        const { post, comments } = await Comment.getComments(postOneID)
        expect(comments.length).toBe(1)
        expect(post._id).toEqual(postOneID)
    })

    it('belongs to a user', async () => {
        const comment = await Comment.findById(commentOneID).populate('user')
        expect(comment.user instanceof User).toBe(true)
    })

    it('belongs to a post', async () => {
        const comment = await Comment.findById(commentOneID).populate('post')
        expect(comment.post instanceof Post).toBe(true)
    })

    it('can have likes', async () => {
        const comment = await Comment.findById(commentOneID).populate('likes')
        expect(comment.likes[0] instanceof Like).toBe(true)
    })

    it('removes all related likes when a comment gets deleted', async () => {
        const comment = await Comment.findById(commentOneID)
        await comment.remove()
        const likes = await Like.find({ onModel: 'Comment', onDocument: commentOneID })
        expect(likes.length).toBe(0)
    })
})