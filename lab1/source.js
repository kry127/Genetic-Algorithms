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
    this.condition = condition

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
        } while (!this.condition(this.generation, this.generation_number))
    }
}


var var13 = function(x) {
    return Math.tanh(-x)*Math.cos(x)
}
// variant function
var fitness_function = var13

/*
 * defining all desired operators and constants within class definition
 * a -- begining of the interval
 * b -- ending of the interval
 * L -- genome size
 * pc -- crossingover probability
 * mc -- mutation probability
 */
function Lab1(a, b, L, N, pc, pm) {
    this.setL = function(val) {L = val; random_generation();}
    this.setN = function(val) {N = val}
    this.setPC = function(val) {pc = val}
    this.setPM = function(val) {pm = val}
    // taking variant 13
    // (Exp(-x)-exp(x))cos(x)/(exp(x)+exp(-x))
    // x = -5 .. 5
    if (a > b)
        throw "Parameter a should be less than b"

    this.generation = null
    this.data = []
    this.data_update_callback = []

    // define entity of generation
    // genome: boolean string, representing floating point number (fpn)
    // age: number of generations that entity is alive
    function fpn_entity(genome, age = 0) {
        this.genome = genome
        this.age = age 
        // function takes the other entity to reproduce and two positions of genome
        // function returns array of two new entity generated as a crossingover result
        this.crossingover = function(other, point1, point2) {
            var entity1 = new fpn_entity(this.genome.slice())
            var entity2 = new fpn_entity(other.genome.slice())
            for (let k = point1; k <= point2; k++)
                [entity1.genome[k], entity2.genome[k]] = [entity2.genome[k], entity1.genome[k]]
            return [entity1, entity2]
        }
        // function takes genome position to mutate that position (inversion)
        // no new entities generated during this process
        this.mutation = function(point) {
            this.genome[point] = 1 - this.genome[point]
        }
        
        // converts fpn entity to desired format
        this.interpret = function() {
            var tmp = 0;
            var max = 1;
            for (let k = 0; k < this.genome.length; k++) {
                tmp *= 2
                max *= 2
                if (this.genome[k]) tmp += 1
            }
            return a + (b - a)*tmp/(max - 1)
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
            for (let k = 0; k < L; k++)
                genome.push(Math.random() < 0.5 ? 1 : 0)
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
        var fitness = fitness.map(f=>f - 3*min/2)
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
                let L1 = next[i1].genome.length
                let L2 = next[i2].genome.length
                let L12 = Math.min(L1, L2)
                var point1 = Math.floor(Math.random() * L12) // get first crossingover point
                var point2 = Math.floor(Math.random() * L12) // get second crossingover point
                if (point1 > point2)
                    [point1, point2] = [point2, point1]
                var born = next[i1].crossingover(next[i2], point1, point2) // crossingover
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
                next[k].mutation(Math.floor(Math.random() * next[k].genome.length))
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
    function collect_data(lab1) {
        // weird :D
        return function (generation, step) {
            let fitness = generation.map(ent=>ent.fitness())
            let max = Math.max(...fitness)
            let min = Math.min(...fitness)
            let avg = fitness.reduceRight((prev,val)=>prev+val)/fitness.length
            let new_data = {
                step: step,
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
        return step >= 5000
    }

    this.prepare = function () {
        let operators = [reproduction, mutation, reduction(this), collect_data(this)] // operator sequence
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

/*var lab1 = new Lab1(-5, 5, 16, 30, 0.5, 0.001) // create problem instance
lab1.calculate() // begin calculations
var last_gen = lab1.ga.generation // last generation

var fitness = last_gen.map(ent=>ent.fitness())
var max = Math.max(...fitness)
var min = Math.min(...fitness)
var avg = fitness.reduceRight((prev,val)=>prev+val)/fitness.length*/

var kek = 0;