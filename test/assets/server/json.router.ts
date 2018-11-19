import {Router, Response, Request} from 'express';

const JSONRouter = Router();

JSONRouter.get('/', (req: Request, res: Response) => {
    res.json({
        type: 'GET',
        query: req.query,
        headers: req.headers
    })
});

JSONRouter.post('/', (req: Request, res: Response) => {
    res.json({
        type: 'POST',
        query: req.query,
        headers: req.headers,
        body: req.body
    })
});


export {JSONRouter};