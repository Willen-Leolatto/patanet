import { IsEnum, IsNotEmpty } from 'class-validator'
import { UserRole } from '../../domain/entities/user'

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole
}
