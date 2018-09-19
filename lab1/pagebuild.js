// some parameters and variables to maintain process
var running = false; // identifies whenever genetic algorithm is running or not
var btn_step = document.getElementById("btn_step")
var brn_run = document.getElementById("btn_run")
var btn_continuous_run = document.getElementById("btn_continuous_run")
var btn_reset = document.getElementById("btn_reset")

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
chartColors = {
	red: 'rgb(255, 99, 132)',
	orange: 'rgb(255, 159, 64)',
	yellow: 'rgb(255, 205, 86)',
	green: 'rgb(75, 192, 192)',
	blue: 'rgb(54, 162, 235)',
	purple: 'rgb(153, 102, 255)',
	grey: 'rgb(201, 203, 207)'
};

var ctx = document.getElementById("myChart");
var labels = []
var datasetFitness = {
    label: 'Fitness',
    data: [],
    type: 'line',
    pointRadius: 3,
    fill: false,
    lineTension: 0,
    borderWidth: 2
}
function clone(object) {return JSON.parse(JSON.stringify(object))}
var datasetMinFitness = clone(datasetFitness)
datasetMinFitness.label = 'Fitness min'
datasetMinFitness.backgroundColor = chartColors.purple
datasetMinFitness.borderColor = chartColors.purple

var datasetAvgFitness = clone(datasetFitness)
datasetAvgFitness.backgroundColor = chartColors.yellow
datasetAvgFitness.borderColor = chartColors.yellow
datasetAvgFitness.label = 'Fitness avg'

var datasetMaxFitness = clone(datasetFitness)
datasetMaxFitness.backgroundColor = chartColors.red
datasetMaxFitness.borderColor = chartColors.red
datasetMaxFitness.label = 'Fitness max'

var cfg = {
    type: 'line',
    data: {
        labels: labels,
        datasets: [datasetMinFitness, datasetMaxFitness, datasetAvgFitness]
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
            onProgress: function(animation) {
                //console.log("Animation in progress...")
                //progress.value = animation.animationObject.currentStep / animation.animationObject.numSteps;
            },
            onComplete: function(animation) {
                console.log("Animation complete!")
                if (running)
                    setTimeout(run_continuously_lab1, 0)
            }
        }
    }
};
var chart = new Chart(ctx, cfg); // finally, create instance of the chart

// some utility stuff
function clearArray(arr) {arr.splice(0, arr.length)}

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
var input_L = document.getElementById("genome_size_number")
var input_pc = document.getElementById("crossingover_probability_number")
var input_pm = document.getElementById("mutation_probability_number")
var range_N = document.getElementById("population_size_range")
var range_L = document.getElementById("genome_size_range")
var range_pc = document.getElementById("crossingover_probability_range")
var range_pm = document.getElementById("mutation_probability_range")
bindInputs(input_N, range_N);
bindInputs(input_L, range_L);
bindInputs(input_pc, range_pc);
bindInputs(input_pm, range_pm);

var step = 1
function lab1_data_callback(data_array, generation) {
    let last_entry = data_array[data_array.length - 1]
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
        labels.push("#" + entry.step)
    }

    // dataset_idx -> data_array_idx
    // 0 -> 0, 1 -> step, 2 -> 2*step, ..., (dataset.length-1) -> (dataset.length-1)*step
    let new_step = getPreferredStep(data_array.length)
    if (step == new_step) {
        if (datasetMinFitness.data.length*step < data_array.length) {
            let last_entry = data_array[data_array.length - 1]
            addEntry(last_entry)
        }
    } else {
        // fully rebuild structure
        step = new_step
        clearArray(datasetMinFitness.data)
        clearArray(datasetAvgFitness.data)
        clearArray(datasetMaxFitness.data)
        clearArray(labels)
        for (let k = 0; k*step < data_array.length; k++) {
            addEntry(data_array[k*step])
        }
    }
}
  
function create_lab1() {
    let L = Number(input_L.value)
    let N = Number(input_N.value)
    let pc = Number(input_pc.value)
    let pm = Number(input_pm.value)
    lab1 = new Lab1(-5, 5, L, N, pc, pm)
    lab1.register_data_update_callback(lab1_data_callback)
    lab1.prepare()
    clearArray(datasetMinFitness.data)
    clearArray(datasetAvgFitness.data)
    clearArray(datasetMaxFitness.data)
    clearArray(labels)
    chart.update()

    input_L.onchange = ev=>lab1.setL(Number(input_L.value))
    input_N.onchange = ev=>lab1.setN(Number(input_N.value))
    input_pc.onchange = ev=>lab1.setPC(Number(input_pc.value))
    input_pm.onchange = ev=>lab1.setPM(Number(input_pm.value))
    range_N.onchange = ev=>lab1.setN(Number(range_N.value))
    range_L.onchange = ev=>lab1.setL(Number(range_L.value))
    range_pc.onchange = ev=>lab1.setPC(Number(range_pc.value))
    range_pm.onchange = ev=>lab1.setPM(Number(range_pm.value))
}
create_lab1();

function step_lab1() {
    range_L.disabled = true
    input_L.disabled = true
    lab1.step()
    chart.update()
}
function run_lab1() {
    range_L.disabled = true
    input_L.disabled = true
    lab1.run()
    chart.update()
}

var button_prev_value = btn_continuous_run.value;
function run_continuously_lab1() {
    for (let k = 0; k < 10*step; k++)
        if (!lab1.condition_satisfied()) {
            step_lab1()
        } else {
            running = false
            btn_continuous_run.value = button_prev_value
            break
        }
}
function run_continuously_wrap() {
    if (running) {
        running = false
        btn_continuous_run.value = button_prev_value
    } else {
        running = true
        range_L.disabled = true
        input_L.disabled = true
        btn_continuous_run.value = "Пауза"
        run_continuously_lab1()
    }
}
function reset_lab1() {
    running = false
    range_L.disabled = false
    input_L.disabled = false
    lab1.reset()
    lab1.prepare()
    clearArray(datasetMinFitness.data)
    clearArray(datasetAvgFitness.data)
    clearArray(datasetMaxFitness.data)
    clearArray(labels)
    chart.update()
}

create_lab1();
btn_step.onclick = step_lab1;
btn_run.onclick = run_lab1;
btn_continuous_run.onclick = run_continuously_wrap;
btn_reset.onclick = reset_lab1;