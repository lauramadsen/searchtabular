import { isArray, some } from 'lodash';

const cleanNumberQuery = queryTerm => {
  queryTerm = queryTerm.replace('>', '');
  queryTerm = queryTerm.replace('=', '');
  queryTerm = queryTerm.replace('<', '');
  queryTerm = queryTerm.trim();

  return Number(queryTerm);
};

const infix = queryTerm => ({
  evaluate(searchText = '') {
    if (!searchText) {
      return false;
    }

    if (queryTerm.indexOf(' and ') !== -1) {
      const query_array = queryTerm.split(' and ');

      return query_array.every(query => this.basicEvaluate(query, searchText));
    }

    if (queryTerm.indexOf(' or ') !== -1) {
      const query_array = queryTerm.split(' or ');

      return some(query_array, query => this.basicEvaluate(query, searchText));
    }

    if (isArray(searchText)) {
      return searchText.some(v => this.evaluate(v));
    }

    return this.basicEvaluate(queryTerm, searchText);
  },
  basicEvaluate(queryTerm, searchText = '') {
    if (queryTerm.match(/^(\>|\<)/g)) {
      // TODO - date ranges
      if (isNaN(searchText)) {
        return searchText.indexOf(queryTerm) !== -1;
      }

      return this.specialEvaluate(queryTerm, searchText);
    }

    return searchText.indexOf(queryTerm) !== -1;
  },
  specialEvaluate(queryTerm, searchText = '') {
    const queryNumber = cleanNumberQuery(queryTerm);
    if (queryTerm.match(/^\>\=/g)) {
      return searchText >= queryNumber;
    }
    if (queryTerm.match(/^\<\=/g)) {
      return searchText <= queryNumber;
    }
    if (queryTerm.match(/^\>/g) && !queryTerm.match(/^\>\=/g)) {
      return searchText > queryNumber;
    }
    if (queryTerm.match(/^\</g) && !queryTerm.match(/^\<\=/g)) {
      return searchText < queryNumber;
    }
    return searchText.indexOf(queryTerm) !== -1;
  },
  matches(searchText = '') {
    if (!searchText) {
      return [];
    }

    if (isArray(searchText)) {
      return searchText.reduce((result, text, index) => {
        const search = this.matches(text);

        if (search.length) {
          result[index] = search; // eslint-disable-line no-param-reassign
        }

        return result;
      }, new Array(searchText.length));
    }

    const splitString = searchText.split(queryTerm);
    const result = [];
    let currentPosition = 0;

    for (let x = 0; x < splitString.length; x += 1) {
      result.push({
        startIndex: currentPosition + splitString[x].length,
        length: queryTerm.length,
      });

      currentPosition += splitString[x].length + queryTerm.length;
    }

    result.pop();

    return result;
  },
});

const prefix = queryTerm => ({
  evaluate(searchText = '') {
    if (!searchText) {
      return false;
    }

    if (isArray(searchText)) {
      return searchText.some(v => this.evaluate(v));
    }

    return searchText.indexOf(queryTerm) === 0;
  },
  matches(searchText = '') {
    if (!searchText) {
      return [];
    }

    if (isArray(searchText)) {
      return searchText.reduce((result, text, index) => {
        const search = this.matches(text);

        if (search.length) {
          result[index] = search; // eslint-disable-line no-param-reassign
        }

        return result;
      }, new Array(searchText.length));
    }

    const prefixIndex = searchText.indexOf(queryTerm);

    if (prefixIndex === 0) {
      return [
        {
          startIndex: 0,
          length: queryTerm.length,
        },
      ];
    }

    return [];
  },
});

export default {
  infix,
  prefix,
};
