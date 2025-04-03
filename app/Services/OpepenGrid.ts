import BaseOpepenGrid from './BaseOpepenGrid'
import Opepen from 'App/Models/Opepen'
import { GridItem } from './GridItem'

export class OpepenGrid {
  public async make(ids: string[], forceSquare: boolean = true, highlighted: string[] = []) {
    const uniqueIds = Array.from(new Set(ids.concat(highlighted)))
    const opepenRecords = await Opepen.query()
      .preload('image')
      .whereIn('tokenId', uniqueIds)
      .orderBy('updatedAt', 'desc')
      .limit(81)

    const gridItems = opepenRecords.map((rec) => {
      return new GridItem(rec, 'opepen')
    })

    return BaseOpepenGrid.make(gridItems, forceSquare, highlighted)
  }
}

export default new OpepenGrid()
