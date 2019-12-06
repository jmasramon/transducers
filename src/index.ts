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

// REDUCING
console.log('Native reductions');

const summed = input.reduce(sumReducer, 1);
console.log(` summed = ${summed}`);

// 24 (=1*2*3*4)
const multiplied = input.reduce(multReducer, 1);
console.log(` multiplied = ${multiplied}`);

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

const wrap = function(reducingFunction: ReducingFunction): Transformer {
  return {
    // 1. Start with an initial value
    init: function() {
      throw new Error('init not supported');
    },

    // 2. Input one item at a time, passing
    //    each result to next iteration
    //    using reducing function
    step: reducingFunction,

    // 3. Output last computed result
    result: function(result: number | number[]) {
      return result;
    },
  };
};

function reduce(xf: Transformer | ReducingFunction, init: number | number[], input: number[]): number | number[] {
  let acc = init;
  if (typeof xf === 'function') {
    // make sure we have a transformer
    xf = wrap(xf);
  }

  const result = input.reduce(xf.step, init);
  // to try to make the compiler stop complaining
  // for (const value of input) {
  //   acc = xf.step(acc, value);
  // }

  return xf.result(result);
}

console.log('Functional reductions');

const output = reduce(sumReducer, 1, input);
console.log(` reducing over sum and 1 = ${output}`);

const xf = wrap(multReducer);
const output2 = reduce(xf, 1, input);
console.log(` reducing over mult and 1 = ${output2}`);

const appendReducer: ReducingFunction = function(acc: number[], item: number): number[] {
  acc.push(item);
  return acc;
};

const output3 = reduce(appendReducer, [], input);
console.log(` reducing over append and []  = ${output3}`);

function plus1(item: number) {
  return item + 1;
}

const xfplus1: Transformer = {
  init: function() {
    throw new Error('init not needed');
  },
  step: function(result: number[], item: number): number[] {
    var plus1ed = plus1(item);
    return appendReducer(result, plus1ed);
  },
  result: function(result) {
    return result;
  },
};

console.log('Using transformer');

let result = xfplus1.step([], 2);
console.log(` partial ${result}`);

result = xfplus1.step(result, 3);
console.log(` partial ${result}`);

result = xfplus1.step(result, 4);
console.log(` partial ${result}`);

console.log(` result with explicit reducing: ${reduce(xfplus1, [], input)}`);
console.log(` further folding with reduce and sumReducer: ${reduce(sumReducer, 0, reduce(xfplus1, [], input))}`);

console.log('Generalizing transformer to transducer: a transformer decorator');

const transducerPlus1 = function(xf: Transformer): Transformer {
  return {
    init: function() {
      return xf.init();
    },
    step: function(result: number[], item: number) {
      const plus1ed = plus1(item);
      return xf.step(result, plus1ed);
    },
    result: function(result) {
      return xf.result(result);
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

console.log(` result with transducer step by step: ${xf.result(result)}`);
// [3,4,5]
console.log(` result with transducer through reduce: ${reduce(xf2, [], input)}`);

console.log(` now we can reuse it with different reducer: ${reduce(transducerPlus1(wrap(sumReducer)), 0, input)}`);

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
        var mapped = f(item);
        return xf.step(result, mapped);
      },
      result: function(result: number[]) {
        return xf.result(result);
      },
    };
  };
};
console.log(' now we can use map to make different isomorphism decorators');
console.log(`  ${reduce(map(x => x + 5)(wrap(appendReducer)), [], input)}`);
console.log(`  ${reduce(map(x => x + 5)(wrap(sumReducer)), 0, input)}`);

// making a more standard runner
function transduce(transducer: Transducer, stepper: ReducingFunction, init: number | number[], input: number[]) {
  var xf: Transformer;

  if (typeof stepper === 'function') {
    xf = wrap(stepper);
  } else {
    xf = stepper;
  }

  var xf: Transformer = transducer(xf);

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
