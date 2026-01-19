module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node', // Using node environment for server actions/logic
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/$1',
	},
	transform: {
		'^.+\\.tsx?$': ['ts-jest', {
			tsconfig: 'tsconfig.json',
			isolatedModules: true
		}]
	},
};
