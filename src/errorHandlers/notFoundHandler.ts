import { Response, Request } from 'express'

const notFoundHandler = (req: Request, res: Response) => res.status(404).json({ msg: 'Route not found.'})

export default notFoundHandler