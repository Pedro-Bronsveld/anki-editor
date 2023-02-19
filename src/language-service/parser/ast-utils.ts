import { AstItemBase } from './ast-models';

export const inItem = (item: AstItemBase, offset: number) =>
    offset >= item.start &&
    offset <= item.end
