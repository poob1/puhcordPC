import { FilterFn, find } from "../webpack";
import { React } from "../webpack/common";

/**
 * Makes a lazy function. On first call, the value is computed.
 * On subsequent calls, the same computed value will be returned
 * @param factory Factory function
 */
export function lazy<T>(factory: () => T): () => T {
    let cache: T;
    return () => cache ?? (cache = factory());
}

/**
 * Do a lazy webpack search. Searches the module on first property access
 * @param filter Filter function
 * @returns A proxy to the webpack module. Not all traps are implemented, may produce unexpected results.
 */
export function lazyWebpack<T = any>(filter: FilterFn): T {
    const getMod = lazy(() => find(filter));

    return new Proxy(() => null, {
        get: (_, prop) => getMod()[prop],
        set: (_, prop, value) => getMod()[prop] = value,
        has: (_, prop) => prop in getMod(),
        apply: (_, $this, args) => (getMod() as Function).apply($this, args),
        ownKeys: () => Reflect.ownKeys(getMod()),
        construct: (_, args, newTarget) => Reflect.construct(getMod(), args, newTarget),
        deleteProperty: (_, prop) => delete getMod()[prop],
        defineProperty: (_, property, attributes) => !!Object.defineProperty(getMod(), property, attributes)
    }) as any as T;
}

/**
 * Await a promise
 * @param factory Factory
 * @param fallbackValue The fallback value that will be used until the promise resolved
 * @returns [value, error, isPending]
 */
export function useAwaiter<T>(factory: () => Promise<T>): [T | null, any, boolean];
export function useAwaiter<T>(factory: () => Promise<T>, fallbackValue: T): [T, any, boolean];
export function useAwaiter<T>(factory: () => Promise<T>, fallbackValue: T | null = null): [T | null, any, boolean] {
    const [state, setState] = React.useState({
        value: fallbackValue,
        error: null as any,
        pending: true
    });

    React.useEffect(() => {
        let isAlive = true;
        factory()
            .then(value => isAlive && setState({ value, error: null, pending: false }))
            .catch(error => isAlive && setState({ value: null, error, pending: false }));

        return () => void (isAlive = false);
    }, []);

    return [state.value, state.error, state.pending];
}

/**
 * A lazy component. The factory method is called on first render. For example useful
 * for const Component = LazyComponent(() => findByDisplayName("...").default)
 * @param factory Function returning a Component
 * @returns Result of factory function
 */
export function LazyComponent<T = any>(factory: () => React.ComponentType<T>) {
    return (props: T) => {
        const Component = React.useMemo(factory, []);
        return <Component {...props as any /* I hate react typings ??? */} />;
    };
}

/**
 * Recursively merges defaults into an object and returns the same object
 * @param obj Object
 * @param defaults Defaults
 * @returns obj
 */
export function mergeDefaults<T>(obj: T, defaults: T): T {
    for (const key in defaults) {
        const v = defaults[key];
        if (typeof v === "object" && !Array.isArray(v)) {
            obj[key] ??= {} as any;
            mergeDefaults(obj[key], v);
        } else {
            obj[key] ??= v;
        }
    }
    return obj;
}


/**
 * Join an array of strings in a human readable way (1, 2 and 3)
 * @param elements Elements
 */
export function humanFriendlyJoin(elements: string[]): string;
/**
 * Join an array of strings in a human readable way (1, 2 and 3)
 * @param elements Elements
 * @param mapper Function that converts elements to a string
 */
export function humanFriendlyJoin<T>(elements: T[], mapper: (e: T) => string): string;
export function humanFriendlyJoin(elements: any[], mapper: (e: any) => string = s => s): string {
    const { length } = elements;
    if (length === 0) return "";
    if (length === 1) return mapper(elements[0]);

    let s = "";

    for (let i = 0; i < length; i++) {
        s += mapper(elements[i]);
        if (length - i > 2) s += ", ";
        else if (length - i > 1) s += " and ";
    }

    return s;
}

/**
 * Calls .join(" ") on the arguments
 * classes("one", "two") => "one two"
 */
export function classes(...classes: string[]) {
    return classes.join(" ");
}

export function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
}
