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

export type EditionGroups = { [K in EditionSize]: BigInt[] }
export type SubmissionStats = {
  holders: {
    1: number
    4: number
    5: number
    10: number
    20: number
    40: number
    total: number
  },
  opepens: {
    1: number
    4: number
    5: number
    10: number
    20: number
    40: number
    total: number
  },
  demand: {
    1: number
    4: number
    5: number
    10: number
    20: number
    40: number
    total: number
  },
  totalHolders?: number
}

export type CurationStat = {
  [key: string]: {
    opepens: number,
    demand: number,
  }
}

export type CurationStats = {
  1: CurationStat,
  4: CurationStat,
  5: CurationStat,
  10: CurationStat,
  20: CurationStat,
  40: CurationStat,
  total: CurationStat,
}

export type FarcasterData = {
  fid: number,
  username: string|undefined,
}

export type OauthData = {
  accessToken: string|undefined
  refreshToken: string|undefined
  expiresAt: string|undefined
  twitterUser: {
    id: string
    name: string
    username: string
  }|undefined
}
