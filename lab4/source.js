// temporary for debug
if (typeof require != "undefined")
    require('./syntactic_tree.js')();

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

    // extra helping function
    this.calculate_fitness_array = function() {
        return this.generation.map(g=>g.fitness()).filter((v,i,a)=>i==a.indexOf(v)).sort((a, b)=>b-a)
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

// analyzable function
// [-100, -100] <= x <= [100, 100]
fEaso = function(x) {return -Math.cos(x[0])*Math.cos(x[1])*
                Math.exp(-(x[0] - Math.PI)*(x[0] - Math.PI) - (x[1] - Math.PI)*(x[1] - Math.PI))}
// algorithm fitness function
var net_fracture = 7
var full_bounds = {
    from:[-2, -2],
    to:[8, 8]
}
var bounds = {
    from:[0, 0],
    to:[6, 6]
}
var fitness_function = makeFitnessFunction(fEaso, bounds, net_fracture)
// assume f_exact is no error
f_exact = 0

/*
 * defining all desired operators and constants within class definition
 * N -- population count
 * H -- tree height
 * pc -- crossingover probability
 * mc -- mutation probability
 * M -- maximum number of population
 * epsilon -- precision of finding solution
 */
function Lab4(N, H, pc, pm, M = 20000, epsilon = 0.001) {
    this.setN = function(val) {N = val}
    this.setPC = function(val) {pc = val}
    this.setPM = function(val) {pm = val}
    this.setEpsilon = function(val) {epsilon = val}
    // if epsilon is undefined, we can use connection of genome size and
    // probable error estimation

    this.generation = null
    this.data = []
    this.data_update_callback = []

    // define entity of generation
    // genome: array of integers (for multidimensional optimisation)
    // age: number of generations that entity is alive
    function fpn_entity(genome, age = 0) {
        this.genome = genome
        this.age = age 
        this.invalid = true
        // function takes the other entity to reproduce
        // function returns array of two new entity generated as a crossingover result
        this.crossingover = function(other) {     
            
            var entity1 = new fpn_entity(treeDeepcopy(this.genome))
            var entity2 = new fpn_entity(treeDeepcopy(other.genome))
            var crossed = treeCrossingover(entity1.genome, entity2.genome, 0.22)
            if (!crossed) { // no actual crossingover happened
                // make lazy computations
                entity1.fitness_value = this.fitness_value
                entity2.fitness_value = other.fitness_value
                entity1.invalid = false
                entity2.invalid = false
            }
            return [entity1, entity2]
        }

        this.mutation = function() {
            treeMutation(this.genome, 0.14, bounds.from.length, Math.random() < 0.5)
            this.invalid = true
        }
        
        // interpretation is genome itself
        this.interpret = function() {
            return genome
        }

        // calculates fitness function based on the interpretation
        this.fitness = function() {
            if (this.invalid) // lazy computations
                this.fitness_value = fitness_function(this.interpret())
            this.invalid = false
            return this.fitness_value
        }
    }

    // the function returns random generation
    function random_generation() {
        var init_generation = []
        for (let l = 0; l < N; l++) {
            init_generation.push(new fpn_entity(growTree(H, bounds.from.length, true)))
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
    function mutation(generation, step) {
        // make copy of generation
        var next = generation.slice()
        // instantly make mutations
        for (var k = 0; k < next.length; k++) {
            if (Math.random() < pm) { // mutation probability happens
                next[k].mutation()
            }
        }
        // return result
        return next
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
    function collect_data(lab) {
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
            lab.data.push(new_data)
            for (let k = 0; k < lab.data_update_callback.length; k++) {
                lab.data_update_callback[k](lab.data, lab.generation)
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
        // sort descending
        generation = generation.sort((e1, e2) => e2.fitness() - e1.fitness())
        let avg = generation.map(ent=>ent.fitness()).reduceRight((prev,val)=>prev+val)/generation.length
        return Math.abs(avg-f_exact) < epsilon || step >= M
    }

    this.prepare = function () {
        let operators = [mutation, reproduction, reduction(this), collect_data(this)] // operator sequence
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
        delete this.ga
    }
        
}

/*N = 50
H = 11
pc = 1.0
pm = 0.002
M = 1000
eps = 0.01
K = 1; // repeat count
var result = []
for (N = 1000; N <= 1000; N += 25) {
    for (pm = 0.01; pm <= 0.01; pm += 0.01) {
        var err_arr = []
        var step_arr = []
        for (k = 0; k < K; k++) {
            var lab = new Lab4(N, H, pc, pm, M, eps)
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
}*/
var nop = 0; // for breakpoint in Visual Studio Code