import { UniqueEntityID } from '@shared/domain/unique-entity-id'
import { User, UserRole } from '../../../../domain/entities/user'
import { User as PrismaUser } from '@prisma/client'

export class UserMapper {
  static toDomain(row: PrismaUser, animalsCount?: number): User {
    return User.reconstitute(
      {
        name: row.name,
        displayName: row.displayName,
        about: row.about,
        image: row.image,
        imageCover: row.imageCover,
        username: row.username,
        email: row.email,
        password: row.password,
        googleId: row.googleId,
        role: row.role as unknown as UserRole,
        isActive: row.isActive,
        deletedAt: row.deletedAt,
        termsAcceptedAt: row.termsAcceptedAt,
        termsVersion: row.termsVersion,
        animalsCount,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      new UniqueEntityID(row.id),
    )
  }

  static toPersistence(domain: User) {
    return {
      id: domain.id.toValue(),
      name: domain.name,
      displayName: domain.displayName,
      about: domain.about,
      image: domain.image,
      imageCover: domain.imageCover,
      username: domain.username,
      email: domain.email,
      password: domain.password,
      googleId: domain.googleId,
      role: domain.role as unknown as PrismaUser['role'],
      isActive: domain.isActive,
      deletedAt: domain.deletedAt,
      termsAcceptedAt: domain.termsAcceptedAt,
      termsVersion: domain.termsVersion,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    }
  }
}
