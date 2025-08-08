import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class SeedBurnerAccounts extends BaseCommand {
  public static commandName = 'seed:burner_accounts'
  public static description =
    'Populate burnerAccount field for burned Opepen using burn events'

  public static settings = {
    loadApp: true,
    stayAlive: false,
  }

  public async run() {
    const { default: BurnedOpepen } = await import('App/Models/BurnedOpepen')
    const { default: Event } = await import('App/Models/Event')

    const burnedOpepen = await BurnedOpepen.query().whereNull('burnerAccount')

    let updated = 0
    let notFound = 0

    for (let i = 0; i < burnedOpepen.length; i++) {
      const burned = burnedOpepen[i]

      try {
        const burnEvent = await Event.query()
          .where('type', 'Burn')
          .where('contract', 'BURNED_OPEPEN')
          .whereRaw("(data->>'burnedId')::integer = ?", [burned.tokenId.toString()])
          .first()

        if (burnEvent?.from) {
          burned.burnerAccount = burnEvent.from
          await burned.save()
          updated++
        } else {
          notFound++
        }
      } catch (error) {
        this.logger.error(`Error processing token ${burned.tokenId}: ${error.message}`)
      }
    }

    this.logger.success(
      `Completed! Updated ${updated} tokens. ${notFound} burn events not found.`,
    )
  }
}
