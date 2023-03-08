export type RequiredProp<T extends Object, Prop extends keyof T> = T & Required<Pick<T, Prop>>;
