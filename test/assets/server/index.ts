import * as express from 'express';
import { EchoRouter } from './echo.router';
import { processSend } from './utils';
import { json, urlencoded } from 'body-parser';
import { join } from 'path';
import { Form } from 'multiparty';

const app = express();
const port = 3000;

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(`-> Received ${req.method} request on ${req.path}`);

    res.header(
        'x-request',
        JSON.stringify({
            query: req.query,
            body: req.body,
            headers: req.headers,
        }),
    );

    next();
});

app.use('/static', express.static(join(__dirname, '../../../../test/assets/server/static')));

app.use('/json', json(), EchoRouter);
app.use('/form/urlencoded', urlencoded(), EchoRouter);
app.use(
    '/form/multipart',
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const form = new Form();

        form.parse(req, function(err: Error, fields: any, files: any) {
            if (err) {
                return next(err);
            }

            req.body = { fields, files };
            next();
        });
    },
    EchoRouter,
);

app.listen(port, () => {
    console.log('Server is running on port: ' + port);
    processSend('started');
}).on('error', (err: Error) => {
    processSend('failed');
    console.error(err);
    process.exit(1);
});
