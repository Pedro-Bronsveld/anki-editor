import { AnkiConnect } from "../anki-connect/anki-connect";

export default class AnkiModelDataProvider {

    constructor(public readonly ankiConnect: AnkiConnect) { }

    public async getModelNames(): Promise<Set<string>> {
        return new Set(await this.ankiConnect.getModelNames());
    }
    
    public async getFieldNames(modelName: string): Promise<string[]> {
        const modelNames = await this.getModelNames();
        if (!modelNames.has(modelName))
            return [];
        
        return await this.ankiConnect.getModelFieldNames(modelName);   
    }
}
