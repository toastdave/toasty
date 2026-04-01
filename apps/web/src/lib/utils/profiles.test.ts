import { describe, expect, it } from 'bun:test'
import { buildProfilePath, slugifyProfileHandle } from './profiles'

describe('profile helpers', () => {
	it('slugifies display names into handles', () => {
		expect(slugifyProfileHandle('  Rei Ayanami!!!  ')).toBe('rei-ayanami')
	})

	it('falls back when the name is empty', () => {
		expect(slugifyProfileHandle('!!!')).toBe('toasty-fan')
	})

	it('builds public profile paths', () => {
		expect(buildProfilePath('rei-ayanami')).toBe('/u/rei-ayanami')
	})
})
