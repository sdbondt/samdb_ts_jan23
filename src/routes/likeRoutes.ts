import { Router } from 'express'
import { handleLike } from '../controllers/likeController'
const router = Router({ mergeParams: true})

router.post('/', handleLike)

export default router

