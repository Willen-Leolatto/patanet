import { WatchedList } from '@shared/domain/watched-list'

export class OwnerIdList extends WatchedList<string> {
  compareItems(a: string, b: string): boolean {
    return a === b
  }
}
