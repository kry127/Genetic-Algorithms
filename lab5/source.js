/* Generic genetic algorithm
 *  Constructor parameters description:
 *  1. operators: array of function
 *     input: 1. array of entities (generation)
 *            2. generation number (can be used to init generations)
 *     output: modified array of entities (generation) according to operator and it's parameters
 *     NOTE: operators[0]
 *  2. condition: ending predicate
 *     input: 1. array of entities (generation)
 *            2. generation number
 *     output: boolean -- the ending conditions were met
 *  3. init_generation: array of entities -- initial generation
 *  
 */
function GeneticAlgorithm(operators, condition, init_generation = []) {
    this.generation_number = 0
    this.generation = init_generation

    /*
     * The function "step" makes one cycle in operator applying,
     * that consequently makes new generation
     */
    this.step = function () {
        for (let k = 0; k < operators.length; k++) {
            this.generation = operators[k](this.generation, this.generation_number)
        }
        this.generation_number++
    }

    /*
     * The function "run" makes many cycles untill condition has been covered.
     */
    this.run = function() {
        do {
            this.step()
        } while (!condition(this.generation, this.generation_number))
    }
}

// now this is two dimensional function
// -5 <= x1 <= 10
// 0 <= x2 <= 15
var var13 = function(x) {
    var x1 = x[0], x2 = x[1];
    var a=1, b=5.1/(4*Math.pow(Math.PI, 2)), c=5/Math.PI, d=6, e=10, f=1/(8*Math.PI);
    return a*Math.pow(x2-b*x1*x1+c*x1-d, 2)+e*(1-f)*Math.cos(x1)+e;
}
// variant function
var fitness_function = function(x) {return -var13(x)}
// expected exact result
let f_exact = -0.397887

// normal distributed magnitude
// https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
// Standard Normal variate using Box-Muller transform.
function randn_bm() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}
Math.random_normal = randn_bm;

/*
 * defining all desired operators and constants within class definition
 * a -- begining of the interval
 * b -- ending of the interval
 * L -- genome size (twice function dimension to optimise)
 * pc -- crossingover probability
 * pm -- mutation probability
 * sigma -- adaptation scale coefficient
 * F -- fitness repeat
 * M -- maximum number of population
 * epsilon -- precision of finding solution
 */
function Lab5(a, b, N, pc, pm, sigma = 1.2, L = 4, F = 100, M = 5000, epsilon = 0.0001) {
    this.setL = function(val) {L = val; random_generation();}
    this.setN = function(val) {N = val}
    this.setPC = function(val) {pc = val}
    this.setPM = function(val) {pm = val}
    this.setSigma = function(val) {sigma = val}
    this.setF = function(val) {F = val}
    this.setM = function(val) {M = val}
    this.setEpsilon = function(val) {epsilon = val}
    if (a > b)
        throw "Parameter a should be less than b"
    // if epsilon is undefined, we can use connection of genome size and
    // probable error estimation

    this.generation = null
    this.data = []
    this.data_update_callback = []
    this.fitness_repeat = 0

    // define entity of generation
    // genome: array of integers (for multidimensional optimisation)
    // age: number of generations that entity is alive
    function fpn_entity(genome, age = 0) {
        this.genome = genome
        this.age = age 
        // function takes the other entity to reproduce and two positions of genome
        // function returns array of two new entity generated as a crossingover result
        // applying simple crossover
        this.crossingover = function(other) {
            let L1 = this.genome.length
            let L2 = other.genome.length
            let L12 = Math.min(L1, L2)
            var entity1 = new fpn_entity(this.genome.slice())
            var entity2 = new fpn_entity(other.genome.slice())
            for (let k = 0; k <= L12; k++)
                if (Math.random() < 0.5) // swap with 50% chance
                    [entity1.genome[k], entity2.genome[k]] = [entity2.genome[k], entity1.genome[k]]

            return [entity1, entity2]
        }
        
        // mutation should implement evolutional strategy
        this.mutation = function() {
            var old_genome = this.genome
            var old_fitness = this.fitness()
            // genome transform with Gaussian distribution
            let DIM = L/2
            for (let u = 0; u < DIM; u++) {
                let v = u + DIM
                this.genome[u] += Math.random_normal()*this.genome[v]
                if (this.genome[u] < a[u]) this.genome[u] = a[u]
                if (this.genome[u] > b[u]) this.genome[u] = b[u]
            }
            // evolutional (1 + 1) strategy
            if (this.fitness() < old_fitness) {
                this.genome = old_genome
                return false
            }
            return true
        }
        
        // interpretation is genome itself
        this.interpret = function() {
            return genome
        }

        // calculates fitness function based on the interpretation
        this.fitness = function() {
            return fitness_function(this.interpret())
        }
    }

    // the function returns random generation
    // N -- count of entities in generation
    // L -- genome size
    function random_generation() {
        var init_generation = []
        for (let l = 0; l < N; l++) {
            var genome = []
            let DIM = L/2
            for (let k = 0; k < DIM; k++)
                genome.push(Math.random()*(b[k]-a[k]) + a[k])
            for (let k = DIM; k < L; k++)
                genome.push (Math.random())
            init_generation.push(new fpn_entity(genome))
        }
        return init_generation
    }

    // the function makes selection+reproduction of the generation
    function reproduction(generation, step) {
        // create local copy of the generation
        var next = generation.slice()
        // collect information about probability of selection
        var fitness = next.map(entity=>entity.fitness())
        // adding 3/2*min element to all of the elements
        var min = fitness.reduceRight((prev,val)=>prev>val?val:prev)
        var fitness = fitness.map(f=>f - min + 1)
        // counting sum of fitness functions
        var sum = fitness.reduceRight((prev,val,index,array)=>prev+val)
        // normalizing fitness functions to probabilities
        var p = fitness.map(fit=>fit/sum);
        // counting CDF of the probability array
        var cdf = p.map(function(value, index, array) {
            if (index == 0) return 0
            return array.slice(0, index).reduceRight((prev,val)=>prev+val)
        })
        cdf.push(1);
        // take the same amount of ancestors as the generation power
        let C = generation.length
        // asquire reproductional indices
        var repro_indices = []
        for (var k = 0; k < C; k++) {
            let q = Math.random()
            repro_indices.push(cdf.findIndex(v=>v>q) - 1)
        }
        // make pairs with selected parents
        for (var k = 0; k < C; k+=2) {
            if (Math.random() < pc) { // reproduction probability happens
                let i1 = repro_indices[k]; // get first index reproducee
                let i2 = repro_indices[k + 1 < C ? k + 1 : 0]; // get second index reproducee
                var born = next[i1].crossingover(next[i2]) // crossingover
                next = next.concat(born) // add newborners to next generation
            }
        }
        // return result
        return next
    }

    // mutations
    this.mutation_count = 0
    this.mutation_successful = 0
    function mutation(ctx) {
        return function (generation, step) {
            // make copy of generation
            var next = generation.slice()
            // instantly make mutations
            for (var k = 0; k < next.length; k++) {
                if (Math.random() < pm) { // mutation probability happens
                    ctx.mutation_count++
                    var success = next[k].mutation(Math.floor(Math.random() * next[k].genome.length))
                    if (success)
                        ctx.mutation_successful++
                }
            }
            // return result
            return next
        }
    }

    // dispersion correction
    function adaptation(ctx) {
        return function (generation, step) {
            // make copy of generation
            var next = generation.slice()
            if (step % (F/2) == 0) {
                let N = ctx.mutation_count
                let n = ctx.mutation_successful
                let p = 1.0*N/n

                p_factor = 0.2
                if (p > p_factor) {
                    for (let k = 0; k < next.length; k++) {
                        for (let l = L/2; l < L; l++)
                            next[k].genome[l] *= sigma
                    }
                } else if (p < p_factor) {
                    for (let k = 0; k < next.length; k++) {
                        for (let l = L/2; l < L; l++)
                            next[k].genome[l] /= sigma
                    }
                }
                ctx.mutation_count = 0
                ctx.mutation_successful = 0
            }
            return next
        }
    }

    // reduce the generation
    function reduction(context) {
        return function(generation, step) {
            // make copy of generation
            var next = generation.slice()
            // sort entities by criteria
            var next = next.sort((a, b) => {
                let val_a = a.fitness()// - a.age
                let val_b = b.fitness()// - b.age
                return val_b - val_a // this is on maximum
                //return val_a - val_b // this is on minimum
            })
            // save only the half of array (THANOS)
            var next = next.slice(0, N)
            // increase the age for everybody alive
            next.forEach(v=>v.age++)
            // save generation for the informational purpose
            context.generation = next
            return next
        }
    }

    // data collection operator
    function collect_data(lab1) {
        // weird :D
        return function (generation, step) {
            generation = generation.sort((e1, e2) => e2.fitness() - e1.fitness())
            let fitness = generation.map(ent=>ent.fitness())
            let max = Math.max(...fitness)
            let min = Math.min(...fitness)
            let avg = fitness.reduceRight((prev,val)=>prev+val)/fitness.length
            let new_data = {
                step: step,
                err: Math.abs(avg-f_exact),
                max: max,
                min: min,
                avg: avg
            }
            lab1.data.push(new_data)
            for (let k = 0; k < lab1.data_update_callback.length; k++) {
                lab1.data_update_callback[k](lab1.data, lab1.generation)
            }
            return generation
        }
    }

    /*
     * In order to maintain data refresh, we need to 
     */
    this.register_data_update_callback = function(callback) {
        let idx = this.data_update_callback.findIndex(callback)
        if (idx != -1) return
        this.data_update_callback.push(callback)
    }
    this.unregister_data_update_callback = function(callback) {
        let idx = this.data_update_callback.findIndex(callback)
        if (idx == -1) return
        this.data_update_callback.splice(idx, 1)
    }

    function end_condition(generation, step) {
        try {
            // sort descending
            generation = generation.sort((e1, e2) => e2.fitness() - e1.fitness())
            let max = Math.max(...generation.map(ent=>ent.fitness()))
            if (this.generation_number == 0 && max > this.old_max) {
                this.old_max = max
                this.fitness_repeat = 1
            } else {
                this.fitness_repeat++
            }
            
            return Math.abs(avg-f_exact) < epsilon || step >= M || fitness_repeat > F          
        } catch (e) {
            return false
        }
   
    }

    this.prepare = function () {
        let operators = [adaptation(this), reproduction, mutation(this), reduction(this), collect_data(this)] // operator sequence
        let init_generation = random_generation() // initial generation
        this.ga = new GeneticAlgorithm(operators, end_condition, init_generation) // prepare to launch genetic algorithm
    }
    this.step = function() {
        if (!this.ga) this.prepare()
        this.ga.step()
    }
    this.run = function() {
        if (!this.ga) this.prepare()
        this.ga.run()
    }
    this.condition_satisfied = function() {
        return end_condition(this.generation, this.ga.generation_number)
    }
    this.reset = function() {
        delete this.generation
        delete this.data
        this.data = []
        delete this.fitness_repeat
        delete this.ga
    }
        
}

// tests here
/*var lab1 = new Lab1(-5, 5, 16, 30, 0.5, 0.001) // create problem instance
lab1.calculate() // begin calculations
var last_gen = lab1.ga.generation // last generation

var fitness = last_gen.map(ent=>ent.fitness())
var max = Math.max(...fitness)
var min = Math.min(...fitness)
var avg = fitness.reduceRight((prev,val)=>prev+val)/fitness.length*/

/*a = [-5, 0]
b = [10, 15]
L = 2
N = 50
pc = 1.0
pm = 0.002
M = 20000
eps = 0.01
K = 50; // repeat count
var result = []
for (N = 125; N <= 250; N += 25) {
    for (pm = 0.0024; pm <= 0.0024; pm += 0.0004) {
        var err_arr = []
        var step_arr = []
        for (k = 0; k < K; k++) {
            //Lab2(a, b, N, pc, pm, L = 2, M = 5000, epsilon = 0.0001)
            var lab = new Lab2(a, b, N, pc, pm, L, M, eps)
            lab.run() // begin calculations
            var generation = lab.ga.generation // last generation
            // get the best one
            generation = generation.sort((e1, e2) => e2.fitness() - e1.fitness())
            // save his error
            err_arr.push(Math.abs(f_exact-generation[0].fitness()))
            step_arr.push(lab.ga.generation_number)
        }
        var max_err = Math.max(...err_arr)
        var min_err = Math.min(...err_arr)
        var avg_err = err_arr.reduceRight((prev,val)=>prev+val)/err_arr.length
        var max_step = Math.max(...step_arr)
        var min_step = Math.min(...step_arr)
        var avg_step = step_arr.reduceRight((prev,val)=>prev+val)/step_arr.length
        result.push({
            N: N,
            pm: pm,
            max_err: max_err,
            min_err: min_err,
            avg_err: avg_err,
            max_step: max_step,
            min_step: min_step,
            avg_step: avg_step
        })
    }
}

for (k = 0; k < result.length; k++)
    console.log(result[k].N + "|" + result[k].pm + "|" + result[k].avg_err + "|" + result[k].avg_step)
*/
var nop = 0; // for breakpoint in Visual Studio Code