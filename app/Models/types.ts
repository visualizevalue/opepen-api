export type ContractType = 'OPEPEN'

export type EditionSize = 1|4|5|10|20|40
export type MaxReveal = { [K in EditionSize]: number|null|undefined; }

export type Class<T = any> = new (...args: any[]) => T
