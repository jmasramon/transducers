console.log(' -> Transducers project working');

// REDUCER FUNCTION: takes an accomulator
// and a value and folds the value into the accomulator
// We use reducing functions to describe "the essence
//of the transformation"
function sum(acc: number, item: number): number {
  return acc + item;
}

function mult(acc: number, item: number): number {
  return acc * item;
}

const input = [2, 3, 4];
console.log(`input to all reductions = ${input}`);

// REDUCING
console.log('Native reductions');

const summed = input.reduce(sum, 1);
console.log(` summed = ${summed}`);

// 24 (=1*2*3*4)
const multiplied = input.reduce(mult, 1);
console.log(` multiplied = ${multiplied}`);

// TODO: not well defined interface -> compiler complains about specific accs of either type
interface ReducingFunction {
  (acc: number | number[], val: number): number;
}

interface Transformer {
  init: () => number;
  step: ReducingFunction;
  result: (result: number | number[]) => number | number[];
}

const transformer = function(reducingFunction: ReducingFunction): Transformer {
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
  if (typeof xf === 'function') {
    // make sure we have a transformer
    xf = transformer(xf);
  }
  const result = input.reduce(xf.step, init);
  return xf.result(result);
}

console.log('Functional reductions');

const output = reduce(sum, 1, input);
console.log(` reducing over sum and 1 = ${output}`);

const xf = transformer(mult);
const output2 = reduce(xf, 1, input);
console.log(` reducing over mult and 1 = ${output2}`);

function append(acc: number[], item: number): number[] {
  acc.push(item);
  return acc;
}

const output3 = reduce(append, [], input);
console.log(` reducing over append and []  = ${output3}`);

function plus1(item: number) {
  return item + 1;
}

const xfplus1: Transformer = {
  init: function() {
    throw new Error('init not needed');
  },
  step: function(result, item) {
    var plus1ed = plus1(item);
    return append(result, plus1ed);
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

console.log(` result with explicit reducing: ${reduce(sum, 0, result)}`);

console.log('Adding transducer');

const transducerPlus1 = function(xf: Transformer): Transformer {
  return {
    init: function() {
      return xf.init();
    },
    step: function(result, item) {
      const plus1ed = plus1(item);
      return xf.step(result, plus1ed);
    },
    result: function(result) {
      return xf.result(result);
    },
  };
};

const stepper = transformer(sum);
const transducer = transducerPlus1;
const xf2 = transducer(stepper);
result = xf2.step(0, 2);
console.log(` partial ${result}`);

result = xf2.step(result, 3);
console.log(` partial ${result}`);

result = xf2.step(result, 4);
console.log(` partial ${result}`);

console.log(` result with transducer: ${xf.result(result)}`);
// [3,4,5]
