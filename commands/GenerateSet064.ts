import fs from 'fs'
import Rand from 'rand-seed'
import { chunk, shuffle } from '../app/Helpers/arrays'
import { pad } from '../app/Helpers/numbers'
import { GridItem } from 'App/Services/GridItem'

import { BaseCommand } from '@adonisjs/core/build/standalone'

const rand = new Rand('064') // Seeded random generator

export default class GenerateSet064 extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'opepen:generate-set-064'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: Opepen } = await import('App/Models/Opepen')
    const { default: BaseOpepenGrid } = await import('App/Services/BaseOpepenGrid')

    const oneOfOnes = await Opepen.query()
      .preload('image')
      .whereNotNull('setId')
      .whereJsonSuperset('data', { edition: 1 })
      .orderBy('setId')
    fs.writeFileSync('./sets/064/dist/01.png', await BaseOpepenGrid.make(oneOfOnes.map(o => new GridItem(o, 'opepen'))))

    await this.makeGridForEdition(4)
    await this.makeGridForEdition(5)
    await this.makeGridForEdition(10)
    await this.makeGridForEdition(20)
    await this.makeGridForEdition(40)
  }

  private async makeGridForEdition (edition: number) {
    const { default: Opepen } = await import('App/Models/Opepen')
    const { default: BaseOpepenGrid } = await import('App/Services/BaseOpepenGrid')

    console.log(`Making grid for edition ${edition}`)

    const opepen = await Opepen.query()
      .preload('image')
      .whereNotNull('setId')
      .whereJsonSuperset('data', { edition })
      .orderBy('setEditionId')

    const chunks = chunk(opepen, 64)
    let idx = 0
    for (const chunk of chunks) {
      idx++
      const shuffled = shuffle(chunk, rand)
      fs.writeFileSync(
        `./sets/064/dist/${pad(edition)}-${pad(idx)}.png`,
        await BaseOpepenGrid.make(shuffled.map(o => new GridItem(o, 'opepen')))
      )
    }
  }

}
