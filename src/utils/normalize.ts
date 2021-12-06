export const normalizeEmailAddress =
	(emailAddress: string): string => emailAddress ? emailAddress.trim().toLowerCase() : ''

export const normalizeName = (name: string): string => name ? name.trim() : ''
