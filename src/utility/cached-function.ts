type AnyFunction = (...args: any[]) => any;

export type CachedFunction<Func extends AnyFunction> = ((...args: Parameters<Func>) => ReturnType<Func>) & {
    clearCache: () => void;
}

export const createCachedFunction = <Func extends AnyFunction>(func: Func): CachedFunction<Func> => {

    const cache = new Map<string, ReturnType<Func>>();
    
    return Object.assign((...args: Parameters<Func>) => {

        const key = args.join(",");
        const cachedResult = cache.get(key);
        if (cachedResult) {
            return cachedResult;
        }

        const result = func(...args);

        if (result instanceof Promise)
            result.catch(err => {
                cache.delete(key);
                throw err;
            });
        
        cache.set(key, result);
        
        return result;
    }, {
        clearCache: () => {
            cache.clear();
        }
    });
}
