/* eslint-disable @typescript-eslint/no-explicit-any */
// type OnlyPrimitiveValues<T> = {
//     [K in keyof T]: T[K] extends (...args: any[]) => any ? never : T[K];
// };

type MakeAllOptional<T> = {
    [P in keyof T]?: T[P];
};

type NonFunctionKeys<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? never : K;
}[keyof T];

type OnlyPrimitiveValues<T> = Pick<T, NonFunctionKeys<T>>;

export type { OnlyPrimitiveValues, MakeAllOptional };
