import * as express from 'express';
import {JSONRouter} from './json.router';
import {processSend} from './utils';
import {json, urlencoded} from 'body-parser';

const app = express();
const port = 3000;

app.use(json());
app.use(urlencoded());

app.use('/json', JSONRouter);

app.listen(port, (err: Error) => {
    if (err) {
        processSend('failed');
        console.error(err);
        process.exit(1);
    }

    console.log('Server is running on port: ' + port);
    processSend('started');
});
