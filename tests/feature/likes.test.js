require('dotenv').config()
const request = require('supertest')
const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const { UNAUTHORIZED, BAD_REQUEST, CREATED, OK } = StatusCodes
const { setupDatabase, server, userOneToken, postOneID, userTwoToken, postOne, userTwoID, commentOneID, commentOne, userOneID } = require('../setup')
const { Like } = require('../../src/models/Like')

beforeEach(setupDatabase)
afterEach(async () => {
    await mongoose.connection.close()
    server.close()
})

describe('likes feature tests', () => {
    describe('like request is correct', () => {
        it('should create a like for a post if it doesn\'t exist already.', async () => {
            await request(server).post(`/api/posts/${postOneID}/likes`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(CREATED)
            
            const like = await Like.findOne({
                user: userTwoID,
                onModel: 'Post',
                onDocument: postOneID,
                receiver: postOne.user
            })
            expect(like).not.toBeNull()
        })
    
        it('should create a like for a comment if it doesn\'t already exist.', async () => {
            await request(server).post(`/api/comments/${commentOneID}/likes`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(CREATED)
            
            const like = await Like.findOne({
                    user: userTwoID,
                    onModel: 'Comment',
                    onDocument: commentOneID,
                    receiver: commentOne.user
            })
            expect(like).not.toBeNull()
        })
    
        it('should remove a like for a post if it already exists', async () => {
            await request(server).post(`/api/posts/${postOneID}/likes`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(OK)
            
            const like = await Like.findOne({
                user: userOneID,
                onModel: 'Post',
                onDocument: postOneID,
                receiver: postOne.user
            })
            expect(like).toBeNull()
        })

        it('should remove a like for a comment if it already exists', async () => {
            await request(server).post(`/api/comments/${commentOneID}/likes`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(OK)
            
            const like = await Like.findOne({
                user: userOneID,
                onModel: 'Comment',
                onDocument: commentOneID,
                receiver: commentOne.user
            })
            expect(like).toBeNull()
        })
    })
    
    describe('like request is not correct', () => {
        it('should not create like if there is not post or comment', async () => {
            await request(server).post('/api/comments/123456/likes')
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(BAD_REQUEST)
            
            await request(server).post('/api/posts/123456/likes')
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(BAD_REQUEST)
        })

        it('should not create like if there is no authenticated user', async () => {
            await request(server).post('/api/comments/123456/likes')
                .send()
                .expect(UNAUTHORIZED)
            
            await request(server).post('/api/posts/123456/likes')
                .send()
                .expect(UNAUTHORIZED)
        })
    })
})