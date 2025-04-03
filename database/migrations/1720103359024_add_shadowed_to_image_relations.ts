import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected submissionsTable = 'set_submissions'
  protected postsTable = 'posts'

  public async up() {
    this.schema.alterTable(this.submissionsTable, (table) => {
      table.timestamp('shadowed_at', { useTz: true })
    })

    this.schema.alterTable(this.postsTable, (table) => {
      table.timestamp('shadowed_at', { useTz: true })
    })
  }

  public async down() {
    this.schema.alterTable(this.submissionsTable, (table) => {
      table.dropColumn('shadowed_at')
    })

    this.schema.alterTable(this.postsTable, (table) => {
      table.dropColumn('shadowed_at')
    })
  }
}
