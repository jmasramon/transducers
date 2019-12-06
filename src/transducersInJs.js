console.log('**************************');

let acc = [1, 2, 3];
const val = 4;

// Reducer functions: binary fuctions (accomulator, new_value)
let concatReducer = (acc, val) => acc.concat([val]);

console.log(concatReducer(acc, val));

acc = new Set([1, 2, 3]);

setAddReducer = (acc, val) => acc.add(val);

console.log(setAddReducer(acc, val));

// Reduce on top of reducer functions
const reduce = (iterable, reducer, seed) => {
  let accumulation = seed;

  for (value of iterable) {
    accumulation = reducer(accumulation, value);
  }

  return accumulation;
};
console.log(reduce([1, 2, 3], concatReducer, []));

// Ramda style
const reduceWith = (reducer, seed, iterable) => {
  let accumulation = seed;

  for (const value of iterable) {
    accumulation = reducer(accumulation, value);
  }

  return accumulation;
};
console.log(reduceWith(concatReducer, [], [1, 2, 3]));

// better concatenator
const arrayOfReducer = (acc, val) => {
  acc.push(val);
  return acc;
};
console.log(reduceWith(arrayOfReducer, [], [1, 2, 3]));

// 1st catamorphism
const sumOfReducer = (acc, val) => acc + val;
console.log(reduceWith(sumOfReducer, 0, [1, 2, 3]));

const joinedWith = separator => (acc, val) => (acc == '' ? val : `${acc}${separator}${val}`);
console.log(reduceWith(joinedWith(', '), '', [1, 2, 3]));
console.log(reduceWith(joinedWith('.'), '', [1, 2, 3]));

// Decorators = functions that enhance functions
const incrementSecondArgument = binaryFn => (x, y) => binaryFn(x, y + 1);

const power = (base, exponent) => base ** exponent;

const higherPower = incrementSecondArgument(power);
const evenHigherPower = incrementSecondArgument(incrementSecondArgument(power));
console.log(power(2, 3));
console.log(higherPower(2, 3));
console.log(evenHigherPower(2, 3));

// Decorating reducers
console.log(reduceWith(incrementSecondArgument(arrayOfReducer), [], [1, 2, 3]));

// mappers = isomorphisms
// map here is as reducer_function isomorphic decorator
const incrementValue = incrementSecondArgument;
const map = fn => reducer => (acc, val) => reducer(acc, fn(val));

const mapIncrementValue = map(x => x + 1);
console.log(reduceWith(mapIncrementValue(arrayOfReducer), [], [1, 2, 3]));
console.log(reduceWith(map(x => x + 1)(arrayOfReducer), [], [1, 2, 3]));
console.log(reduceWith(map(x => x + 1)(joinedWith('.')), '', [1, 2, 3]));
console.log(reduceWith(map(x => x + 1)(sumOfReducer), 0, [1, 2, 3]));

const squaresDecorator = map(x => power(x, 2));
const one2tenIterable = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

console.log(reduceWith(squaresDecorator(sumOfReducer), 0, one2tenIterable));

const bigUnsReducer = (acc, val) => {
  if (val > 5) {
    acc.push(val);
  }
  return acc;
};

console.log(reduceWith(map(x => power(x, 2))(bigUnsReducer), [], one2tenIterable));

// filters
const bigUnsOfDecorator = reducer => (acc, val) => (val > 5 ? reducer(acc, val) : acc);

console.log(reduceWith(bigUnsOfDecorator(squaresDecorator(arrayOfReducer)), [], one2tenIterable));

const filter = fn => reducer => (acc, val) => (fn(val) ? reducer(acc, val) : acc);

console.log(reduceWith(filter(x => x > 5)(map(x => power(x, 2))(arrayOfReducer)), [], one2tenIterable));

// Transformers: superset of decorators (mappers and filters)
// they should compose by return another transformer (that also transforms reducers)

// (binary) composition reducer function
const compositionOf = (acc, val) => (...args) => val(acc(...args));
console.log(
  reduceWith(
    compositionOf(
      filter(x => x > 5),
      map(x => power(x, 2)),
    )(arrayOfReducer),
    [],
    one2tenIterable,
  ),
);

// composition as reduction with composition reducer function
const funcId = x => x;
const compose = (...fns) => reduceWith(compositionOf, funcId, fns);
console.log(
  reduceWith(
    compose(
      filter(x => x > 5),
      map(x => power(x, 2)),
    )(arrayOfReducer),
    [],
    one2tenIterable,
  ),
);

// reduceWith components: tranformer (for the reducer),
// reducer, seed, iterable
// Transducers make this explícit
const transduce = (transformer, reducer, seed, iterable) => {
  const transformedReducer = transformer(reducer);
  let accumulation = seed;

  for (const value of iterable) {
    accumulation = transformedReducer(accumulation, value);
  }

  return accumulation;
};

const squaresOfTheOddNumbersTransformer = compose(
  filter(x => x % 2 === 1),
  squaresDecorator,
);
console.log(transduce(squaresOfTheOddNumbersTransformer, sumOfReducer, 0, one2tenIterable));

// So transducing is just folding plus a transformation (a
// chain of transformers that get reducers and return reducers)
// Transducers: composable transformers applied to reducers
// to fold iterables

// They are more efficient because they apply the "typical"
// oparators (maps, filters) through the reducer function
// and this allows to compose the transformation at value level
// only traversing the foldable once.

// Exercise: tracking user transitions
const logContents = `1a2ddc2, 5f2b932
                    f1a543f, 5890595
                    3abe124, bd11537
                    f1a543f, 5f2b932
                    f1a543f, bd11537
                    f1a543f, 5890595
                    1a2ddc2, bd11537
                    1a2ddc2, 5890595
                    3abe124, 5f2b932
                    f1a543f, 5f2b932
                    f1a543f, bd11537
                    f1a543f, 5890595
                    1a2ddc2, 5f2b932
                    1a2ddc2, bd11537
                    1a2ddc2, 5890595`;

console.log('**************************');
