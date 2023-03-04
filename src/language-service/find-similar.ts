export const findSimilar = (options: string[], item: string, fromStart: boolean = true, matchCase: boolean = true): string[] => {
    let partial: string[] = [...options];
    let output: string[] = [];
    for (let i = 1; i <= item.length; i++) {
        const sub = fromStart ? item.substring(0, i) : item.substring(item.length - i, item.length);

        const subFormatted = matchCase ? sub : sub.toLowerCase();
        
        const filteredOptions = partial
            .filter(option => {
                const optionFormatted = matchCase ? option : option.toLowerCase();
                return fromStart
                    ? optionFormatted.startsWith(subFormatted)
                    : optionFormatted.endsWith(subFormatted);
            });
        
        if (filteredOptions.length === 0)
            break;
        
        partial = filteredOptions;
        output = partial;
    }
    return output;
}

export const findSimilarStartEnd = (options: string[], item: string, matchCase: boolean = true): string[] => {
    const similarStart = findSimilar(options, item, true, matchCase);
    const similarStartSet = new Set(similarStart);
    const similarEnd = findSimilar(options.filter(option => !similarStartSet.has(option)), item, false, matchCase);
    return similarStart.concat(similarEnd);
}
