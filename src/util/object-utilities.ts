/**
 * Returns a list of all the properties in a given object
 * in a type safe way.
 * This function basically wraps `Object.keys` and retains
 * the type information of its keys.
 * @param object from which the keys will be returned.
 * @returns a list of strings of all the properties on `object`.
 */
export const getKeys = <Obj extends Object>(object: Obj): (keyof Obj)[] => Object.keys(object) as Array<keyof Obj>

/**
 * Returns a list of all the entries (key, values) for a given object
 * in a type safe way.
 * @param object from which the entries will be returned.
 * @returns a list of tuples containing the keys and values
 * of all the properties on `object`.
 */
export const objectEntries = <Obj extends Object>(object: Obj): { [Key in keyof Obj]: [Key, Obj[Key]] }[keyof Obj][] =>
    getKeys(object).map((key): [typeof key, (typeof object)[typeof key]] => [key, object[key]]);
