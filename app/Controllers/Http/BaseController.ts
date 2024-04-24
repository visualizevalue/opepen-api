import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

export default class BaseController {
  protected async applyIncludes (query, includes) {
    for (const include of includes) {
      const nested = include.split('.')
      query.preload(nested[0], query => {
        if (nested[1]) query.preload(nested[1])
      })
    }
  }

  protected async applyFilters (query, filters) {
    Object.entries(filters).forEach(([key, value]) => {
      const values = Array.isArray(value) ? value : [`${value}`]

      query.where(q => {
        values.forEach((v, i) => {
          const where = i === 0 ? `where` : `orWhere`

          const nullQuery = ['!null', 'null'].includes(v)

          const whereQuery = nullQuery
            ? v.startsWith('!')
              ? `${where}NotNull`
              : `${where}Null`
            : where

          q[whereQuery](`${query.model.table}.${key}`, v)
        })
      })
    })
  }

  protected async applySorts (query, sort, separator = ',') {
    const sorts = sort.split(separator)

    for (const s of sorts) {
      if (!s) return

      const isDesc = s[0] === '-'
      const sortDirection = isDesc ? 'desc' : 'asc'
      const sort = isDesc ? s.slice(1) : s

      if (sort.includes('.')) {
        const [column, ...keys] = sort.split('.')
        query.orderByRaw(`"${column}" -> ${keys.map(key => `'${key}'`).join(' -> ')} ${sortDirection}`)
      } else if (sort === 'random') {
        query.orderByRaw('random()')
      } else if (sort === 'dailyRandom') {
        await this.setRandomSeed()
        query.orderByRaw('random()')
      } else {
        query.orderBy(sort, sortDirection)
      }
    }
  }

  protected async setRandomSeed () {
    const now = DateTime.now()
    const day = now.ordinal
    const days = DateTime.local(now.year, 12, 31).ordinal
    const seed = 2 * day / days - 1

    await Database.rawQuery(`SELECT setseed(${seed})`)
  }
}
