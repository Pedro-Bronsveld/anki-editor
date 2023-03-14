type AnyFunction = (...args: any[]) => any;

type CachedEntry<Func extends AnyFunction> = {
    args: Parameters<Func>,
    value: ReturnType<Func>
}

export type CachedFunction<Func extends AnyFunction> = ((...args: Parameters<Func>) => ReturnType<Func>) & CachedFunctionMethods<Func>;

type CachedFunctionMethods<Func extends AnyFunction> =
{
    clearCache: () => void;
    clearCacheWhere: (predicate: (entry: CachedEntry<Func>, key: string) => boolean) => void;
}

export const createCachedFunction = <Func extends AnyFunction>(func: Func): CachedFunction<Func> => {

    const cache = new Map<string, CachedEntry<Func>>();
    
    return Object.assign((...args: Parameters<Func>) => {

        const key = args
            .map(arg => typeof arg === "object"
                ? JSON.stringify(arg)
                : arg)
            .join(",");
        const cachedResult = cache.get(key);
        if (cachedResult) {
            return cachedResult.value;
        }

        const result = func(...args);

        const entry: CachedEntry<Func> = {
            args,
            value: result
        }
        cache.set(key, entry);

        if (result instanceof Promise)
            result.catch(err => {
                cache.delete(key);
                throw err;
            });
                
        return result;
    }, <CachedFunctionMethods<Func>>{
        clearCache: () => {
            cache.clear();
        },
        clearCacheWhere: (predicate) => {
            [...cache]
                .filter(([key, entry]) => predicate(entry, key))
                .forEach(([key, _]) => cache.delete(key));
        }
    });
}
