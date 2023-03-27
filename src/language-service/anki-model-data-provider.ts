import AnkiConnect from "../anki-connect/anki-connect";

export default class AnkiModelDataProvider {

    constructor(public readonly ankiConnect: AnkiConnect) { }

    public async getModelNames(): Promise<Set<string>> {
        return new Set(await this.ankiConnect.getModelNames());
    }

    private async modelExists(modelName: string): Promise<boolean> {
        const modelNames = await this.getModelNames();
        return modelNames.has(modelName);
    }
    
    public async getFieldNames(modelName: string): Promise<string[]> {
        if (!await this.modelExists(modelName))
            return [];
        
        return await this.ankiConnect.getModelFieldNames(modelName);   
    }

    /**
     * Checks if the given model name contains exactly one card type,
     * and that the card type is named "Cloze".
     * If both conditions are true, the model is probably a cloze note type.
     * 
     * However, it will also return true if the card name of a basic note
     * type has been changed to "Cloze". But that's too much of an
     * edge-case to handle.
     * 
     * @param modelName name of the model to check for if it's a cloze.
     * @returns 
     */
    public async probablyCloze(modelName: string): Promise<boolean> {
        if (!await this.modelExists(modelName))
            return false;
        
        const model = await this.ankiConnect.getModelTemplates(modelName);

        const cardNames = Object.keys(model);
        
        return cardNames.length === 1 && cardNames[0] === "Cloze";
    }
    
}
