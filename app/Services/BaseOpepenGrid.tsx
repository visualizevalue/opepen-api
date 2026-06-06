import { grid, type Img } from '@visualizevalue/img-grid'
import { GridItem } from 'App/Services/GridItem'

const BLANK_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVR4nGNgYGD4DwABBAEAX+XDSwAAAABJRU5ErkJggg=='

export class BaseOpepenGrid {
  public async make(
    items: GridItem[],
    forceSquare: boolean = true,
    highlighted: string[] = [],
  ) {
    const highlightedItems = items
      .filter((item) => item.type === 'opepen' && highlighted.includes(item.tokenId))
      .sort(
        (a, b) =>
          new Date(b.updatedAt.toString()).getTime() -
          new Date(a.updatedAt.toString()).getTime(),
      )
    const regularItems = items
      .filter((item) => !(item.type === 'opepen' && highlighted.includes(item.tokenId)))
      .sort(
        (a, b) =>
          new Date(b.updatedAt.toString()).getTime() -
          new Date(a.updatedAt.toString()).getTime(),
      )

    const sortedItems = [...highlightedItems, ...regularItems]

    const images: Img[] = sortedItems.map((item) => ({
      id: item.tokenId,
      url: item.image?.staticURI || `https://api.opepen.art/${item.tokenId}/image`,
    }))

    if (forceSquare) {
      const occupiedCells = sortedItems.reduce((cells, item) => {
        return cells + (item.type === 'opepen' && highlighted.includes(item.tokenId) ? 4 : 1)
      }, 0)
      const targetCells = Math.ceil(Math.sqrt(occupiedCells)) ** 2

      for (let i = occupiedCells; i < targetCells; i++) {
        images.push({
          id: `__blank_${i}`,
          url: BLANK_IMAGE,
        })
      }
    }

    return grid(images, {
      highlight: highlighted,
      maxWidth: 1920,
      background: '#000',
    })
  }
}

export default new BaseOpepenGrid()
