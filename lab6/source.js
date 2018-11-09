// temporary for debug
//require('./salesman.js')();

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

// function calculates summary distance from Pruufer code
// variant function
var fitness_function = function(x) {return getLength(x)}
// expected exact result
let f_exact = 9074.14804787284

function generateMatrix(n, value) {
	var ret = [];
	for (var i = 0; i < n; i++) {
		row = [];
		for (var j = 0; j < n; j++)
			row.push(value);
		ret.push(row);
	}
	return ret;
}

// решаем задачу коммивояжера на основе алгоритма муравьиной колонии
// N -- количество городов
// также мы предоставляем матрицу весов графа
//http://rain.ifmo.ru/cat/data/theory/unsorted/ant-algo-2006/article.pdf
function Lab6(N= 40, M=10000, Alpha = 0.33, Beta = 1.25, rho = 0.05, cycled = true) {
    this.setN = function(val) {N = val;this.colony_regenerate()}
    this.setM = function(val) {M = val}
    this.setAlpha = function(val) {Alpha = val}
    this.setBeta = function(val) {Beta = val}
    this.setRho = function(val) {rho = val}

    this.generation = null
    this.generation_number = 0
    this.data = []
    this.data_update_callback = []
    this.fitness_repeat = 0

	this.PHEROMONE_QUANTITY = 3000*CITY_COUNT; // количество феромона за единицу расстояния, оставляемое муравьём при прохождении пути
	this.PHEROMONE = generateMatrix(CITY_COUNT, 1); // предположим, что на каждом ребре оставлено равное количество феромона

    this.bestAnt = {variant : [], pathLength : Number.POSITIVE_INFINITY}; // приз "лучший муравей"
    this.bestAnt.fitness = function() {return getLength(this.interpret())}
    this.bestAnt.interpret = function() {return this.variant.map(e=>e+1)}
        
    this.colony_regenerate = function() {
        this.colony = []; // колония муравьёв
        for (var i = 0; i < N; i++)
        this.colony.push({ant_index: i});
    }
    this.colony_regenerate();

	this.dist = function() {
        return Math.floor(Math.random()*CITY_COUNT)
    }

    this.run = function() {
        do {
            this.step()
        } while (!end_condition(this.generation, this.generation_number))
    }

    this.step = function() {
        var dist = {};
        dist.rand = this.dist
		// для каждого муравья вычисляем то, куда он собственно отправится
		// кстати, если он пройдёт хотя бы одно запрещённое ребро, то он не оставит феромона (расстояние = Infinity, вклад = 0)
		for (var i = 0; i < N; i++) {
			var ant = this.colony[i];
			ant.at = dist.rand();
			ant.distance = 0;
			ant.cityList = [ant.at];
			while(ant.cityList.length != CITY_COUNT) { // пока наш муравьишечка не пройдёт все города
				// соберём доступные города
				var available = []
				var TW = 0;
				for (var k = 0; k < CITY_COUNT; k++) {
					if (ant.cityList.indexOf(k) == -1) {
						available.push(k);
						TW += Math.pow(this.PHEROMONE[ant.at][k], Alpha) * Math.pow(1/W(ant.at,k), Beta)
					}
				}
				if (available.length == 0) { // бедному муравьишке уже некуда идти
					ant.distance = Number.POSITIVE_INFINITY; // вот столько он прошёл, чтобы сделать цикл (к успеху шёл)
					break;
				}
				// из доступных городов выбираем вероятностным методом тот, который выгоднее
				var r = Math.random()*TW; // просто сгенерим случайное число (умножаем его на нормировку)
				var to; // пункт назначения
				while (true) {
					if (available.length == 0) break; // ну хоть какой-то город-то оставим мб
					to = available.shift();
					r -= Math.pow(this.PHEROMONE[ant.at][to], Alpha) * Math.pow(1/W(ant.at, to), Beta);
					if (r <= 0) break;
				}
				// переходим в город, пересчитываем параметры муравья
				ant.cityList = ant.cityList.concat([to]);
				ant.distance += W(ant.at,to);
				ant.at = to;
			}
			if (cycled) { // если зациклено, а вернуться не можем, то муравей прошёл зря
				var v1 = ant.cityList[0];
				var v2 = ant.cityList[ant.cityList.length - 1];
				ant.distance += W(v2,v1); // кстати, добавить к пройденному расстоянию-то муравья это желательно!
			}
		}
		// после того, как все муравьи прошли свои расстояния, пересчитываем феромон
		for (var k1 = 0; k1 < CITY_COUNT; k1++)
			for (var k2 = 0; k2 < CITY_COUNT; k2++)
				this.PHEROMONE[k1][k2] *= (1 - rho); // сначала феромон испаряется
		// затем успешные муравьи добавляют феромона, и чем короче путь, тем более сильный след феромона останется
		for (var i = 0; i < N; i++) {
			var ant = this.colony[i];
			for (var k = 0; k < ant.cityList.length - 1; k++) {
				this.PHEROMONE[ant.cityList[k]][ant.cityList[k + 1]] += this.PHEROMONE_QUANTITY / ant.distance;
			}
			if (cycled) // зацикливание необходимо?
				this.PHEROMONE[ant.cityList[ant.cityList.length - 1]][ant.cityList[0]] += this.PHEROMONE_QUANTITY / ant.distance;
			if (ant.distance < this.bestAnt.pathLength) { // запоминаем самого успешного муравья
				this.bestAnt.pathLength = ant.distance;
				this.bestAnt.ant_index = ant.ant_index;
				this.bestAnt.variant = [];
				for (var k = 0; k < ant.cityList.length; k++) {
					this.bestAnt.variant.push(ant.cityList[k])
				}
			}
        }
        collect_data.call(this, this.bestAnt, this.generation_number)
        this.generation_number++
    }

    function collect_data(bestAnt, step) {
        let fitness = bestAnt.pathLength
        let max = fitness
        let min = fitness
        let avg = fitness
        let new_data = {
            step: step,
            err: Math.abs(avg-f_exact),
            max: max,
            min: min,
            avg: avg
        }
        this.data.push(new_data)
        for (let k = 0; k < this.data_update_callback.length; k++) {
            this.data_update_callback[k](this.data, [bestAnt])
        }
        return [bestAnt]
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
        return step >= M
    }

    this.prepare = function () {
    }
    this.condition_satisfied = function() {
        return end_condition(this.generation, this.generation_number)
    }
    this.reset = function() {
        delete this.generation
        delete this.data
        this.data = []
        delete this.fitness_repeat
        delete this.ga
    }
}