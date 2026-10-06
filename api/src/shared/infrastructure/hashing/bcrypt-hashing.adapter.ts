import { Injectable } from '@nestjs/common'
import * as bcryptjs from 'bcryptjs'
import { HashingPort } from '../../application/ports/hashing.port'

@Injectable()
export class BcryptHashingAdapter extends HashingPort {
  private static readonly SALT_ROUNDS = 6

  async hash(password: string): Promise<string> {
    return bcryptjs.hash(password, BcryptHashingAdapter.SALT_ROUNDS)
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcryptjs.compare(password, hash)
  }
}
