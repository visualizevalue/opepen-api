import BaseOpepenGrid from './BaseOpepenGrid'
import Opepen from 'App/Models/Opepen'

export class OpepenGrid {

  public async make (ids: string[], forceSquare: boolean = true, highlighted: string[] = []) {
    const opepen = await Opepen.query()
      .preload('image')
      .whereIn('tokenId', Array.from(new Set(ids.concat(highlighted))))
      .orderBy('updatedAt', 'desc')
      .limit(81)

    return BaseOpepenGrid.make(opepen, forceSquare, highlighted)
  }
}

export default new OpepenGrid()
