import { ChildProcess, fork } from 'child_process';
import { join } from 'path';

export class DummyServerWrapper {
    public static ENDPOINT = 'http://localhost:3000';

    private server: ChildProcess | null = null;
    private onServerClose: Function | null = null;

    /**
     * Start server
     * @return {Promise<void>}
     */
    async start(): Promise<void> {
        console.log('-> starting dummy server...');
        await this.stop();

        this.server = fork('index.js', [], {
            cwd: 'dist/test/assets/server',
            silent: true,
        });

        this.server.stdout.on('data', (data) => {
            console.error(`-> Server.stdout: ${data.toString().trim()}`);
        });

        this.server.stderr.on('data', (data) => {
            console.error(`-> Server.stderr: ${data.toString().trim()}`);
        });

        this.server.on('close', (code, signal) => {
            console.log('-> Server is stopped. Code: ' + code + '. Signal: ' + signal);
            this.server = null;

            if (this.onServerClose) {
                this.onServerClose();
                this.onServerClose = null;
            }
        });

        await new Promise<void>((resolve, reject) => {
            this.server.on('message', (msg: any) => {
                if (msg.name === 'started') {
                    return resolve();
                }

                if (msg.name === 'failed') {
                    return reject(new Error('Server failed to start'));
                }
            });
        });
    }

    async stop(): Promise<void> {
        if (this.server) {
            console.log('-> Killing server...');

            // give system time to free port
            await new Promise((resolve) => {
                this.onServerClose = resolve;
                this.server.kill('SIGINT');
            });
        }
    }
}
