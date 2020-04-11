import { csvify } from '../index';

test('should flatten complex object with default columns', () => {
    const complexObject = {
        primitivePropertyOne: 1,
        complexProperty:  {
            childPrimitiveProperty: 2,
            childPrimitiveProperty2: 'childPrimitiveString',
            childComplexProperty: {
                grandchildPrimitiveProperty: 3
            }
        }
    };

    const flattenedObject = csvify.flatten(complexObject);

    const expectedFlattenedObject = {
        primitivePropertyOne: 1,
        complexProperty_childPrimitiveProperty: 2,
        complexProperty_childPrimitiveProperty2: 'childPrimitiveString',
        complexProperty_childComplexProperty_grandchildPrimitiveProperty: 3
    };
    expect(flattenedObject).toEqual(expectedFlattenedObject);
  });

  test('should flatten complex object with only specified columns', () => {
    const complexObject = {
        primitivePropertyOne: 1,
        complexProperty:  {
            childPrimitiveProperty: 2,
            childPrimitiveProperty2: 'childPrimitiveString',
            childComplexProperty: {
                grandchildPrimitiveProperty: 3
            }
        }
    };

    const includedColumns = [
        'primitivePropertyOne',
        'complexProperty_childComplexProperty_grandchildPrimitiveProperty'
    ];

    const flattenedObject = csvify.flatten(complexObject, includedColumns);

    const expectedFlattenedObject = {
        primitivePropertyOne: 1,
        complexProperty_childComplexProperty_grandchildPrimitiveProperty: 3
    };
    expect(flattenedObject).toEqual(expectedFlattenedObject);
  });

  test('should return empty object if included columns is empty', () => {
    const complexObject = {
        primitivePropertyOne: 1,
        complexProperty:  {
            childPrimitiveProperty: 2,
            childPrimitiveProperty2: 'childPrimitiveString',
            childComplexProperty: {
                grandchildPrimitiveProperty: 3
            }
        }
    };

    const includedColumns: string[] = [];
    const flattenedObject = csvify.flatten(complexObject, includedColumns);

    const expectedFlattenedObject = {};
    expect(flattenedObject).toEqual(expectedFlattenedObject);
  });

  test('should sanitize strings for use in csv', () => {
    const problematicCsvString = '""This" is a test of our "ability" to escape things such as commas, quotes, and other problems"';
    const escapedString = csvify.sanitizeStringForCSV(problematicCsvString);
    expect(escapedString).toEqual('"""This"" is a test of our ""ability"" to escape things such as commas, quotes, and other problems"');
  });

  test('should create csv records from an array of data', () => {
    const simpleObject = {'childThis': 'this', 'childThat': 'that', 'aNumberThisTime': 3};
    const simplerObjectTwo = {'childThis' : 'thistwo', 'childThat': 'thattoo', 'aNumberThisTime': 0};
    const dataArray = [simpleObject, simplerObjectTwo];
    const csvString = csvify.createCSVRecordArrayFromData(dataArray);

    const expectedResult = ['"this","that","3"', '"thistwo","thattoo","0"'];
    expect(csvString).toEqual(expectedResult);
  });

  test('should create a csv string from an array of data', () => {
    const simpleObject = {'childThis': 'this', 'childThat': 'that', 'aNumberThisTime': 3};
    const simplerObjectTwo = {'childThis' : 'thistwo', 'childThat': 'thattoo', 'aNumberThisTime': 0};
    const dataArray = [simpleObject, simplerObjectTwo];
    const csvString = csvify.createCSVAsString(dataArray);

    const expectedResult = 'childThis,childThat,aNumberThisTime\r\n"this","that","3"\r\n"thistwo","thattoo","0"';
    expect(csvString).toEqual(expectedResult);
  });

  test('should create a csv string from an array of data including all columns even if only some records have data for that column', () => {
    const simpleObject = {'childThis': 'this', 'childThat': null, 'aNumberThisTime': 0};
    const simplerObjectTwo = {'childThis' : 'thistwo', 'childThat': 'thattoo', 'aNumberThisTime': 1};
    const dataArray = [simpleObject, simplerObjectTwo];
    const csvString = csvify.createCSVAsString(dataArray);

    const expectedResult = 'childThis,childThat,aNumberThisTime\r\n"this","","0"\r\n"thistwo","thattoo","1"';
    expect(csvString).toEqual(expectedResult);
  });

  test('should create a csv string from an array of data with only column names that are specified', () => {
    const simpleObject = {'childThis': 'this', 'childThat': 'that', 'aNumberThisTime': 0};
    const simplerObjectTwo = {'childThis' : 'thistwo', 'childThat': 'thattoo', 'aNumberThisTime': 1};
    const dataArray = [simpleObject, simplerObjectTwo];
    const included = ['childThis'];
    const csvString = csvify.createCSVAsString(dataArray, undefined, included);

    const expectedResult = 'childThis\r\n"this"\r\n"thistwo"';
    expect(csvString).toEqual(expectedResult);
  });

  test('should create a csv string from an array of data with only column names that are specified -- complex column name', () => {
    const complexObject1 = {
        name: 'complexObject1CustomComplexColumnNameTest',
        primitivePropertyOne: 1,
        complexProperty:  {
            childPrimitiveProperty: 2,
            childPrimitiveProperty2: 'childPrimitiveString',
            childComplexProperty: {
                grandchildPrimitiveProperty: 1
            }
        }
    };

    const complexObject2 = {
        name: 'complexObject2',
        primitivePropertyOne: 1,
        complexProperty:  {
            childPrimitiveProperty: 2,
            childPrimitiveProperty2: 'childPrimitiveString2',
            childComplexProperty: {
                grandchildPrimitiveProperty: 2
            }
        }
    };

    const included = ['name', 'complexProperty_childComplexProperty_grandchildPrimitiveProperty'];
    const dataArray = [complexObject1, complexObject2];

    const csvString = csvify.createCSVAsString(dataArray, undefined, included);

    const expectedResult
        = 'name,complexProperty_childComplexProperty_grandchildPrimitiveProperty\r\n' +
            '"complexObject1CustomComplexColumnNameTest","1"\r\n"complexObject2","2"';
    expect(csvString).toEqual(expectedResult);
  });

  test('should create a csv string from an array using a custom flattener', () => {
    const complexObject1 = {
        name: 'complexObject1CustomFlattenerTest',
        primitivePropertyOne: 1,
        complexProperty:  {
            childPrimitiveProperty: 2,
            childPrimitiveProperty2: 'childPrimitiveString',
            childComplexProperty: {
                grandchildPrimitiveProperty: 1
            }
        }
    };

    const complexObject2 = {
        name: 'complexObject2',
        primitivePropertyOne: 1,
        complexProperty:  {
            childPrimitiveProperty: 2,
            childPrimitiveProperty2: 'childPrimitiveString2',
            childComplexProperty: {
                grandchildPrimitiveProperty: 2
            }
        }
    };

    const dataArray = [complexObject1, complexObject2];

    const customComplexObjectFlattenerFn = (complexObject: any) => {
        const customFlattenedObject: any = {};
        // tslint:disable-next-line:no-string-literal
        customFlattenedObject['name'] = complexObject['name'];
        // tslint:disable-next-line:no-string-literal
        customFlattenedObject['grandchildPrimitive']
            // tslint:disable-next-line:no-string-literal
            = complexObject['complexProperty']['childComplexProperty']['grandchildPrimitiveProperty'];
        return customFlattenedObject;
    };

    const csvString = csvify.createCSVAsString(dataArray, customComplexObjectFlattenerFn, undefined);

    const expectedResult = 'name,grandchildPrimitive\r\n"complexObject1CustomFlattenerTest","1"\r\n"complexObject2","2"';
    expect(csvString).toEqual(expectedResult);
  });

  test('should create a csv string from an array of data using custom column name mapping', () => {
    const simpleObject = {'childThis': 'this', 'childThat': 'that', 'aNumberThisTime': 3};
    const simplerObjectTwo = {'childThis' : 'thistwo', 'childThat': 'thattoo', 'aNumberThisTime': 0};
    const dataArray = [simpleObject, simplerObjectTwo];
    const columnNameMap = {
        'childThis': 'This',
        'childThat': 'That',
        'aNumberThisTime': 'The Number'
    };


    const csvString = csvify.createCSVAsString(dataArray, undefined, undefined, columnNameMap);

    const expectedResult = 'This,That,The Number\r\n"this","that","3"\r\n"thistwo","thattoo","0"';
    expect(csvString).toEqual(expectedResult);
  });

  test('should create a csv string from an array of data using custom column name mapping for only 1 column', () => {
    const simpleObject = {'childThis': 'this', 'childThat': 'that', 'aNumberThisTime': 3};
    const simplerObjectTwo = {'childThis' : 'thistwo', 'childThat': 'thattoo', 'aNumberThisTime': 0};
    const dataArray = [simpleObject, simplerObjectTwo];
    const columnNameMap = {
        'childThis': 'This'
    };


    const csvString = csvify.createCSVAsString(dataArray, undefined, undefined, columnNameMap);

    const expectedResult = 'This,childThat,aNumberThisTime\r\n"this","that","3"\r\n"thistwo","thattoo","0"';
    expect(csvString).toEqual(expectedResult);
  });