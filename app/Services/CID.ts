class CID {
  private _setup: boolean = false
  public CID: any
  public jsonCodec: any
  public sha256: any

  async setup(): Promise<void> {
    if (this._setup) return

    const [{ CID }, jsonCodec, { sha256 }] = await Promise.all([
      // FIXME: Proper ESM imports
      await eval(`import('multiformats/cid')`),
      await eval(`import('multiformats/codecs/json')`),
      await eval(`import('multiformats/hashes/sha2')`),
    ])

    // Save services
    this.CID = CID
    this.jsonCodec = jsonCodec
    this.sha256 = sha256

    this._setup = true
  }

  async getJsonCID(data: any): Promise<CID> {
    await this.setup()

    const buf = this.jsonCodec.encode(data)
    const hash = await this.sha256.digest(buf)

    return this.CID.createV1(this.jsonCodec.code, hash)
  }
}

export default new CID()
