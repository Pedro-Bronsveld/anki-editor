type AnyFunction = (...args: any[]) => any;

type CachedEntry<Func extends AnyFunction> = {
    readonly args: Parameters<Func>,
    readonly value: ReturnType<Func>,
    readonly created: number,
    accessed: number
}

export type CachedFunction<Func extends AnyFunction> = ((...args: Parameters<Func>) => ReturnType<Func>) & CachedFunctionProperties<Func>;

interface CachedFunctionProperties<Func extends AnyFunction> {
    cache: Map<string, CachedEntry<Func>>,
    clearCache: () => void;
    clearCacheWhere: (predicate: (entry: CachedEntry<Func>, key: string) => boolean) => void;
}

interface CachedFunctionOptions<Func extends AnyFunction> {
    cache?: Map<string, CachedEntry<Func>>,
    maxSize?: number,
    maxTime?: number,
    cacheKey?: (...args: Parameters<Func>) => string,
    onCacheMiss?: (cachedFuncion: CachedFunction<Func>, args: Parameters<Func>) => void;
    onCacheHit?: (cachedFuncion: CachedFunction<Func>, entry: CachedEntry<Func>) => void;
}

export const createCachedFunction = <Func extends AnyFunction>(func: Func, options: CachedFunctionOptions<Func> = {}): CachedFunction<Func> => {

    const cache = options.cache ?? new Map<string, CachedEntry<Func>>();
    
    const cachedFunction = Object.assign((...args: Parameters<Func>) => {

        const key = options.cacheKey?.(...args) ?? args.join(",");
        const cachedResult = cache.get(key);
        if (cachedResult && (options.maxTime === undefined || cachedResult.created > Date.now() - options.maxTime)) {
            if (options.onCacheHit)
                options.onCacheHit(cachedFunction, cachedResult);
            cachedResult.accessed = Date.now();
            return cachedResult.value;
        }
        
        if (options.onCacheMiss)
            options.onCacheMiss(cachedFunction, args);

        const result = func(...args);

        const created = Date.now();
        const entry: CachedEntry<Func> = {
            args,
            value: result,
            created,
            accessed: created
        }
        cache.set(key, entry);

        if (options.maxSize !== undefined && cache.size > options.maxSize)
            removeLeastAccessedEntry(cache);

        if (result instanceof Promise)
            result.catch(err => {
                cache.delete(key);
                throw err;
            });
                
        return result;
    }, <CachedFunctionProperties<Func>>{
        cache,
        clearCache: () => {
            cache.clear();
        },
        clearCacheWhere: (predicate) => {
            for (const [key, entry] of cache.entries()) {
                if (predicate(entry, key))
                    cache.delete(key)
            }
        }
    });
    return cachedFunction;
}

const removeLeastAccessedEntry = <Func extends AnyFunction>(cache: Map<string, CachedEntry<Func>>) => {

    const iterator = cache.entries();
    const first = iterator.next();

    if (first.done)
        return;
    
    let [oldestKey, oldestEntry] = first.value;

    for (const [key, entry] of iterator) {
        if (entry.accessed < oldestEntry.accessed) {
            oldestKey = key;
            oldestEntry = entry;
        }
    }

    cache.delete(oldestKey);
}
