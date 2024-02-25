import { deepStrictEqual, strictEqual } from 'node:assert/strict';
import { LRUCache } from '../src/index.mjs';

describe('LRUCache', function () {
    describe('set()', function () {
        it('should return the value being set', function () {
            const cache = new LRUCache<number, number>(2);
            strictEqual(cache.set(1, 1), 1);
            strictEqual(cache.set(2, 2), 2);
        });

        it('should overwrite old values', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1);
            // eslint-disable-next-line sonarjs/no-element-overwrite
            cache.set(1, 11); // NOSONAR
            strictEqual(cache.get(1), 11);
        });

        it('should grow the cache', function () {
            const cache = new LRUCache<number, number>(2);
            strictEqual(cache.set(1, 1), 1);
            strictEqual(cache.length, 1);
            strictEqual(cache.set(2, 2), 2);
            strictEqual(cache.length, 2);
        });

        it('should not grow past its capacity', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1);
            cache.set(2, 2);
            cache.set(3, 3);
            strictEqual(cache.length, 2);
            cache.set(4, 4);
            strictEqual(cache.length, 2);
        });
    });

    describe('get()', function () {
        it('should return the value for a key that exists', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1);
            strictEqual(cache.get(1), 1);
        });

        it('should return undefined for a key that does not exist', function () {
            const cache = new LRUCache<number, number>(2);
            strictEqual(cache.get(1), undefined);
        });

        it('should return undefined for a key that was removed', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1);
            cache.remove(1);
            strictEqual(cache.get(1), undefined);
        });
    });

    describe('remove()', function () {
        it('should remove a key that exists', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1);
            cache.remove(1);
            strictEqual(cache.length, 0);
        });

        it('should do nothing for a key that does not exist', function () {
            const cache = new LRUCache<number, number>(2);
            cache.remove(1);
            strictEqual(cache.length, 0);
        });
    });

    describe('clear()', function () {
        it('should remove all keys', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1);
            cache.set(2, 2);
            cache.clear();
            strictEqual(cache.length, 0);
        });

        it('should not crash with empty cache', function () {
            const cache = new LRUCache<number, number>(2);
            cache.clear();
            strictEqual(cache.length, 0);
        });
    });

    describe('LRU invariant', function () {
        it('should maintain LRU invariant for get()', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1);
            cache.set(2, 2);
            cache.get(1);
            cache.set(3, 3);
            deepStrictEqual(cache.keys, [1, 3]);
        });

        it('should maintain LRU invariant for set()', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1);
            cache.set(2, 2);
            cache.set(3, 3);
            cache.set(4, 4);
            deepStrictEqual(cache.keys, [3, 4]);
        });

        it('should maintain LRU invariant after set(), get(), and remove()', function () {
            const cache = new LRUCache<string, number>(2);
            cache.set('a', 1);
            cache.set('b', 2);
            strictEqual(cache.get('a'), 1);
            cache.remove('a');
            cache.set('c', 1);
            cache.set('d', 1);
            deepStrictEqual(['c', 'd'], cache.keys);
        });

        it('should maintain LRU invariant for capacity = 1', function () {
            const cache = new LRUCache(1);

            cache.set(1, 1);
            cache.set(2, 2);
            cache.get(2);
            cache.set(3, 3);
            deepStrictEqual([3], cache.keys);
        });
    });

    describe('Expiration', function () {
        it('should remove expired keys', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1, -1000);
            strictEqual(cache.length, 1);
            strictEqual(cache.get(1), undefined);
            strictEqual(cache.length, 0);
        });

        it('should keep not expired keys', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1, 86400);
            strictEqual(cache.length, 1);
            strictEqual(cache.get(1), 1);
            strictEqual(cache.length, 1);
        });

        it('should update expiration time on set()', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1, -1000);
            cache.set(1, 1, 86400);
            strictEqual(cache.length, 1);
            strictEqual(cache.get(1), 1);
        });
    });

    describe('Idempotency', function () {
        it('set() and remove() on empty cache', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1);
            cache.remove(1);
            strictEqual(cache.length, 0);
        });

        it('set() and remove() in reverse order on non-empty cache', function () {
            const cache = new LRUCache<number, number>(2);
            cache.set(1, 1);
            cache.set(2, 2);
            cache.remove(2);
            cache.remove(1);
            strictEqual(cache.length, 0);
        });
    });

    describe('Corner cases', function () {
        it('should not crash with capacity = 0', function () {
            const cache = new LRUCache<number, number>(0);
            cache.set(1, 1);
            strictEqual(cache.get(1), undefined);
            strictEqual(cache.length, 0);
        });

        it('should not crash with negative capacity', function () {
            const cache = new LRUCache<number, number>(-1);
            cache.set(1, 1);
            strictEqual(cache.get(1), undefined);
            strictEqual(cache.length, 0);
        });
    });
});
