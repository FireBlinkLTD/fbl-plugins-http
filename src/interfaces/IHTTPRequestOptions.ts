export interface IHTTPRequestOptions {
    method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
    url: string;
    query?: Record<string, string | number | boolean | null | (string | number | boolean | null)[]>;
    headers?: Record<string, string | string[]>;
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
