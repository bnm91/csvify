export class CsvExporter {

    // tslint:disable-next-line:no-empty
    constructor() { }
  
    /** Flattens data, converts it to CSV, and exports that document
     *
     * @data any[] array of objects of any type (all the same type)
     *
     * @fileName string that will be the name of the file. Do not include file type/file ending (.csv)
     *
     * @customFlattener (optional) function (any) => {} where the return object has
     * keys that are custom column names and values are primitives. If not
     * specified then all objects are flattened down to their constituent
     * primitives by default
     * NOTE: it is recommended to use this. If it is not, then the default
     * flatten method is used
     *
     * @includedColumns (optional) string[] of names of colunns to be included in exported csv.
     * If not specified then all columns are included. Does not need to be used if
     * customFlattener is used
     *
     * @columnNameAliasMap (optional) dictionary mapping default columns name to user specified alias.
     * If not specified then column names will follow default format
     */
    exportToCSVFile(data: any[],
        fileName: string,
        customFlattener?: (datum: any) => {},
        includedColumns?: string[],
        columnNameAliasMap?: {[key:string] : string}) {
      const csv = this.createCSVAsString(data, customFlattener, includedColumns, columnNameAliasMap);
      const csvFileName = fileName + '.csv';
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
      if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, csvFileName);
      } else {
        const link = document.createElement('a');
        if (link.download !== undefined) { // feature detection
          // Browsers that support HTML5 download attribute
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', csvFileName);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    }
  
    /** Flattens data and converts it to CSV string
     *
     * @data any[] array of objects of any type (all the same type)
     *
     * @customFlattener (optional) function (any) => {} where the return object has
     * keys that are custom column names and values are primitives. If not
     * specified then all objects are flattened down to their constituent
     * primitives by default
     * NOTE: it is recommended to use this. If it is not, then the default
     * flatten method is used
     *
     * @includedColumns (optional) string[] of names of colunns to be included in exported csv.
     * If not specified then all columns are included. Does not need to be used if
     * customFlattener is used
     *
     * @columnNameAliasMap (optional) dictionary mapping default columns name to user specified alias.
     * If not specified then column names will follow default format
     */
    createCSVAsString(data: any[],
        customFlattener?: (datum: any) => {},
        includedColumns?: string[],
        columnNameAliasMap?: {[key:string] : string}): string {
      let flattenerFunction: (datum: any, includedColumns?: string[]) => {};
      if (!customFlattener) {
        flattenerFunction = (datum: any, cols?: string[]) => this.flattenChildObject(datum, undefined, cols);
      } else {
        flattenerFunction = (datum: any, cols?: string[]) => customFlattener(datum);
      }
  
      const flatDataWithHeader = this.createFlatDataWithHeader(data, flattenerFunction, includedColumns);
      const header = this.mapColumnNames(flatDataWithHeader.headers, columnNameAliasMap);
  
      const csvEntities = this.createCSVRecordArrayFromData(flatDataWithHeader.items);
  
      csvEntities.unshift(header.join(','));
      const csv = csvEntities.join('\r\n');
      return csv;
    }
  
    /**Returns an object where keys are flattened property names and values are primitives
     * Keys (flattened property names) are created this way
     * property originalobject.propertyObject.childPropertyObject.grandChildPropertyObject
     * becomes key 'propertyObject_childPropertyObject_grandChildPropertyObject'
     *
     * @param object any, the object to be flattened
     *
     * @param includedColumns (optional) string[], list of columns to be included
     * column names follow this format propertyObject_childPropertyObject_grandChildPropertyObject
     */
    flatten(object: any, includedColumns?: string[]) {
      return this.flattenChildObject(object, undefined, includedColumns);
    }
  
    /** Converts an array of json objects into an array of CSV strings
     * Does not flatten complex objects which may appear as json
     */
    createCSVRecordArrayFromData(data: any[]): string[] {
      const replacer = (key: any, value: null) => value === null ? '' : value;
      const header = Object.keys(data[0]);
      const csvEntities = data.map(row => header.map(fieldName => {
        return this.stringifyObjectForCSV(row[fieldName], replacer);
      }).join(','));
  
      return csvEntities;
    }
  
    /** Sanitizes a string for use in a CSV by allowing comma and quote literals */
    sanitizeStringForCSV(entityString: string): string {
      if (entityString) {
        if (entityString[0] === '"' && entityString[entityString.length - 1] === '"') {
          entityString = entityString.substring(1, entityString.length - 1);
        }
        entityString = entityString.replace(/["]/g, '""');
        entityString = '"' + entityString + '"';
      }
      return entityString;
    }
  
    private createFlatDataWithHeader(data: any[], objectFlattener: (datum: any, includedColumns?: string[]) => {}, includedColumns?: string[]) {
      const headers: string[] = [];
      const items: any[] = [];
  
      for (const row of data) {
        const flatObject = objectFlattener(row, includedColumns);
        items.push(flatObject);
        for (const key of Object.keys(flatObject)) {
          if (headers.indexOf(key) < 0) {
            headers.push(key);
          }
        }
      }
  
      return { headers, items };
    }
  
    /** Converts an object to a its string representation suitable for a CSV */
    private stringifyObjectForCSV(object: object, replacer: (this: any, key: string, value: any) => any): string {
      const entity = JSON.stringify(object, replacer);
  
      return this.sanitizeStringForCSV(entity);
    }
  
    /** Method used in recursion to flatten objects
     *
     * @object any, the object to be flattened
     *
     * @objectName string, the name of the top level object being flattened
     *
     * @includedColumns (optional) string[], list of columns/properties to be included in the flattened object.
     * If not specified then all columns are included in the output.
     */
    private flattenChildObject(object: any, objectName?: string, includedColumns?: string[]) {
      let flattenedObject: { [key: string] : any; } = {};
      const keyPrefix = !objectName ? '' : objectName + '_';
  
      for (const prop of Object.keys(object)) {
        const value = object[prop];
        if (value && value._isAMomentObject) {
            flattenedObject[keyPrefix + prop] = object[prop].toString('YYYY-MM-DD');
        }
        if (typeof value === 'object' && value !== null) {
          // if more then one deep, then flatten and add that
          flattenedObject
            = this.concatDictionaries(flattenedObject, this.flattenChildObject(object[prop], keyPrefix + prop, includedColumns));
        } else {
          const columnName = keyPrefix + prop;
          if (columnName && (!includedColumns || includedColumns.lastIndexOf(columnName) >= 0)) {
            if (object[prop] !== null && object[prop] !== undefined) {
              flattenedObject[keyPrefix + prop] = object[prop];
            } else {
              flattenedObject[keyPrefix + prop] = null;
            }
          }
        }
      }
      return flattenedObject;
    }
  
    /** Outputs a string[] of aliased column names given natural column and a mapping of aliases
     *
     * @naturalColumnNames string[], an array of column names
     *
     * @columnNameMap dictionary (optional), mapping of column names to an alias.
     * If not specified, all column names will remain as their default
     */
    private mapColumnNames(naturalColumnNames: string[], columnNameMap?: {[key:string] : string}): string[] {
      if (columnNameMap) {
        const aliasedColumnNames = [];
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < naturalColumnNames.length; i++) {
          if (columnNameMap[naturalColumnNames[i]]) {
            aliasedColumnNames.push(columnNameMap[naturalColumnNames[i]]);
          } else {
            aliasedColumnNames.push(naturalColumnNames[i]);
          }
        }
        return aliasedColumnNames;
      }
      return naturalColumnNames;
    }
  
    /** Concatenates two dictionaries together
     *
     * @first dictionary, first dictionary
     *
     * @second dictionary, second dictionary
     */
    private concatDictionaries(first: { [key: string] : any; }, second: { [key: string] : any; }): {} {
      for (const key of Object.keys(second)) {
        first[key] = second[key];
      }
      return first;
    }
  }
