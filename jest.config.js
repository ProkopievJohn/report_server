// eslint-disable-next-line no-undef
module.exports = {
	roots: ['<rootDir>/src', '<rootDir>/test'],
	transform: {
    '^.+\\.ts?$': 'ts-jest',
	},
	moduleFileExtensions: ['ts', 'js', 'json', 'node'],
	coveragePathIgnorePatterns: ['/node_modules/'],
	moduleNameMapper: {
		"^src/(.*)$": "<rootDir>/src/$1",
		"^test/(.*)$": "<rootDir>/test/$1",
		"config": "<rootDir>/config"
	},
	setupFilesAfterEnv: [
    "<rootDir>/test/jest.global.setup.ts",
  ],
	globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
}
