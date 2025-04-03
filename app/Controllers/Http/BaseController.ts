import { DateTime } from 'luxon'
import Database from '@ioc:Adonis/Lucid/Database'

export default class BaseController {
  protected async applyIncludes(query, includes) {
    for (const include of includes) {
      const nested = include.split('.')
      query.preload(nested[0], (query) => {
        if (nested[1]) query.preload(nested[1])
      })
    }
  }

  protected async applyFilters(query, filters) {
    Object.entries(filters).forEach(([key, value]) => {
      const values = Array.isArray(value) ? value : [`${value}`]
      const columns = key.split('.')

      query.where((q) => {
        values.forEach((v, i) => {
          const where = i === 0 ? `where` : `orWhere`

          const nullQuery = ['!null', 'null'].includes(v)
          const isNested = columns.length > 1

          const whereQuery = nullQuery
            ? v.startsWith('!')
              ? `${where}NotNull`
              : `${where}Null`
            : isNested
              ? `whereJsonSuperset`
              : where

          const isNumeric = !isNaN(v)
          const parsedValue = isNumeric ? parseInt(v) : v
          const filterValue = isNested ? { [columns[1]]: parsedValue } : v

          q[whereQuery](`${query.model.table}.${columns[0]}`, filterValue)
        })
      })
    })
  }

  protected async applySorts(query, sort, separator = ',') {
    const sorts = sort.split(separator)

    for (const s of sorts) {
      if (!s) return

      const isDesc = s[0] === '-'
      const sortDirection = isDesc ? 'desc' : 'asc'
      const sort = isDesc ? s.slice(1) : s

      if (sort.includes('.')) {
        const [column, ...keys] = sort.split('.')
        query.orderByRaw(
          `"${column}" -> ${keys.map((key) => `'${key}'`).join(' -> ')} ${sortDirection} NULLS LAST`,
        )
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

  protected async applySearch(query, search, column: string = 'search') {
    if (!search.trim()) return

    // Function to escape special characters in search terms for 'ilike'
    // Escapes '!', '%', and '_' by prefixing with '!' (our chosen escape character)
    const escapeLike = (term: string) => term.replace(/[!%_]/g, '!$&')

    // Parse the search string:
    // - Split by '||' for OR conditions
    // - For each OR group, split by '&&' for AND conditions
    // - Trim whitespace from each term and filter out empty terms
    // - Filter out empty AND groups
    const orAndQueries = search
      .split('||')
      .map((orGroup: string) =>
        orGroup
          .split('&&')
          .map((term) => term.trim())
          .filter((term) => term.length > 0),
      )
      .filter((andGroup: string) => andGroup.length > 0)

    query.where((q) => {
      // Iterate over OR groups
      for (const searchOr of orAndQueries) {
        q.orWhere((iq) => {
          // Add where conditions for each AND term in this OR group
          for (const searchAnd of searchOr) {
            const escapedTerm = escapeLike(searchAnd)
            // Use whereRaw to specify the ESCAPE clause for proper escaping
            iq.whereRaw(`${column} ilike '%' || ? || '%' ESCAPE '!'`, [escapedTerm])
          }
        })
      }
    })
  }

  protected async setRandomSeed() {
    const now = DateTime.now()
    const day = now.ordinal
    const days = DateTime.local(now.year, 12, 31).ordinal
    const seed = (2 * day) / days - 1

    await Database.rawQuery(`SELECT setseed(${seed})`)
  }
}
