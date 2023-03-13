const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { User } = require('../src/models/User.ts')
const { Post } = require('../src/models/Post')
const { Comment } = require('../src/models/Comment')
const { connectToDB } = require('../src/db/connectToDB')
const { app } = require('../src/app/app.ts')
const { Like } = require('../src/models/Like')

const server = app.listen(process.env.PORT)
const userOneID = new mongoose.Types.ObjectId()
const userOneToken = jwt.sign(
    { userId: userOneID },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
)

const userOne = {
    _id: userOneID,
    email: process.env.USERONE_EMAIL,
    name: process.env.USERONE_NAME,
    password: process.env.USERONE_PASSWORD
}

const userTwoID = new mongoose.Types.ObjectId()
const userTwoToken = jwt.sign(
    { userId: userTwoID },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
)

const userTwo = {
    _id: userTwoID,
    email: process.env.USERTWO_EMAIL,
    name: process.env.USERTWO_NAME,
    password: process.env.USERONE_PASSWORD
}

const postOneID = new mongoose.Types.ObjectId()
const postOne = {
    _id: postOneID,
    title: 'postOne',
    content: 'postOne',
    user: userOneID
}

const postTwoID = new mongoose.Types.ObjectId()
const postTwo = {
    _id: postTwoID,
    title: 'postTwo',
    content: 'postTwo',
    user: userTwoID
}

const commentOneID = new mongoose.Types.ObjectId()
const commentOne = {
    _id: commentOneID,
    user: userOneID,
    post: postOneID,
    content: 'commentOne'
}

const commentTwoID = new mongoose.Types.ObjectId()
const commentTwo = {
    _id: commentTwoID,
    user: userTwoID,
    post: postTwoID,
    content: 'commentTwo'
}

const likeOneID = new mongoose.Types.ObjectId()
const likeOne = {
    _id: likeOneID,
    user: userOneID,
    onModel: 'Post',
    onDocument: postOneID,
    receiver: postOne.user._id
}

const likeTwoID = new mongoose.Types.ObjectId()
const likeTwo = {
    _id: likeTwoID,
    user: userOneID,
    onModel: 'Comment',
    onDocument: commentOneID,
    receiver: commentOne.user._id
}

const setupDatabase = async () => {
    try {
        await connectToDB(process.env.MONGO_TEST_URI)
        await User.deleteMany({})
        await Post.deleteMany({})
        await Comment.deleteMany({})
        await Like.deleteMany({})
        await User.create(userOne)
        await User.create(userTwo)
        await Post.create(postOne)
        await Post.create(postTwo)
        await Comment.create(commentOne)
        await Comment.create(commentTwo)
        await Like.create(likeOne)
        await Like.create(likeTwo)
    } catch (e) {
        console.log(e)
    } 
}

module.exports = {
    server,
    setupDatabase,
    userOne,
    userOneID,
    userOneToken,
    userTwo,
    userTwoID,
    userTwoToken,
    postOneID,
    postOne,
    postTwo,
    postTwoID,
    commentOneID,
    commentOne,
    commentTwoID,
    commentTwo,
    likeOne,
    likeOneID,
    likeTwo,
    likeTwoID,
}