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
var input_alpha = document.getElementById("alpha_number")
var input_beta = document.getElementById("beta_number")
var input_rho = document.getElementById("rho_number")
var input_M = document.getElementById("max_step_number")
var input_generation_from = document.getElementById("generation_from_number")
var input_generation_to = document.getElementById("generation_to_number")
var range_N = document.getElementById("population_size_range")
var range_alpha = document.getElementById("alpha_range")
var range_beta = document.getElementById("beta_range")
var range_rho = document.getElementById("rho_range")
var range_M = document.getElementById("max_step_range")
var range_generation_from = document.getElementById("generation_from_range")
var range_generation_to = document.getElementById("generation_to_range")
bindInputs(input_N, range_N);
bindInputs(input_alpha, range_alpha);
bindInputs(input_beta, range_beta);
bindInputs(input_rho, range_rho);
bindInputs(input_M, range_M);
bindInputs(input_generation_from, range_generation_from);
bindInputs(input_generation_to, range_generation_to);
input_generation_from.onchange = e=>lab_data_callback()
input_generation_to.onchange = e=>lab_data_callback()
range_generation_from.onchange = e=>lab_data_callback()
range_generation_to.onchange = e=>lab_data_callback()

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


var ctx = document.getElementById("myChart");
var container = document.getElementById("container");
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
                    setTimeout(run_continuously_lab, 0)
            }
        }
    }
};
//https://stackoverflow.com/questions/40086575/chart-js-draw-mathematical-function
chart = new Chart(ctx, cfg_maxminavg); // finally, create instance of the chart



// sigmajs got closer to callbacks
var step = 1
var old_idx_from = -1
var old_idx_to = -1
var last_data_callback
var best_entity
// sigma.js part
///https://github.com/jacomyal/sigma.js/wiki

var s = new sigma(container);
s.settings({
    edgeColor: 'default',
    defaultEdgeColor: '#999',
    defaultNodeColor: '#0f0'
  });
cities.map(city=>{
    return {
        id: city.id,
        x: city.x,
        y: city.y,
        size:0.2,
        label: String(city.id),
        color: '#00f'
    }
}).map(city=>s.graph.addNode(city));
drawBests();

function drawPath(path, edge_prefix, color) {
    for (let k = 0; k < path.length; k++) {
        s.graph.addEdge({
            id: edge_prefix + k,
            source: path[k],
            target: path[(k + 1) % path.length],
            color: color
        })
    }
}
function drawBests() {
    s.graph.edges().map(v=>s.graph.dropEdge(v.id)); // not optimal
    drawPath(best_path, 'best', '#966');
    if(best_entity) drawPath(best_entity.interpret(), 'best_gen', "#00f3")
    s.refresh();
}

// can be called with no parameters to imitate last call
function lab_data_callback(data_array, generation) {
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

    // if needed, update chart
    if (needToUpdate) chart.update()
}
  
function create_lab() {
    let N = Number(input_N.value)
    let alpha = Number(input_alpha.value)
    let beta = Number(input_beta.value)
    let rho = Number(input_rho.value)
    let M = Number(input_M.value)
    lab = new Lab6(N, M, alpha, beta, rho)
    lab.register_data_update_callback(lab_data_callback)
    lab.prepare()
    clearArray(datasetMinFitness.data)
    clearArray(datasetAvgFitness.data)
    clearArray(datasetMaxFitness.data)
    clearArray(datasetErrFitness.data)
    clearArray(generation_labels)
    chart.update()

    input_N.onchange = ev=>lab.setN(Number(input_N.value))
    input_alpha.onchange = ev=>lab.setAlpha(Number(input_alpha.value))
    input_beta.onchange = ev=>lab.setBeta(Number(input_beta.value))
    input_rho.onchange = ev=>lab.setRho(Number(input_rho.value))
    input_M.onchange = ev=>lab.setM(Number(input_M.value))
    range_N.onchange = ev=>lab.setN(Number(range_N.value))
    range_alpha.onchange = ev=>lab.setAlpha(Number(range_alpha.value))
    range_beta.onchange = ev=>lab.setBeta(Number(range_beta.value))
    range_rho.onchange = ev=>lab.setRho(Number(range_rho.value))
    range_M.onchange = ev=>lab.setM(Number(range_M.value))
}
create_lab();

function step_lab() {
    lab.step()
    chart.update()
    drawBests()
}
function run_lab() {
    lab.run()
    chart.update()
    drawBests()
}

var button_prev_value = btn_continuous_run.value;
function run_continuously_lab() {
    for (let k = 0; k < Math.min(10*step, 100); k++)
        if (!lab.condition_satisfied()) {
            step_lab()
        } else {
            running = false
            btn_continuous_run.value = button_prev_value
            drawBests()
            break
        }
}
function run_continuously_wrap() {
    if (running) {
        running = false
        btn_run.disabled = false
        btn_step.disabled = false
        btn_continuous_run.value = button_prev_value
        drawBests()
    } else {
        running = true
        btn_run.disabled = true
        btn_step.disabled = true
        btn_continuous_run.value = "Пауза"
        run_continuously_lab()
    }
}
function reset_lab() {
    running = false
    btn_run.disabled = false
    btn_step.disabled = false
    btn_continuous_run.value = button_prev_value
    setMaxGenerationValue(0)
    setFromGenerationValue(0)
    setToGenerationValue(0)

    lab.reset()
    lab.prepare()
    clearArray(datasetMinFitness.data)
    clearArray(datasetAvgFitness.data)
    clearArray(datasetMaxFitness.data)
    clearArray(datasetErrFitness.data)
    clearArray(generation_labels)
    chart.update()
}

create_lab();
btn_step.onclick = step_lab;
btn_run.onclick = run_lab;
btn_continuous_run.onclick = run_continuously_wrap;
btn_reset.onclick = reset_lab;