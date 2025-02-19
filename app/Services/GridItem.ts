import { DateTime } from 'luxon'
import Opepen from 'App/Models/Opepen'
import BurnedOpepen from 'App/Models/BurnedOpepen'

export type ModelType = Opepen | BurnedOpepen

export class GridItem {
  public model: ModelType
  public type: 'opepen' | 'burned_opepen'

  constructor(model: ModelType, type: 'opepen' | 'burned_opepen') {
    this.model = model
    this.type = type
  }

  get tokenId(): string {
    return this.model.tokenId.toString()
  }

  get updatedAt(): DateTime {
    return this.model.updatedAt
  }

  get image() {
    return this.model.image
  }
}
