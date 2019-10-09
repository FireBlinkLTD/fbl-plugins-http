import { Router, Response, Request } from 'express';

const EchoRouter500 = Router();

const sendResponse = (method: string, req: Request, res: Response) => {
    res.status(500).json({
        method: method,
        query: req.query,
        headers: req.headers,
        body: req.body,
    });
};

EchoRouter500.get('/', (req: Request, res: Response) => {
    sendResponse('GET', req, res);
});

EchoRouter500.delete('/', (req: Request, res: Response) => {
    sendResponse('DELETE', req, res);
});

EchoRouter500.post('/', (req: Request, res: Response) => {
    sendResponse('POST', req, res);
});

EchoRouter500.put('/', (req: Request, res: Response) => {
    sendResponse('PUT', req, res);
});

EchoRouter500.patch('/', (req: Request, res: Response) => {
    sendResponse('PATCH', req, res);
});

export { EchoRouter500 };
