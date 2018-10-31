// definition of unary tree node
node_unary = function() {};
node_unary.prototype.eval = function(vars) {
    return null;
}
node_unary.prototype.arg = null

// definition of binary tree node
node_binary = function() {};
node_binary.prototype.eval = function(vars) {
    return null;
}
node_binary.prototype.lhs = null
node_binary.prototype.rhs = null

// definition of leaf variable
variable = function (index) {
    this.var_index = index
}
variable.prototype = new node_binary()
variable.prototype.eval = function(vars) {
    return vars[this.var_index]
}

// definition of leaf constant
constant = function(value) {
    this.value = value
}
constant.prototype.eval = function(vars) {
    return this.value
}

// definition of binary nodes
function add() { }
add.prototype = new node_binary()
add.prototype.eval = function(vars) {
    return this.lhs.eval(vars) + this.rhs.eval(vars)
}

function sub() { }
sub.prototype = new node_binary()
sub.prototype.eval = function(vars) {
    return this.lhs.eval(vars) - this.rhs.eval(vars)
}

function mul() { }
mul.prototype = new node_binary()
mul.prototype.eval = function(vars) {
    return this.lhs.eval(vars) * this.rhs.eval(vars)
}

function div() { }
div.prototype = new node_binary()
div.prototype.eval = function(vars) {
    return this.lhs.eval(vars) / this.rhs.eval(vars)
}

function pow() { }
pow.prototype = new node_binary()
pow.prototype.eval = function(vars) {
    return Math.pow(this.lhs.eval(vars), this.rhs.eval(vars))
}

// definition of unary nodes
function abs() { }
abs.prototype = new node_unary()
abs.prototype.eval = function(vars) {
    return Math.abs(this.arg.eval(vars))
}

function sin() { }
sin.prototype = new node_unary()
sin.prototype.eval = function(vars) {
    return Math.sin(this.arg.eval(vars))
}

function cos() { }
cos.prototype = new node_unary()
cos.prototype.eval = function(vars) {
    return Math.cos(this.arg.eval(vars))
}

function exp() { }
exp.prototype = new node_unary()
exp.prototype.eval = function(vars) {
    return Math.exp(this.arg.eval(vars))
}

// function that returns random node
node_list = [add, sub, mul, div, pow, abs, sin, cos, exp]
leaf_list = [variable, constant]
node_leaf_list = node_list.concat(leaf_list)
// utility stuff
Array.prototype.random = function() {
    return this[Math.floor(Math.random()*this.length)]
}
// use as this:
// node_list.random()

// grows tree randomly, returns root
function growTree(height, variable_count, full=true) {
    if (height < 1) throw new error("Unexpected parameter of height")
    var root_constructor = height == 1 ? leaf_list.random()
                                : full ? node_list.random()
                                :        node_leaf_list.random()
    var root = new root_constructor()
    root.height = height // remember height just in case
    if (leaf_list.indexOf(root_constructor) != -1) {
        if (root instanceof variable)
            root.var_index = Math.floor(Math.random()*variable_count)
        else
            root.value = 2*(Math.random() - 0.5)
        return root
    }
    // recursion
    if (root instanceof node_binary) {
        root.lhs = growTree(height - 1, variable_count, full);
        root.rhs = growTree(height - 1, variable_count, full);
    } else if (root instanceof node_unary) {
        root.arg = growTree(height - 1, variable_count, full);
    }
    return root
}
tree = growTree(4, 2)

