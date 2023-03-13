import { Comment } from "../models/Comment"
import { Like } from "../models/Like"
import { Post } from "../models/Post"
import { User } from "../models/User"

const resetDB = async (): Promise<void> => {
    try {
        await User.deleteMany()
        await Post.deleteMany()
        await Comment.deleteMany()
        await Like.deleteMany()
    } catch (e) {
        console.log(e)
    }
}

export default resetDB