require('dotenv').config()
const request = require('supertest')
const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const { UNAUTHORIZED, BAD_REQUEST, CREATED, OK } = StatusCodes
const { Post } = require('../../src/models/Post')
const { setupDatabase, server, userOneToken, postOneID, userTwoToken, postOne } = require('../setup')
const { User } = require('../../src/models/User')

const testContent = {
    title: 'test',
    content: 'test'
}

beforeEach(setupDatabase)
afterEach(async () => {
    await mongoose.connection.close()
    server.close()
})

describe('posts feature tests', () => {
    describe('if post create request is correct', () => {
        it('should create a post', async () => {
            await request(server).post('/api/posts')
                .set('Authorization', `Bearer ${userOneToken}`)
                .send(testContent)
                .expect(CREATED)
            const post = await Post.findOne(testContent)
            expect(post).not.toBeNull()
        })

        it('should belong to a user', async () => {
            await request(server).post('/api/posts')
                .set('Authorization', `Bearer ${userOneToken}`)
                .send(testContent)
                .expect(CREATED)
            const user = await User.findOne(testContent)
            expect(user.posts.length).toEqual(2)
        })
    })

    describe('if post create request is not correct', () => {
        it('should not create a post if there is no authenticated user', async () => {
            await request(server).post('/api/posts')
                .send(testContent)
                .expect(UNAUTHORIZED)
        })
        
        it('should not create a post if title or content are missing', async () => {
            await request(server).post('/api/posts')
                .set('Authorization', `Bearer ${userOneToken}`)
                .send({
                    ...testContent,
                    title: ''
                })
                .expect(BAD_REQUEST)
            
                await request(server).post('/api/posts')
                .set('Authorization', `Bearer ${userOneToken}`)
                .send({
                    ...testContent,
                    content: ''
                })
                .expect(BAD_REQUEST)
        })

        it('should not create post if title or content are too long', async () => {
            const testValue = 'a'.repeat(10001)
            await request(server).post('/api/posts')
                .set('Authorization', `Bearer ${userOneToken}`)
                .send({
                    ...testContent,
                    title: testValue
                })
                .expect(BAD_REQUEST)
            
            await request(server).post('/api/posts')
                .set('Authorization', `Bearer ${userOneToken}`)
                .send({
                    ...testContent,
                    content: testValue
                })
                .expect(BAD_REQUEST)
        })
    })

    describe('if update post request is correct', () => {
        it('should update the post', async () => {
            const res = await request(server).patch(`/api/posts/${postOneID}`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send({
                    'title': 'update'
                })
        
            const post = await Post.findOne({ title: 'update' })
            expect(post).not.toBeNull()
        })
    })

    describe('if update post request is not correct', () => {
        it('should not update if user is not the author of the post', async () => {
            await request(server).patch(`/api/posts/${postOneID}`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send({
                    'title': 'update'
                })
                .expect(UNAUTHORIZED)
        })

        it('should not update if data isn\'t correct', async () => {
            const testValue = 'a'.repeat(10001)
            await request(server).patch(`/api/posts/${postOneID}`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(BAD_REQUEST)
            
            await request(server).patch(`/api/posts/${postOneID}`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send({
                    title: testValue
                })
                .expect(BAD_REQUEST)
            
            await request(server).patch(`/api/posts/${postOneID}`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send({
                    content: testValue
                })
                .expect(BAD_REQUEST)
        })

        it('should not do anything if there is not post', async () => {
            await request(server).patch(`/api/posts/123456`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(BAD_REQUEST)
        })
    })

    describe('if delete post request is correct', () => {
        it('should delete the post', async () => {
            await request(server).delete(`/api/posts/${postOneID}`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(OK)
            const post = await Post.findOne({ title: postOne.title })
            expect(post).toBeNull()
        })
    })

    describe('if delete post request is not correct', () => {
        it('should not delete post if user is not the author', async () => {
            await request(server).delete(`/api/posts/${postOneID}`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(UNAUTHORIZED)
        })

        it('should do nothing if there is no post', async () => {
            await request(server).delete('/api/posts/123465')
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(BAD_REQUEST)
        })
    })

    describe('if get single post request is correct', () => {
        it('should return a post', async () => {
            const res = await request(server).get(`/api/posts/${postOneID}`)
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(OK)
            expect(res.body.post).not.toBeNull()
            expect(res.body.post.title).toEqual(postOne.title)
        })
    })

    describe('if get single post request is not correct', () => {
        it('should not do anything if post doesn\'t exist', async () => {
            await request(server).get('/api/posts/123456')
                .set('Authorization', `Bearer ${userTwoToken}`)
                .send()
                .expect(BAD_REQUEST)
        })
    })

    describe('if get request is correct', () => {
        it('should return all posts, a page and a limit', async () => {
            const res = await request(server).get('/api/posts')
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(OK)
            expect(res.body.posts.length).toBe(2)
            expect(res.body.limit).toBe(5)
            expect(res.body.page).toBe(1)
        })

        it('should return a search request', async () => {
            const res = await request(server).get(`/api/posts?q=${postOne.title}`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(OK)
            expect(res.body.posts.length).toBe(1)
        })

        it('should be able to limit a search request', async () => {
            const res = await request(server).get(`/api/posts?limit=1`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(OK)
            expect(res.body.posts.length).toBe(1)
            expect(res.body.limit).toBe(1)
        })

        it('should be able to choose the page', async () => {
            const res = await request(server).get(`/api/posts?limit=1&page=2`)
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(OK)
            expect(res.body.posts.length).toBe(1)
            expect(res.body.page).toBe(2)
        })
    })

    describe('if get request is not ok', () => {
        it('should not return any posts if noone exist with that search term', async () => {
            const res = await request(server).get('/api/posts?q=xxxxxxxx')
                .set('Authorization', `Bearer ${userOneToken}`)
                .send()
                .expect(OK)
            
            expect(res.body.posts.length).toBe(0)
        })
    })
})