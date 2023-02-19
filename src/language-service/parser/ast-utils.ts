import { AstItemBase } from './ast-models';

export const inItem = (item: AstItemBase, offset: number) =>
    offset >= item.start &&
    offset <= item.end

export const getItemAtOffset = <T extends AstItemBase>(items: T[], offset: number): T | undefined =>
    items.find(item => inItem(item, offset))
