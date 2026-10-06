import { Entity } from '@shared/domain/entity'
import { UniqueEntityID } from '@shared/domain/unique-entity-id'

export enum UserRole {
  USER = 'USER',
  INSTITUTION = 'INSTITUTION',
  VETERINARIAN = 'VETERINARIAN',
  ADMIN = 'ADMIN',
}

export interface UserProps {
  name: string
  displayName: string | null
  about: string | null
  image: string | null
  imageCover: string | null
  username: string
  email: string
  password: string | null
  googleId: string | null
  role: UserRole
  isActive: boolean
  deletedAt: Date | null
  termsAcceptedAt: Date | null
  termsVersion: string | null
  animalsCount?: number
  createdAt: Date
  updatedAt: Date
}

export class User extends Entity<UserProps> {
  get name() {
    return this.props.name
  }
  get displayName() {
    return this.props.displayName
  }
  get about() {
    return this.props.about
  }
  get image() {
    return this.props.image
  }
  get imageCover() {
    return this.props.imageCover
  }
  get username() {
    return this.props.username
  }
  get email() {
    return this.props.email
  }
  get password() {
    return this.props.password
  }
  get googleId() {
    return this.props.googleId
  }
  get role() {
    return this.props.role
  }
  get isActive() {
    return this.props.isActive
  }
  get deletedAt() {
    return this.props.deletedAt
  }
  get termsAcceptedAt() {
    return this.props.termsAcceptedAt
  }
  get termsVersion() {
    return this.props.termsVersion
  }
  get animalsCount() {
    return this.props.animalsCount
  }
  get createdAt() {
    return this.props.createdAt
  }
  get updatedAt() {
    return this.props.updatedAt
  }

  get isInstitution() {
    return this.props.role === UserRole.INSTITUTION
  }

  static create(
    props: Omit<
      UserProps,
      | 'createdAt'
      | 'updatedAt'
      | 'role'
      | 'isActive'
      | 'deletedAt'
      | 'termsAcceptedAt'
      | 'termsVersion'
    > &
      Partial<
        Pick<
          UserProps,
          | 'role'
          | 'isActive'
          | 'deletedAt'
          | 'termsAcceptedAt'
          | 'termsVersion'
        >
      >,
    id?: UniqueEntityID,
  ): User {
    return new User(
      {
        ...props,
        role: props.role ?? UserRole.USER,
        isActive: props.isActive ?? true,
        deletedAt: props.deletedAt ?? null,
        termsAcceptedAt: props.termsAcceptedAt ?? null,
        termsVersion: props.termsVersion ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      id,
    )
  }

  static reconstitute(props: UserProps, id: UniqueEntityID): User {
    return new User(props, id)
  }

  changePassword(newHashedPassword: string): void {
    this.props.password = newHashedPassword
    this.props.updatedAt = new Date()
  }

  linkGoogle(googleId: string): void {
    this.props.googleId = googleId
    this.props.updatedAt = new Date()
  }

  unlinkGoogle(): void {
    this.props.googleId = null
    this.props.updatedAt = new Date()
  }

  updateProfile(
    data: Partial<
      Pick<
        UserProps,
        | 'name'
        | 'displayName'
        | 'about'
        | 'image'
        | 'imageCover'
        | 'username'
        | 'email'
      >
    >,
  ): void {
    Object.assign(this.props, data)
    this.props.updatedAt = new Date()
  }

  changeRole(role: UserRole): void {
    this.props.role = role
    this.props.updatedAt = new Date()
  }

  /**
   * LGPD/Marco Civil: registra o aceite da versao vigente dos termos.
   * TermsAcceptedGuard bloqueia rotas privadas com 403 enquanto
   * termsVersion nao bater com CURRENT_TERMS_VERSION.
   */
  acceptTerms(version: string): void {
    this.props.termsAcceptedAt = new Date()
    this.props.termsVersion = version
    this.props.updatedAt = new Date()
  }
}
