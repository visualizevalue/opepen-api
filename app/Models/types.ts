export type ContractType = 'OPEPEN'

export type EditionSize = 1|4|5|10|20|40
export type MaxReveal = { [K in EditionSize]?: number|null|undefined; }

export type Class<T = any> = new (...args: any[]) => T

export type EditionType = 'PRINT'|'NUMBERED_PRINT'|'DYNAMIC'

export type ArtistSignature = {
  set: number,
  name: string,
  artist: string,
  note?: string,
  tx?: string,
}

export type ArtistSocials = string[]

export type RichLinkData = {
  id: bigint,
  address: string,
  set_id: number,
  set_submission_id: number,
  sort_index: number,
  url: string,
  title: string,
  description: string,
  logo_image_id: bigint,
  cover_image_id: bigint,
}
