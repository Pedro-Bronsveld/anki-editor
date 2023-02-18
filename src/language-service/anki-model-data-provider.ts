import { getModelFieldNames } from "../anki-connect/get-model-field-names";
import { getModelNames } from "../anki-connect/get-model-names";

export default class AnkiModelDataProvider {

    private modelNames: Set<string> | null = null;
    private modelFieldNames: Map<string, string[]> = new Map<string, string[]>();

    public async getModelNames(): Promise<Set<string>> {
        if (this.modelNames)
            return this.modelNames

        const modelNames = new Set(await getModelNames());
        this.modelNames = modelNames;

        return modelNames;
    }
    
    public async getFieldNames(modelName: string): Promise<string[]> {

        {
            const fieldNames = this.modelFieldNames.get(modelName);
            if (fieldNames !== undefined)
                return fieldNames;
        }
        
        const modelNames = await this.getModelNames();
        if (!modelNames.has(modelName))
            return [];
        
        const fieldNames = await getModelFieldNames(modelName);
        
        this.modelFieldNames.set(modelName, fieldNames);

        return fieldNames;
    }
}
