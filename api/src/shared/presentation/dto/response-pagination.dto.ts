type Paginatio = {
  page: number
  perPage: number
  pages: number
  total: number
}

export class ResponsePaginationDto<T> {
  readonly data: T[]
  readonly paginatio: Paginatio

  constructor(data: T[], paginatio: Paginatio) {
    this.data = data
    this.paginatio = paginatio
  }
}
