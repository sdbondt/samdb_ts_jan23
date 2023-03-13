require('dotenv').config()
const request = require('supertest')
const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const { UNAUTHORIZED, BAD_REQUEST, CREATED, OK } = StatusCodes
const { setupDatabase, server, userOneToken, postOneID, userTwoToken, postOne, userTwoID, commentOneID, commentOne } = require('../setup')
const { Comment } = require('../../src/models/Comment')
const { Post } = require('../../src/models/Post')
const { User } = require('../../src/models/User')

beforeEach(setupDatabase)
afterEach(async () => {
    await mongoose.connection.close()
    server.close()
})

describe('comments feature tests', () => {
    describe('create comment request is correct', () => {
        it('creates a comment', async () => {
            await request(server).post(`/api/posts/${postOneID}/comments`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send({ content: 'comment' })
                .expect(CREATED)
            const comment = await Comment.findOne({ content: 'comment' })
            expect(comment).not.toBeNull()
        })

        it('should belong to user and post', async () => {
            await request(server).post(`/api/posts/${postOneID}/comments`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send({ content: 'comment' })
                .expect(CREATED)
            const post = await Post.findById(postOneID).populate('comments')
            const user = await User.findById(userTwoID).populate('comments')
            expect(post.comments.length).toBe(2)
            expect(user.comments.length).toBe(2)
        })
    })

    describe('if create comment request is not correct', () => {
        it('should not create comment without authenticated user', async () => {
            await request(server).post(`/api/posts/${postOneID}/comments`)
                .send({ content: 'comment' })
                .expect(UNAUTHORIZED)
        })

        it('should not create comment if content is missing', async () => {
            await request(server).post(`/api/posts/${postOneID}/comments`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(BAD_REQUEST)
        })

        it('should not create comment with invalid content', async () => {
            const commentVal = 'a'.repeat(10001)
            await request(server).post(`/api/posts/${postOneID}/comments`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send({ content: commentVal })
                .expect(BAD_REQUEST)
        })

        it('should not create comment without valid post', async () => {
            await request(server).post('/api/posts/123456/comments')
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send({ content: 'comment' })
                .expect(BAD_REQUEST)
        })
    })

    describe('if update comment request is correct', () => {
        it('should update the comment', async () => {
            await request(server).patch(`/api/comments/${commentOneID}`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send({ content: 'update' })
                .expect(OK)
            const comment = await Comment.findOne({ content: 'update' })
            expect(comment).not.toBeNull()
        })
    })

    describe('if update comment request is not correct', () => {
        it('should not update if user is not the author of the comment', async () => {
            await request(server).patch(`/api/comments/${commentOneID}`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send({ content: 'update' })
                .expect(UNAUTHORIZED)
        })

        it('should not update if content is missing or invalid', async () => {
            await request(server).patch(`/api/comments/${commentOneID}`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(BAD_REQUEST)
            
            const contentVal = 'a'.repeat(10001)
            await request(server).patch(`/api/comments/${commentOneID}`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send({ content: contentVal})
                .expect(BAD_REQUEST)
        })

        it('should not do anything if there is not comment', async () => {
            await request(server).patch(`/api/comments/123456`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send({ content: 'update' })
                .expect(BAD_REQUEST)
        })
    })

    describe('if delete request is correct', () => {
        it('should delete the comment', async () => {
            await request(server).delete(`/api/comments/${commentOneID}`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(OK)
            const comment = await Comment.findById(commentOneID)
            expect(comment).toBeNull()
        })
    })

    describe('if delete request is not correct', () => {
        it('should not delete the comment if the user is not the author', async () => {
            await request(server).delete(`/api/comments/${commentOneID}`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(UNAUTHORIZED)
        })

        it('should not do anything if there is not comment', async () => {
            await request(server).delete('/api/comments/123456')
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(BAD_REQUEST)
        })
    })

    describe('if get comment request is correct', () => {
        it('should return a comment', async () => {
            const res = await request(server).get(`/api/comments/${commentOneID}`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(OK)
            expect(res.body.comment.content).toEqual(commentOne.content)
        })
    })

    describe('if get comment request is not correct', () => {
        it('should not do anything if there is no comment', async () => {
            await request(server).get('/api/comments/123456')
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(BAD_REQUEST)
        })
        it('should not be allowed for unauthorized users', async () => {
            await request(server).get(`/api/comments/${commentOneID}`)
                .send()
                .expect(UNAUTHORIZED)
        })
    })

    describe('if get comments request is correct', () => {
        it('should return the comments', async () => {
            const res = await request(server).get(`/api/posts/${postOneID}/comments`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(OK)
            expect(res.body.comments.length).toBe(1)
        })    
    })

    describe('if get comments request is not correct', () => {
        it('should not return anything if there is no authenticated user', async () => {
            await request(server).get(`/api/posts/${postOneID}/comments`)
                .send()
                .expect(UNAUTHORIZED)
        })
        it('should not do anything if there is no post', async () => {
            await request(server).get(`/api/posts/123456/comments`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(BAD_REQUEST)
        })
    })
})