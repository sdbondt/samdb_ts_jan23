import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import cors from 'cors'
import rateLimiter from 'express-rate-limit'
const xss = require('xss-clean')
import notFoundHandler from '../errorHandlers/notFoundHandler'
import { errorHandler } from '../errorHandlers/errorHandler'
export const app = express()
import authRouter from '../routes/authRoutes'
import postRouter from '../routes/postRoutes'
import commentRouter from '../routes/commentRoutes'
import { auth } from '../middleware/auth'

app.use(cors())
app.use(express.json())
app.use(helmet())
app.use(xss())
app.use(morgan('dev'))
app.use(rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100
}))

app.get('/api/check', (req, res) => {
    res.send('check')
})
app.use('/api/auth', authRouter)
app.use('/api/posts', auth, postRouter)
app.use('/api/comments', auth, commentRouter)

app.use(notFoundHandler)
app.use(errorHandler)
