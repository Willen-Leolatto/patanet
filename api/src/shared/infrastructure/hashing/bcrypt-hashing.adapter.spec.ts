import { BcryptHashingAdapter } from './bcrypt-hashing.adapter'

describe('BcryptHashingAdapter', () => {
  let adapter: BcryptHashingAdapter

  beforeEach(() => {
    adapter = new BcryptHashingAdapter()
  })

  describe('hash', () => {
    it('should hash a password and return a string', async () => {
      const password = 'password123'
      const hashed = await adapter.hash(password)

      expect(typeof hashed).toBe('string')
      expect(hashed).not.toEqual(password)
    })

    it('should produce different hashes for the same password', async () => {
      const password = 'password123'
      const hash1 = await adapter.hash(password)
      const hash2 = await adapter.hash(password)

      expect(hash1).not.toEqual(hash2)
    })
  })

  describe('compare', () => {
    it('should return true when password matches hash', async () => {
      const password = 'password123'
      const hashed = await adapter.hash(password)

      const result = await adapter.compare(password, hashed)

      expect(result).toBe(true)
    })

    it('should return false when password does not match hash', async () => {
      const password = 'password123'
      const hashed = await adapter.hash(password)

      const result = await adapter.compare('wrongpassword', hashed)

      expect(result).toBe(false)
    })
  })
})
