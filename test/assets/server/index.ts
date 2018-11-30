import * as express from 'express';
import {EchoRouter} from './echo.router';
import {processSend} from './utils';
import {json, urlencoded} from 'body-parser';
import {join} from 'path';

const app = express();
const port = 3000;

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(`-> Received ${req.method} request on ${req.path}`);
    
    res.header('x-request', JSON.stringify({
        query: req.query,
        body: req.body,
        headers: req.headers
    }));

    next();
});

app.use(
    '/static',
    express.static(
        join(__dirname, '../../../../test/assets/server/static')
    )
);

app.use(json());
app.use('/json', EchoRouter);

app.use(urlencoded());
app.use('/form', EchoRouter);

app.listen(port, (err: Error) => {
    if (err) {
        processSend('failed');
        console.error(err);
        process.exit(1);
    }

    console.log('Server is running on port: ' + port);
    processSend('started');
});
