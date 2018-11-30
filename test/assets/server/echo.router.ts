import {Router, Response, Request} from 'express';

const EchoRouter = Router();

const sendResponse = (method: string, req: Request, res: Response) => {
    res.json({
        method: method,
        query: req.query,
        headers: req.headers,
        body: req.body
    });
};

EchoRouter.get('/', (req: Request, res: Response) => {
    sendResponse('GET', req, res);
});

EchoRouter.delete('/', (req: Request, res: Response) => {
    sendResponse('DELETE', req, res);
});

EchoRouter.post('/', (req: Request, res: Response) => {
    sendResponse('POST', req, res);
});

EchoRouter.put('/', (req: Request, res: Response) => {
    sendResponse('PUT', req, res);
});

EchoRouter.patch('/', (req: Request, res: Response) => {
    sendResponse('PATCH', req, res);
});

export {EchoRouter};
