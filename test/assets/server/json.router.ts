import {Router, Response, Request} from 'express';

const JSONRouter = Router();

const sendResponse = (type: string, req: Request, res: Response) => {
    res.json({
        type: type,
        query: req.query,
        headers: req.headers,
        body: req.body
    });
};

JSONRouter.get('/', (req: Request, res: Response) => {
    sendResponse('GET', req, res);
});

JSONRouter.delete('/', (req: Request, res: Response) => {
    sendResponse('DELETE', req, res);
});

JSONRouter.post('/', (req: Request, res: Response) => {
    sendResponse('POST', req, res);
});

JSONRouter.put('/', (req: Request, res: Response) => {
    sendResponse('PUT', req, res);
});

JSONRouter.patch('/', (req: Request, res: Response) => {
    sendResponse('PATCH', req, res);
});

export {JSONRouter};
