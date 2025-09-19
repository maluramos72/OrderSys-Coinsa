// src/react-app-env.d.ts

/// <reference types="react-scripts" />

declare module '*.csv' {
    const content: string;
    export default content;
}

declare namespace __WebpackModuleApi {
    interface RequireContext {
        keys(): string[];
        (id: string): any;
        <T>(id: string): T;
        resolve(id: string): string;
    }
}

declare const require: {
    context(directory: string, useSubdirectories?: boolean, regExp?: RegExp): __WebpackModuleApi.RequireContext;
};