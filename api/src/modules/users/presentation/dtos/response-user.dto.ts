import { User } from '../../domain/entities/user'

export class ResponseUserDto {
  readonly id: string
  readonly name: string
  readonly displayName: string | null
  readonly about: string | null
  readonly image: string | null
  readonly imageCover: string | null
  readonly username: string
  readonly email: string
  readonly hasPassword: boolean
  readonly googleLinked: boolean
  readonly animalsCount: number
  readonly role: string
  readonly isActive: boolean
  readonly createdAt: Date
  readonly updatedAt: Date

  constructor(user: User) {
    this.id = user.id.toValue()
    this.name = user.name
    this.displayName = user.displayName
    this.about = user.about
    this.image = user.image
    this.imageCover = user.imageCover
    this.username = user.username
    this.email = user.email
    this.hasPassword = Boolean(user.password)
    this.googleLinked = Boolean(user.googleId)
    this.animalsCount = user.animalsCount ?? 0
    this.role = user.role
    this.isActive = user.isActive
    this.createdAt = user.createdAt
    this.updatedAt = user.updatedAt
  }
}
