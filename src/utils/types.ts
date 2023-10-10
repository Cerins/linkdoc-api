type OnlyPrimitiveValues<T> = {
  [K in keyof T]?: T[K] extends Function ? never : T[K];
};

export type {
    OnlyPrimitiveValues
};