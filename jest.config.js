module.exports = {
	roots: ['<rootDir>/src'],
	testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|js|tsx)?$',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	transform: {
		'^.+\\.(ts|tsx)?$': 'ts-jest'
	},
	moduleNameMapper: {
		'^next-prepare(.*)$': '<rootDir>/src$1'
	},
	setupTestFrameworkScriptFile: '<rootDir>setupTests.js',
	snapshotSerializers: ['enzyme-to-json/serializer']
};
