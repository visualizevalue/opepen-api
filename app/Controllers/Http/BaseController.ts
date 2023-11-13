export default class BaseController {
  protected applyIncludes (query, includes) {
    for (const include of includes) {
      const nested = include.split('.')
      query.preload(nested[0], query => {
        if (nested[1]) query.preload(nested[1])
      })
    }
  }

  protected applyFilters (query, filters) {
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

  protected applySorts (query, sort, separator = ',') {
    const sorts = sort.split(separator)
    sorts.forEach(s => {
      if (!s) return

      const isDesc = s[0] === '-'
      const sortDirection = isDesc ? 'desc' : 'asc'
      const sort = isDesc ? s.slice(1) : s

      if (sort.includes('.')) {
        const [column, key] = sort.split('.')
        query.orderByRaw(`"${column}" -> '${key}'`)
      } else if (sort === 'random') {
        query.orderByRaw('random()')
      } else {
        query.orderBy(sort, sortDirection)
      }
    })
  }
}
