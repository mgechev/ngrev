export class Node<T> {
  children: { [key: string]: Node<T> } = {};
  data?: T;
}

export interface SplitFunction {
  (str: string): string[];
}

const defaultSplit = (str: string) => str.split('');

export class Trie<T> {
  private _root = new Node<T>();
  private _size = 0;

  constructor(private splitFunction: SplitFunction = defaultSplit) {}

  get size() {
    return this._size;
  }

  insert(key: string, data: T) {
    const keyParts = this.splitFunction(key);
    let node = this.findNode(key, true);
    node.data = data;
    this._size += 1;
  }

  get(key: string): T | null {
    const node = this.findNode(key);
    return node.data || null;
  }

  clear() {
    this._root = new Node<T>();
    this._size = 0;
  }

  private findNode(key: string, createIfDoesNotExist = false): Node<T> {
    const parts = this.splitFunction(key);
    let currentNode = this._root;
    for (let i = 0; i < parts.length; i += 1) {
      let child = currentNode.children[parts[i]];
      if (!child) {
        if (createIfDoesNotExist) {
          child = new Node<T>();
          currentNode.children[parts[i]] = child;
        } else {
          return currentNode;
        }
      }
      currentNode = child;
    }
    return currentNode;
  }
}
