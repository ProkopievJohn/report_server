const {
	NODE_ENV,
	HOST,
	PORT,

	// MONGO
	MONGO_HOST,
	MONGO_PORT,
	MONGO_NAME,

	// JWT
	JWT_SECRET,
	JWT_ACCESS_TOKEN_EXPIRES_IN,

	// URL
	ROOT_URL,

	// MAIL
	MAIL_TRANSPORT_AUTH_USER,
	MAIL_TRANSPORT_AUTH_PASS,
	MAIL_TRANSPORT_FROM,
} = process.env

const dbName = NODE_ENV === 'test' ? `${MONGO_NAME || 'report'}-test` : MONGO_NAME || 'report'
const dbUri = `mongodb://${MONGO_HOST || 'localhost'}:${MONGO_PORT || 27017}`

export default {
	rootUrl: ROOT_URL || 'http://localhost:3010',
	db: {
		name: dbName,
		options: {},
		uri: dbUri,
	},
	jwt: {
		secret: JWT_SECRET || 'jwt-secret',
		options: {
			expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN || '8 hours',
		},
	},
	mail: {
		transport: {
			service: 'gmail',
			auth: {
				user: MAIL_TRANSPORT_AUTH_USER,
				pass: MAIL_TRANSPORT_AUTH_PASS,
			},
		},
		defaultOptions: {
			from: MAIL_TRANSPORT_FROM,
		},
	},
	debug: NODE_ENV === 'development',
	env: NODE_ENV || 'development',
	host: HOST || 'localhost',
	port: parseInt(PORT, 10) || 3010,
}
