require('dotenv').config()
const request = require('supertest')
const mongoose = require('mongoose')
const { StatusCodes } = require('http-status-codes')
const { UNAUTHORIZED, BAD_REQUEST, CREATED, OK } = StatusCodes
const { User } = require('../../src/models/User')
const{ server, setupDatabase, userOne, userOneID, userOneToken } = require('../setup')

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

describe('auth feature tests', () => {
    describe('signing up', () => {
        describe('if signup request is correct', () => {
            it('should signup user and return token', async () => {
                const response = await request(server).post('/api/auth/signup')
                .send(testUser)
                .expect(CREATED)
            
                const user = await User.findOne({ email: testUser.email })
                expect(user).not.toBeNull()
                expect(response.body.token).toEqual(expect.any(String))
            })

            it('should save hashed password', async () => {
                await request(server).post('/api/auth/signup')
                    .send(testUser)
                    .expect(CREATED)
                const user = await User.findOne({ email: testUser.email })
                expect(user.password).not.toEqual(testUser.password)
            })
        })

        describe('if signup request is not correct', () => {
            it('should not signup if data are missing', async () => {
                await request(server).post('/api/auth/signup')
                    .send({
                        ...testUser,
                        password: ''
                    })
                    .expect(BAD_REQUEST)
                
                await request(server).post('/api/auth/signup')
                    .send({
                        ...testUser,
                        confirmPassword: ''
                    })
                    .expect(BAD_REQUEST)
                
                await request(server).post('/api/auth/signup')
                    .send({
                        ...testUser,
                        name: ''
                    })
                    .expect(BAD_REQUEST)
                
                
                await request(server).post('/api/auth/signup')
                    .send({
                        ...testUser,
                        name: ''
                    })
                    .expect(BAD_REQUEST)
            })

            it('should not signup if email is incorrect', async () => {
                await request(server).post('/api/auth/signup')
                    .send({
                        ...testUser,
                        email: 'email'
                    })
                    .expect(BAD_REQUEST)
            })

            it('should not signup if passwords don\'t match', async () => {
                await request(server).post('/api/auth/signup')
                    .send({
                        ...testUser,
                        confirmPassword: 'confirmPassword'
                    })
                    .expect(BAD_REQUEST)
            })

            it('should not signup if passwords are not the right format', async () => {
                await request(server).post('/api/auth/signup')
                    .send({
                        ...testUser,
                        password: 'abcDEF',
                        confirmPassword: 'abcDEF'
                    })
                    .expect(BAD_REQUEST)
                
                await request(server).post('/api/auth/signup')
                    .send({
                        ...testUser,
                        password: 'abc123',
                        confirmPassword: 'abc123'
                    })
                    .expect(BAD_REQUEST)
                
                await request(server).post('/api/auth/signup')
                    .send({
                        ...testUser,
                        password: 'ABC123',
                        confirmPassword: 'ABC123'
                    })
                    .expect(BAD_REQUEST)
            })

            it('should not signup if email is already in use', async () => {
                await request(server).post('/api/auth/signup')
                    .send({
                        ...testUser,
                        email: userOne.email
                    })
                    .expect(BAD_REQUEST)
            })

            it('should not signup if name is already in use', async () => {
                await request(server).post('/api/auth/signup')
                    .send({
                        ...testUser,
                        name: userOne.name
                    })
                    .expect(BAD_REQUEST)
            })
        })
        
        describe('logging in', () => {
            describe('login request is correct', () => {
                it('should return a token', async () => {
                    const res = await request(server).post('/api/auth/login')
                        .send({
                            email: userOne.email,
                            password: userOne.password
                        })
                        .expect(OK)
                    
                    expect(res.body.token).toEqual(expect.any(String))
                })
            })

            describe('login request is not correct', () => {
                it('should not login if password is not correct', async () => {
                    await request(server).post('/api/auth/login')
                        .send({
                            email: userOne.email,
                            password: 'password'
                        })
                        .expect(BAD_REQUEST)
                })

                it('should not login if email doesn\'t exist', async () => {
                    await request(server).post('/api/auth/login')
                        .send({
                            email: 'userOne.email',
                            password: userOne.password
                        })
                        .expect(BAD_REQUEST)
                })

                it('should not login if email or password are not provided', async () => {
                    await request(server).post('/api/auth/login')
                        .send({
                            email: '',
                            password: userOne.password
                        })
                        .expect(BAD_REQUEST)
                    
                    await request(server).post('/api/auth/login')
                        .send({
                            email: userOne.email,
                            password: ''
                        })
                        .expect(BAD_REQUEST)
                })

            })
        })
    })
})