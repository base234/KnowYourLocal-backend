export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface ListResponse<T> {
  data: T[]
  count: number
}

export interface SingleResponse<T> {
  data: T
}

export default abstract class BaseTransformer<T, R> {
  /**
   * Transform a single item
   */
  abstract transform(item: T): R

  /**
   * Transform multiple items
   */
  transformMany(items: T[]): R[] {
    return items.map(item => this.transform(item))
  }

  /**
   * Transform paginated data
   */
  transformPaginated(
    paginatedData: any, 
    options: { disablePagination?: boolean } = {}
  ): PaginatedResponse<R> | R[] {
    if (options.disablePagination) {
      // Return just the transformed data array without pagination metadata
      return this.transformMany(paginatedData.rows || [])
    }

    return {
      data: this.transformMany(paginatedData.rows || []),
      meta: {
        current_page: paginatedData.currentPage,
        last_page: paginatedData.lastPage,
        per_page: paginatedData.perPage,
        total: paginatedData.total,
        from: paginatedData.firstPage,
        to: paginatedData.lastPage,
      },
    }
  }

  /**
   * Transform a list response (simple array with count)
   */
  transformList(items: T[]): ListResponse<R> {
    return {
      data: this.transformMany(items),
      count: items.length,
    }
  }

  /**
   * Transform a single item response
   */
  transformSingle(item: T): SingleResponse<R> {
    return {
      data: this.transform(item),
    }
  }

  /**
   * Transform with custom options
   */
  transformWithOptions(
    data: T | T[] | any, 
    options: {
      type?: 'single' | 'list' | 'paginated'
      disablePagination?: boolean
    } = {}
  ): R | R[] | PaginatedResponse<R> | ListResponse<R> | SingleResponse<R> {
    const { type, disablePagination } = options

    if (type === 'single') {
      return this.transformSingle(data as T)
    }

    if (type === 'list') {
      return this.transformList(data as T[])
    }

    if (type === 'paginated') {
      return this.transformPaginated(data, { disablePagination })
    }

    // Auto-detect based on data type
    if (Array.isArray(data)) {
      return this.transformList(data)
    }

    if (data && typeof data === 'object' && 'rows' in data) {
      // It's a paginated result
      return this.transformPaginated(data, { disablePagination })
    }

    // Single item
    return this.transformSingle(data as T)
  }
}
