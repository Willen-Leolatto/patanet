import { User } from '@modules/users/domain/entities/user'

export class ResponseEventAttendeeDto {
  readonly id: string
  readonly name: string
  readonly username: string
  readonly image: string | null

  constructor(user: User) {
    this.id = user.id.toValue()
    this.name = user.name
    this.username = user.username
    this.image = user.image
  }
}
