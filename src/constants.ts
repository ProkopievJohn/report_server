export enum EHistoryActions {
	CREATED = 'CREATED',
	MODIFIED = 'MODIFIED',
	DELETED = 'DELETED',
}

export enum EVerificationsTypes {
	VERIFY_EMAIL = 'VERIFY_EMAIL',
}

export enum EUserRoles {
	OWNER = 0,
	ADMIN = 50,
	USER = 100,
}

export enum EUserStatuses {
	ACTIVE = 0,
	INACTIVE = 50,
	DELETED = 100,
}

export enum ECompanyStatuses {
	ACTIVE = 0,
	INACTIVE = 50,
	DELETED = 100,
}

export enum EAbilityStatuses {
	ACTIVE = 0,
	DELETED = 100,
}

export enum EProjectStatuses {
	ACTIVE = 0,
	DELETED = 100,
}

export enum EActivityStatuses {
	ACTIVE = 0,
	DELETED = 100,
}

export default {
	// Invitations are only valid for 24 hours
	VERIFICATION_LIFETIME: 86400,
}
