export interface IHTTPRequestOptions {
    method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
    url: string;
    query?: { [key: string]: string | number | (string | number)[] };
    headers?: { [key: string]: number | string | string[] };
    body?: {
        form?: {
            multipart?: {
                fields?: { [key: string]: string | boolean | number };
                files?: { [key: string]: string };
            };
            urlencoded?: { [key: string]: string | boolean | number };
        };
        json?: any;
        file?:
            | string
            | {
                  path: string;
                  template?: boolean;
              };
    };
    timeout?: number;
}
