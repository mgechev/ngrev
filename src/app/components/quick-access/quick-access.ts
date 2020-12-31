export interface KeyValuePair<T> {
  key: string;
  value: T;
}

export interface QueryObject {
  [index: number]: string[];
}
