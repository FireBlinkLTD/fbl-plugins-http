export interface IHTTPRequestOptions {
    method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
    url: string;
    query?: {[key: string]: string | string[]};
    headers?: {[key: string]: number | string | string[]};
    body?: {
        form?: {
            fields?: {[key: string]: string | boolean | number};
            files?: {[key: string]: string};
        },
        json?: any;
        file?: string | {
            path: string;
            template?: boolean;
        }
    };
    timeout?: number;
}
