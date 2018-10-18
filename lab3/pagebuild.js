// some parameters and variables to maintain process
var running = false; // identifies whenever genetic algorithm is running or not
var btn_step = document.getElementById("btn_step")
var brn_run = document.getElementById("btn_run")
var btn_continuous_run = document.getElementById("btn_continuous_run")
var btn_reset = document.getElementById("btn_reset")
var select_graphic_select = document.getElementById("visualize_control_select_graphic")

//Make the DIV element draggagle:
// https://www.w3schools.com/howto/howto_js_draggable.asp
function dragElement(elmnt, hdr, content) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  hdr = elmnt.getElementsByClassName("control_panel_header")[0]
  content = elmnt.getElementsByClassName("control_panel_content")[0]
  if (hdr) {
    /* if present, the header is where you move the DIV from:*/
    hdr.onmousedown = dragMouseDown;
    hdr.ondblclick = hidePanel;
  } else {
    /* otherwise, move the DIV from anywhere inside the DIV:*/
    elmnt.onmousedown = dragMouseDown;
  }

  function hidePanel(e) {
    e = e || window.event;
    e.preventDefault();
    // hide or show contents
    let hidden = content.hidden
    content.hidden = !hidden
    // more logics can go further (resize header, for example)
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

var control_panels = document.getElementsByClassName("control_panel")
for (let k = 0; k < control_panels.length; k++)
    dragElement(control_panels[k])

//dragElement(document.getElementById("ga_params_control"));
//dragElement(document.getElementById("run_params_control"));



// chart drawing part
// some utility stuff
function clearArray(arr) {arr.splice(0, arr.length)}
function addToArray(dst, src) {
    for (let k = 0; k < src.length; k++)
        dst.push(src[k])
}
// function for deepcopying settings
function clone(object) {return JSON.parse(JSON.stringify(object))}
// color table
chartColors = {
	red: 'rgb(255, 99, 132)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	green: 'rgb(75, 192, 192)',
	blue: 'rgb(54, 162, 235)',
	purple: 'rgb(153, 102, 255)',
	grey: 'rgb(201, 203, 207)',
	none: 'transparent'
};

var ctx = document.getElementById("myChart");
var my2D = document.getElementById("my2D");
var generation_labels = [] // for generation # dependency
var function_labels = [] // for function argument dependency
// define basic parameters for datasets
var datasetProto = {
    label: 'Fitness',
    data: [],
    type: 'line',
    pointRadius: 3,
    fill: false,
    lineTension: 0,
    borderWidth: 2
}

// fitness minimum dataset
var datasetMinFitness = clone(datasetProto)
datasetMinFitness.label = 'Fitness min'
datasetMinFitness.backgroundColor = chartColors.purple
datasetMinFitness.borderColor = chartColors.purple

// fitness average dataset
var datasetAvgFitness = clone(datasetProto)
datasetAvgFitness.backgroundColor = chartColors.yellow
datasetAvgFitness.borderColor = chartColors.yellow
datasetAvgFitness.label = 'Fitness avg'

// fitness max dataset
var datasetMaxFitness = clone(datasetProto)
datasetMaxFitness.backgroundColor = chartColors.orange
datasetMaxFitness.borderColor = chartColors.red
datasetMaxFitness.label = 'Fitness max'

// solution error dataset
var datasetErrFitness = clone(datasetProto)
datasetErrFitness.backgroundColor = chartColors.red
datasetErrFitness.borderColor = chartColors.red
datasetErrFitness.label = 'Solution error'

// original function dataset
var datasetFunction = clone(datasetProto)
datasetFunction.label = "f(x)"
datasetFunction.lineTension = 0.4 // Bezier tension
datasetFunction.backgroundColor = chartColors.blue
datasetFunction.borderColor = chartColors.blue
datasetFunction.pointRadius = 0.1,
datasetFunction.pointHoverRadius = 0.1
for (let x = -5; x <=5; x += 0.02) {
    datasetFunction.data.push({
        x: x,
        y: fitness_function(x)
    })
}

// scattered generation dataset
//https://stackoverflow.com/questions/42841925/mixed-chart-scatter-plot-with-chart-js
var datasetGeneration = clone(datasetProto)
datasetGeneration.type = "bubble"
datasetGeneration.label = "generation"
datasetGeneration.backgroundColor = chartColors.none
datasetGeneration.borderColor = chartColors.red

var cfg_maxminavg = {
    type: 'line',
    data: {
        labels: generation_labels,
        datasets: [datasetMinFitness, datasetAvgFitness, datasetMaxFitness, datasetErrFitness]
    },
    options: {
        responsive: true,
        tooltips: {
            mode: 'index',
        },
        hover: {
            mode: 'index'
        },
        scales: {
            xAxes: [{
                display: true,
                labelString: 'Population #',
            }],
            yAxes: [{
                scaleLabel: {
                    display: true,
                    labelString: 'Fitness'
                }
            }]
        },
        animation: {
            onComplete: function(animation) {
                if (running)
                    setTimeout(run_continuously_lab2, 0)
            }
        }
    }
};
//https://stackoverflow.com/questions/40086575/chart-js-draw-mathematical-function
chart = new Chart(ctx, cfg_maxminavg); // finally, create instance of the chart
var z_data = []
for (var x2 = 0; x2 <= 15; x2++) {
    var z_row = []
    for (var x1 = -5; x1 <= 10; x1++) {
        z_row[x1+5] = var13([x1, x2])
    }
    z_data.push(z_row)
}
var data_z1 = {z: z_data, showscale: true, opacity:0.9, type: 'surface'};

var layout={ scene:{
    aspectmode: "manual",
    aspectratio: {
        x: 1, y: 0.7, z: 1,
    },
    xaxis: {
    title: "x+5",
    nticks: 15,
    range: [0, 15],
    },
    yaxis: {
    nticks: 15,
    range: [0, 15],
    }},
}
Plotly.newPlot('my2D', [data_z1], layout);

//sync input handlers
function bindInputs(elm1, elm2) {
    var cpy21 = function(event) {
        elm2.value = elm1.value
    }
    var cpy12 = function(event) {
        elm1.value = elm2.value
    }
    //elm1.onchange = cpy21
    //elm2.onchange = cpy12
    elm1.oninput = cpy21
    elm2.oninput = cpy12
}
var input_N = document.getElementById("population_size_number")
var input_pc = document.getElementById("crossingover_probability_number")
var input_pm = document.getElementById("mutation_probability_number")
var input_generation_from = document.getElementById("generation_from_number")
var input_generation_to = document.getElementById("generation_to_number")
var range_N = document.getElementById("population_size_range")
var range_pc = document.getElementById("crossingover_probability_range")
var range_pm = document.getElementById("mutation_probability_range")
var range_generation_from = document.getElementById("generation_from_range")
var range_generation_to = document.getElementById("generation_to_range")
bindInputs(input_N, range_N);
bindInputs(input_pc, range_pc);
bindInputs(input_pm, range_pm);
bindInputs(input_generation_from, range_generation_from);
bindInputs(input_generation_to, range_generation_to);
input_generation_from.onchange = e=>lab2_data_callback()
input_generation_to.onchange = e=>lab2_data_callback()
range_generation_from.onchange = e=>lab2_data_callback()
range_generation_to.onchange = e=>lab2_data_callback()

function setMaxGenerationValue(val) {
    input_generation_from.setAttribute('max', val)
    input_generation_to.setAttribute('max', val)
    range_generation_from.setAttribute('max', val)
    range_generation_to.setAttribute('max', val)
}

function setFromGenerationValue(val) {
    input_generation_from.value = val
    range_generation_from.value = val
}
function setToGenerationValue(val) {
    input_generation_to.value = val
    range_generation_to.value = val
}
function getFromGenerationValue() {
    return Number(input_generation_from.value)
}
function getToGenerationValue() {
    return Number(input_generation_to.value)
}

var step = 1
var old_idx_from = -1
var old_idx_to = -1
var last_data_callback
var best_entity
// can be called with no parameters to imitate last call
function lab2_data_callback(data_array, generation) {
    for (let k = 0; k < generation.length; k++) {
        if (best_entity == null || best_entity.fitness() < generation[k].fitness())
            best_entity = generation[k];
    }
    var needToUpdate = false
    if (data_array)
        last_data_callback = {
            data_array: data_array,
            generation: generation
        }
    else
    {
        if (!last_data_callback) return
        needToUpdate = true
        data_array = last_data_callback.data_array
        generation = last_data_callback.generation
    }
    let last_entry = data_array[data_array.length - 1]
    let last_gen_display = getToGenerationValue()
    setMaxGenerationValue(String(data_array.length - 1))
    if (last_entry.step - last_gen_display == 1) {
        setToGenerationValue(last_entry.step)
    }
    //console.log("Generation #" + last_entry.step + ": [" + last_entry.min + "|" + last_entry.avg +"|" + last_entry.max + "]")

    // gets the quantity order to deal with and the step preferred
    function getPreferredStep(quantity) {
        let lesserOrder = Math.max(Math.floor(Math.log10(quantity)) - 1, 0)
        let step = Math.pow(10, lesserOrder)
        let count = quantity / step
        if (count < 20) return step
        else if (count < 50) return 2*step
        else return 5*step
    }

    function addEntry(entry) {
        datasetMinFitness.data.push({
            t: entry.step,
            y: entry.min
        })
        datasetAvgFitness.data.push({
            t: entry.step,
            y: entry.avg
        })
        datasetMaxFitness.data.push({
            t: entry.step,
            y: entry.max
        })
        datasetErrFitness.data.push({
            t: entry.step,
            y: entry.err
        })
        generation_labels.push("#" + entry.step)
    }

    // getting indexes to fetch data
    var i1 = getFromGenerationValue()
    var i2 = getToGenerationValue()
    let idx_from = Math.min(i1, i2)
    let idx_to = Math.max(i1, i2)
    // dataset_idx -> data_array_idx
    // 0 -> 0, 1 -> step, 2 -> 2*step, ..., (dataset.length-1) -> (dataset.length-1)*step
    //let new_step = getPreferredStep(data_array.length)
    let new_step = getPreferredStep(idx_to - idx_from)
    if (step == new_step && old_idx_from == idx_from) {
        if (datasetMinFitness.data.length*step <= idx_to - idx_from) {
            let last_entry = data_array[idx_to]
            addEntry(last_entry)
        }
    } else {
        // fully rebuild structure
        step = new_step
        clearArray(datasetMinFitness.data)
        clearArray(datasetAvgFitness.data)
        clearArray(datasetMaxFitness.data)
        clearArray(datasetErrFitness.data)
        clearArray(generation_labels)
        for (let k = idx_from; k < idx_to; k+=step) {
            addEntry(data_array[k])
        }
    }
    old_idx_from = idx_from
    old_idx_to = idx_to

    // refreshing generation information
    clearArray(datasetGeneration.data)
    for (let k = 0; k < generation.length; k++) {
        let entity = generation[k]
        function_labels.push(entity.interpret())
        datasetGeneration.data.push({
            x: entity.interpret(),
            y: entity.fitness()
        })
    }

    // if needed, update chart
    if (needToUpdate) chart.update()
}
  
function create_lab2() {
    let N = Number(input_N.value)
    let pc = Number(input_pc.value)
    let pm = Number(input_pm.value)
    lab2 = new Lab2([-5, 0], [10, 15], N, pc, pm)
    lab2.register_data_update_callback(lab2_data_callback)
    lab2.prepare()
    clearArray(datasetMinFitness.data)
    clearArray(datasetAvgFitness.data)
    clearArray(datasetMaxFitness.data)
    clearArray(datasetErrFitness.data)
    clearArray(datasetGeneration.data)
    clearArray(generation_labels)
    chart.update()

    input_N.onchange = ev=>lab2.setN(Number(input_N.value))
    input_pc.onchange = ev=>lab2.setPC(Number(input_pc.value))
    input_pm.onchange = ev=>lab2.setPM(Number(input_pm.value))
    range_N.onchange = ev=>lab2.setN(Number(range_N.value))
    range_pc.onchange = ev=>lab2.setPC(Number(range_pc.value))
    range_pm.onchange = ev=>lab2.setPM(Number(range_pm.value))
}
create_lab2();

function step_lab2() {
    lab2.step()
    chart.update()
}
function run_lab2() {
    lab2.run()
    chart.update()
    alert(best_entity.genome)
}

var button_prev_value = btn_continuous_run.value;
function run_continuously_lab2() {
    for (let k = 0; k < Math.min(10*step, 100); k++)
        if (!lab2.condition_satisfied()) {
            step_lab2()
        } else {
            running = false
            btn_continuous_run.value = button_prev_value
            alert(best_entity.genome)
            break
        }
}
function run_continuously_wrap() {
    if (running) {
        running = false
        btn_run.disabled = false
        btn_step.disabled = false
        btn_continuous_run.value = button_prev_value
        alert(best_entity.genome)
    } else {
        running = true
        btn_run.disabled = true
        btn_step.disabled = true
        btn_continuous_run.value = "Пауза"
        run_continuously_lab2()
    }
}
function reset_lab2() {
    running = false
    btn_run.disabled = false
    btn_step.disabled = false
    btn_continuous_run.value = button_prev_value
    setMaxGenerationValue(0)
    setFromGenerationValue(0)
    setToGenerationValue(0)

    lab2.reset()
    lab2.prepare()
    clearArray(datasetMinFitness.data)
    clearArray(datasetAvgFitness.data)
    clearArray(datasetMaxFitness.data)
    clearArray(datasetErrFitness.data)
    clearArray(datasetGeneration.data)
    clearArray(generation_labels)
    chart.update()
}

create_lab2();
btn_step.onclick = step_lab2;
btn_run.onclick = run_lab2;
btn_continuous_run.onclick = run_continuously_wrap;
btn_reset.onclick = reset_lab2;