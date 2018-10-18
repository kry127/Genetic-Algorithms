//temporary for debug
// bays29 + Pruffer (variant 13)

cities = [
    {id:1,  x:1150.0, y:1760.0},
    {id:2,  x:630.0,  y:1660.0},
    {id:3,  x:40.0,   y:2090.0},
    {id:4,  x:750.0,  y:1100.0},
    {id:5,  x:750.0,  y:2030.0},
    {id:6,  x:1030.0, y:2070.0},
    {id:7,  x:1650.0, y:650.0},
    {id:8,  x:1490.0, y:1630.0},
    {id:9,  x:790.0,  y:2260.0},
    {id:10, x:710.0,  y:1310.0},
    {id:11, x:840.0,  y:550.0},
    {id:12, x:1170.0, y:2300.0},
    {id:13, x:970.0,  y:1340.0},
    {id:14, x:510.0,  y:700.0},
    {id:15, x:750.0,  y:900.0},
    {id:16, x:1280.0, y:1200.0},
    {id:17, x:230.0,  y:590.0},
    {id:18, x:460.0,  y:860.0},
    {id:19, x:1040.0, y:950.0},
    {id:20, x:590.0,  y:1390.0},
    {id:21, x:830.0,  y:1770.0},
    {id:22, x:490.0,  y:500.0},
    {id:23, x:1840.0, y:1240.0},
    {id:24, x:1260.0, y:1500.0},
    {id:25, x:1280.0, y:790.0},
    {id:26, x:490.0,  y:2130.0},
    {id:27, x:1460.0, y:1420.0},
    {id:28, x:1260.0, y:1910.0},
    {id:29, x:360.0,  y:1980.0},
]

best_path = [1,28,6,12,9,26,3,29,5,21,2,20,10,4,15,18,14,17,22,11,19,25,7,23,8,27,16,13,24,]

function getCity(id) {
    return cities.find(city=>city.id==id);
}

function convert_path(path_list) {
    var N = path_list.length
    // https://www.jstips.co/en/javascript/create-range-0...n-easily-using-one-line/
    var ord = Array.apply(null, {length: N}).map((value, index)=>index+1);
    return path_list.map(val=> {
        let ret =  ord.indexOf(val)
        if (ret == -1) throw "Invalid path"
        ord.splice(ret, 1)
        return ret + 1
    })
}

function convert_path_inverse(order_list) {
    var N = order_list.length
    var ord = Array.apply(null, {length: N}).map((value, index)=>index+1);
    return order_list.map(value=>ord.splice(value-1, 1)[0])
}

// function for check identity
function id (path) {return convert_path_inverse(convert_path(path));}

// making greedy algorithm solution (O(n))
function greedy_solution(initial_city_id) {
    // initialization
    var id_list = cities.map(v=>v.id)
    id_list.splice(id_list.indexOf(initial_city_id), 1)
    var result_list = [initial_city_id]

    while(id_list.length > 0) {
        let city_id = result_list[result_list.length - 1]
        let city = getCity(city_id)
        let sort_r2 = id_list.map(v=>getCity(v))
            .map(v=>{
                return {
                    id:v.id,
                    r2:(v.x-city.x)*(v.x-city.x) + (v.y-city.y)*(v.y-city.y)
                }
            }).sort((a, b)=>{return a.r2-b.r2});
        let next_id = sort_r2[0].id
        id_list.splice(id_list.indexOf(next_id), 1)
        result_list.push(next_id)
    }
    return result_list
}

function getLengthOL(order_list) {
    return getLength(convert_path_inverse(order_list))
}
function getLength(path_list) {
    return path_list.map((v, index, array)=>{
        let cityA = getCity(v)
        let cityB_metaid = (index+1)%array.length
        let cityB = getCity(array[cityB_metaid])
        return Math.sqrt((cityA.x - cityB.x)*(cityA.x - cityB.x) + (cityA.y - cityB.y)*(cityA.y - cityB.y))
    }).reduce((prev, curr)=>prev+curr);
}

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

// function calculates summary distance from Pruufer code
// variant function
var fitness_function = function(x) {return -getLengthOL(x)}
// expected exact result
let f_exact = -9074.14804787284

/*
 * defining all desired operators and constants within class definition
 * L -- genome size (cities count)
 * pc -- crossingover probability
 * mc -- mutation probability
 * M -- maximum number of population
 * epsilon -- precision of finding solution
 */
function Lab3(N, pc, pm, L = cities.length, M = 20000, epsilon = 0.001) {
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
        this.mutation = function() {
            // no mutation happens now
            var idx = Math.floor(Math.random() * (genome.length-1))
            [genome[idx], genome[idx+1]] = [genome[idx+1], genome[idx]]
            if (genome[idx+1]>1 && Math.random() < 0.5) {
                genome[idx]++;
                genome[idx+1]--;
            }
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
            let rand = Math.floor(Math.random()*L)+1
            var genome = convert_path(greedy_solution(rand))
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
        // sort descending
        generation = generation.sort((e1, e2) => e2.fitness() - e1.fitness())
        let avg = generation.map(ent=>ent.fitness()).reduceRight((prev,val)=>prev+val)/generation.length
        return Math.abs(avg-f_exact) < epsilon || step >= M
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

// tests here
/*var lab1 = new Lab1(-5, 5, 16, 30, 0.5, 0.001) // create problem instance
lab1.calculate() // begin calculations
var last_gen = lab1.ga.generation // last generation

var fitness = last_gen.map(ent=>ent.fitness())
var max = Math.max(...fitness)
var min = Math.min(...fitness)
var avg = fitness.reduceRight((prev,val)=>prev+val)/fitness.length*/

N = 50
pc = 1.0
pm = 0.002
M = 20000
eps = 0.01
K = 1; // repeat count
var result = []
for (N = 1000; N <= 1000; N += 25) {
    for (pm = 0.01; pm <= 0.01; pm += 0.01) {
        var err_arr = []
        var step_arr = []
        for (k = 0; k < K; k++) {
            var lab = new Lab3(N, pc, pm, L=cities.length, M, eps)
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

var nop = 0; // for breakpoint in Visual Studio Code