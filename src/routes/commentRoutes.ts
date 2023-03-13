import { Router } from "express"
import { createComment, deleteComment, getComment, getComments, updateComment } from "../controllers/commentController"
import likeRouter from '../routes/likeRoutes'
const router = Router({ mergeParams: true })

router.use('/:commentId/likes', likeRouter)
router.post('/', createComment)
router.patch('/:commentId', updateComment)
router.delete('/:commentId', deleteComment)
router.get('/:commentId', getComment)
router.get('/', getComments)

export default router