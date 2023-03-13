import { Router } from "express"
import commentRouter from './commentRoutes'
import likeRouter from './likeRoutes'
import { createPost, deletePost, getPost, getPosts, updatePost } from "../controllers/postController"
const router = Router()

router.use('/:postId/comments', commentRouter)
router.use('/:postId/likes', likeRouter)
router.post('/', createPost)
router.patch('/:postId', updatePost)
router.delete('/:postId', deletePost)
router.get('/:postId', getPost)
router.get('/', getPosts)

export default router