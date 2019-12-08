console.log(' -> Transducers project working');

// Compared to raganwald's explanation, the transformers here
// are more sofisticated and so more flexible|powerful

// REDUCER FUNCTION: takes an accomulator
// and a value and folds the value into the accomulator
// We use reducing functions to describe "the essence
//of the transformation"
function sumReducer(acc: number, item: number): number {
  return acc + item;
}

function multReducer(acc: number, item: number): number {
  return acc * item;
}

const input = [2, 3, 4];
console.log(`input to all reductions = ${input}`);

// TODO: not well defined interface -> compiler complains about specific accs of either type
// so TS is getting on the way of a perfectly correct polymorphic js
interface CatamorphicReducingFunction {
  (acc: number, val: number): number;
}

interface IsomorphicReducingFunction {
  (acc: number[], val: number): number[];
}

type ReducingFunction = CatamorphicReducingFunction | IsomorphicReducingFunction;

interface Transformer {
  init: () => number | number[];
  step: ReducingFunction;
  result: (result: number | number[]) => number | number[];
}

// wraps reducing function into transformer object
const wrap = function(reducingFunction: ReducingFunction): Transformer {
  return {
    init: function() {
      throw new Error('init not supported');
    },

    step: reducingFunction,

    result: function(result: number | number[]) {
      return result;
    },
  };
};

// functional reduce based on transformers instead of reducing functions
function reduce(xf: Transformer | ReducingFunction, init: number | number[], input: number[]): number | number[] {
  if (typeof xf === 'function') {
    xf = wrap(xf);
  }

  const result = input.reduce(xf.step, init);

  return xf.result(result);
}

console.log('Functional reductions');

const output = reduce(sumReducer, 1, input);
console.log(` reducing over sum and 1 = ${output}`);

const output2 = reduce(wrap(multReducer), 1, input);
console.log(` reducing over mult (wrapped by transformer) and 1 = ${output2}`);

const appendReducer: ReducingFunction = function(acc: number[], item: number): number[] {
  acc.push(item);
  return acc;
};

const output3 = reduce(appendReducer, [], input);
console.log(` reducing with append and []  = ${output3}`);

function plus1(item: number) {
  return item + 1;
}

// transformer that adds one to the values reduced over
const xfplus1: Transformer = {
  init: function() {
    throw new Error('init not needed');
  },
  step: function(result: number[], item: number): number[] {
    return appendReducer(result, plus1(item));
  },
  result: function(result) {
    return result;
  },
};

console.log('Using plus1 transformer and manually stepping through the reduction');

let result = xfplus1.step([], 2); // shouldn't be better to use init?
console.log(` partial ${result}`);

result = xfplus1.step(result, 3);
console.log(` partial ${result}`);

result = xfplus1.step(result, 4);
console.log(` partial ${result}`);

console.log(` result with "automatic" reducing: ${reduce(xfplus1, [], input)}`);
console.log(` further folding with reduce and sumReducer: ${reduce(sumReducer, 0, reduce(xfplus1, [], input))}`);

console.log('Generalizing transformer to transducer: a transformer decorator');

const transducerPlus1 = function(xf: Transformer): Transformer {
  return {
    init: function() {
      return xf.init(); // delegates to the decorated transformer
    },
    step: function(result: number[], item: number) {
      const plus1ed = plus1(item);
      return xf.step(result, plus1ed); // delegates after decoration
    },
    result: function(result) {
      return xf.result(result); //same
    },
  };
};

const stepper: Transformer = wrap(appendReducer);
const xf2: Transformer = transducerPlus1(stepper);
result = xf2.step([], 2);
console.log(` partial ${result}`);

result = xf2.step(result, 3);
console.log(` partial ${result}`);

result = xf2.step(result, 4);
console.log(` partial ${result}`);

console.log(` result with transducer step by step: ${xf2.result(result)}`);
console.log(` result with transducer through reduce: ${reduce(xf2, [], input)}`);

console.log(` now we can reuse it with different reducer/stepper: ${reduce(transducerPlus1(wrap(sumReducer)), 0, input)}`);

// Generalizing transducers to maps and filters
interface MappingFunction {
  (val: number): number;
}

interface Transducer {
  (xf: Transformer): Transformer;
}

var map = function(f: MappingFunction): Transducer {
  return function(xf: Transformer): Transformer {
    return {
      init: function() {
        return xf.init();
      },
      step: function(result: number[], item: number) {
        return xf.step(result, f(item));
      },
      result: function(result: number[]) {
        return xf.result(result);
      },
    };
  };
};
console.log(' now we can use map to make different isomorphic decorators');
console.log(`  ${reduce(map(x => x + 5)(wrap(appendReducer)), [], input)}`);
console.log(`  ${reduce(map(x => x + 3)(wrap(sumReducer)), 0, input)}`);

// making a more standard runner
function transduce(transducer: Transducer, stepper: ReducingFunction, init: number | number[], input: number[]) {
  var xf: Transformer;

  if (typeof stepper === 'function') {
    xf = wrap(stepper);
  } else {
    xf = stepper;
  }

  var xf: Transformer = transducer(xf); // decorate the reducer with the transformer

  return reduce(xf, init, input);
}

console.log(
  ` result using the transduce function: ${transduce(
    map(x => x + 5),
    sumReducer,
    0,
    input,
  )}`,
);

// Composing transducers
function compose2(fn1: Function, fn2: Function) {
  return function(item: any) {
    var result = fn2(item);
    result = fn1(result);
    return result;
  };
}
console.log(
  ` result using the transduce function: ${transduce(
    compose2(
      map(x => x + 5),
      map(x => x * 2),
    ),
    appendReducer,
    [],
    input,
  )}`,
);
