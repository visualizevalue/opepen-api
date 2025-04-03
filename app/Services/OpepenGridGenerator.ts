import { ModelType, GridItem } from './GridItem'
import BaseOpepenGrid from './BaseOpepenGrid'
import BurnedOpepen from 'App/Models/BurnedOpepen'

export class OpepenGridGenerator {
  public async make(
    models: ModelType[],
    forceSquare: boolean = true,
    highlighted: string[] = [],
  ) {
    const gridItems = models.map((m) => {
      const type = m instanceof BurnedOpepen ? 'burned_opepen' : 'opepen'
      return new GridItem(m, type)
    })

    return BaseOpepenGrid.make(gridItems, forceSquare, highlighted)
  }
}

export default new OpepenGridGenerator()
