var node_proto = function() {};
node_proto.prototype.eval = function(vars) {
    return null;
}
node_proto.prototype.rhs = null
node_proto.prototype.lhs = null

function variable(index) {
    this.var_index = index
    this.rhs = null
    this.lhs = null
}
variable.prototype = new node_proto()
variable.prototype.eval = function(vars) {
    return vars[this.var_index]
}

function constant(value) {
    this.value = value
}
constant.prototype.eval = function(vars) {
    return this.value
}

function add() { }
add.prototype = new node_proto()
add.prototype.eval = function(vars) {
    return this.lhs.eval(vars) + this.rhs.eval(vars)
}

function sub() { }
sub.prototype = new node_proto()
sub.prototype.eval = function(vars) {
    return this.lhs.eval(vars) - this.rhs.eval(vars)
}

function mul() { }
mul.prototype = new node_proto()
mul.prototype.eval = function(vars) {
    return this.lhs.eval(vars) * this.rhs.eval(vars)
}

function div() { }
div.prototype = new node_proto()
div.prototype.eval = function(vars) {
    return this.lhs.eval(vars) / this.rhs.eval(vars)
}

function abs() { }
abs.prototype = new node_proto()
abs.prototype.eval = function(vars) {
    return Math.abs(this.lhs.eval(vars))
}

function sin() { }
sin.prototype = new node_proto()
sin.prototype.eval = function(vars) {
    return Math.sin(this.lhs.eval(vars))
}

function cos() { }
cos.prototype = new node_proto()
cos.prototype.eval = function(vars) {
    return Math.cos(this.lhs.eval(vars))
}

function exp() { }
exp.prototype = new node_proto()
exp.prototype.eval = function(vars) {
    return Math.exp(this.lhs.eval(vars))
}

function pow() { }
pow.prototype = new node_proto()
pow.prototype.eval = function(vars) {
    return Math.pow(this.lhs.eval(vars), this.rhs.eval(vars))
}

nodex = new variable(0)
nodey = new variable(1)
node1 = new add()
node2 = new sub()
node1.lhs = nodex
node1.rhs = nodey
node2.lhs = nodex
node2.rhs = nodey
node3 = new mul()
node3.lhs = node1
node3.rhs = node2
node4 = new pow()
node4.lhs = node3
node4.rhs = new constant(3)

var res = node4.eval([2, 1])
var nop = null