import type { TransactionObjectInput } from './Transaction.js';
export declare function createObjectMethods<T>(makeObject: (value: TransactionObjectInput) => T): {
    (value: TransactionObjectInput): T;
    system(): T;
    clock(): T;
    random(): T;
    denyList(): T;
};
