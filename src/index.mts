interface Node<Key, Value> {
    key: Key | null;
    value: Value | undefined;
    expirationTime: number | null;
    prev: Node<Key, Value> | null;
    next: Node<Key, Value> | null;
}

interface HeadNode<Key, Value> extends Node<Key, Value> {
    key: null;
    prev: null;
    next: TailNode<Key, Value> | MiddleNode<Key, Value>;
}

interface MiddleNode<Key, Value> extends Node<Key, Value> {
    key: Key;
    prev: HeadNode<Key, Value> | MiddleNode<Key, Value>;
    next: MiddleNode<Key, Value> | TailNode<Key, Value>;
}

interface TailNode<Key, Value> extends Node<Key, Value> {
    key: null;
    prev: HeadNode<Key, Value> | MiddleNode<Key, Value>;
    next: null;
}

interface DisjointedNode<Key, Value> extends Node<Key, Value> {
    key: Key;
    prev: null;
    next: null;
}

export class LRUCache<Key = unknown, Value = unknown> {
    private readonly capacity: number;
    private readonly cache = new Map<Key, MiddleNode<Key, Value>>();
    private readonly head: HeadNode<Key, Value>;
    private readonly tail: TailNode<Key, Value>;

    public constructor(capacity: number) {
        this.capacity = capacity;
        this.head = { key: null, value: undefined, expirationTime: null, prev: null, next: null! };
        this.tail = { key: null, value: undefined, expirationTime: null, prev: this.head, next: null };
        this.head.next = this.tail;
    }

    public get(key: Key): Value | undefined {
        const node = this.cache.get(key);
        if (node !== undefined) {
            if (node.expirationTime !== null && node.expirationTime < Date.now()) {
                this.removeNode(node);
                return undefined;
            }

            this.moveToHead(node);
            return node.value;
        }

        return undefined;
    }

    public set(key: Key, value: Value, expirationTime: number | null = null): Value {
        const node = this.cache.get(key);
        const expiration = expirationTime !== null ? Date.now() + expirationTime : null;
        if (node !== undefined) {
            node.value = value;
            node.expirationTime = expiration;
            this.moveToHead(node);
        } else {
            const newNode: MiddleNode<Key, Value> = {
                key,
                value,
                expirationTime: expiration,
                prev: this.head,
                next: this.head.next,
            };
            this.head.next.prev = newNode;
            this.head.next = newNode;
            this.cache.set(key, newNode);

            if (this.cache.size > this.capacity) {
                this.removeNode(this.tail.prev as MiddleNode<Key, Value>);
            }
        }

        return value;
    }

    public remove(key: Key): void {
        const node = this.cache.get(key);
        if (node !== undefined) {
            this.removeNode(node);
        }
    }

    public clear(): void {
        this.cache.clear();
        let next = this.head.next;
        while (next !== this.tail) {
            const node = next as MiddleNode<Key, Value>;
            next = node.next;
            (node as unknown as DisjointedNode<Key, Value>).prev = null;
            (node as unknown as DisjointedNode<Key, Value>).next = null;
        }

        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    public get keys(): Key[] {
        return Array.from(this.cache.keys());
    }

    public get length(): number {
        return this.cache.size;
    }

    private moveToHead(node: MiddleNode<Key, Value>): void {
        node.prev.next = node.next;
        node.next.prev = node.prev;

        node.prev = this.head;
        node.next = this.head.next;
        this.head.next.prev = node;
        this.head.next = node;
    }

    private removeNode(node: MiddleNode<Key, Value>): void {
        node.prev.next = node.next;
        node.next.prev = node.prev;
        this.cache.delete(node.key);
        (node as unknown as DisjointedNode<Key, Value>).prev = null;
        (node as unknown as DisjointedNode<Key, Value>).next = null;
    }
}
