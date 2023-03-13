type AnyFunction = (...args: any[]) => any;

export type CachedFunction<Func extends AnyFunction> = ((...args: Parameters<Func>) => ReturnType<Func>) & {
    clearCache: () => void;
}

export const createCachedFunction = <Func extends AnyFunction>(func: Func): CachedFunction<Func> => {

    const cache = new Map<Parameters<Func>, ReturnType<Func>>();
    
    return Object.assign((...args: Parameters<Func>) => {

        const cachedResult = cache.get(args);
        if (cachedResult)
            return cachedResult;

        const result = func(...args);
        cache.set(args, result);
        
        return result;
    }, {
        clearCache: () => {
            cache.clear();
        }
    });
}
