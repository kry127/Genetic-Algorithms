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
add = function() { }
add.prototype = new node_binary()
add.prototype.eval = function(vars) {
    return this.lhs.eval(vars) + this.rhs.eval(vars)
}

sub = function() { }
sub.prototype = new node_binary()
sub.prototype.eval = function(vars) {
    return this.lhs.eval(vars) - this.rhs.eval(vars)
}

mul = function() { }
mul.prototype = new node_binary()
mul.prototype.eval = function(vars) {
    return this.lhs.eval(vars) * this.rhs.eval(vars)
}

div = function() { }
div.prototype = new node_binary()
div.prototype.eval = function(vars) {
    return this.lhs.eval(vars) / this.rhs.eval(vars)
}

pow = function() { }
pow.prototype = new node_binary()
pow.prototype.eval = function(vars) {
    return Math.pow(this.lhs.eval(vars), this.rhs.eval(vars))
}

// definition of unary nodes
abs = function() { }
abs.prototype = new node_unary()
abs.prototype.eval = function(vars) {
    return Math.abs(this.arg.eval(vars))
}

sin = function() { }
sin.prototype = new node_unary()
sin.prototype.eval = function(vars) {
    return Math.sin(this.arg.eval(vars))
}

cos = function() { }
cos.prototype = new node_unary()
cos.prototype.eval = function(vars) {
    return Math.cos(this.arg.eval(vars))
}

exp = function() { }
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
        root.lhs.parent = root
        root.rhs.parent = root
    } else if (root instanceof node_unary) {
        root.arg = growTree(height - 1, variable_count, full);
        root.arg.parent = root
    }
    return root
}

isLeaf = function(root) {return root instanceof variable || root instanceof constant}

/*
 * tree -- tree to mutate
 * probability -- of level mutation
 * variable_count
 * full -- are generated subtrees will be full height?
 */
treeMutation = function (tree, probability, variable_count, full = true) {
    if (Math.random() < probability) {
        return growTree(tree.height, variable_count, full)
    } else {
        if (isLeaf(tree)) return tree
        if (tree instanceof node_unary) {
            tree.arg = treeMutation(tree.arg, probability, variable_count, full)
        } else {
            if (Math.random() < 0.5) {
                tree.lhs = treeMutation(tree.lhs, probability, variable_count, full)
            } else {
                tree.rhs = treeMutation(tree.rhs, probability, variable_count, full)
            }
        }
        return tree
    }
}

treeCrossingover = function (tree1, tree2, probability) {
    if (!tree1 || !tree2) return false // nothing to do here (no crossingover happened)
    // if no parents, crossingover acts basically like swap, no action needed
    var level_crossover = tree1.parent && tree2.parent && Math.random() < probability
    if (level_crossover) {
        if (tree1.parent.lhs == tree1) {
            tree1.parent.lhs = tree2
        } else if (tree1.parent.rhs == tree1) {
            tree1.parent.rhs = tree2
        } else if (tree1.parent.arg == tree1) {
            tree1.parent.arg = tree2
        }
        if (tree2.parent.lhs == tree2) {
            tree2.parent.lhs = tree1
        } else if (tree2.parent.rhs == tree2) {
            tree2.parent.rhs = tree1
        } else if (tree2.parent.arg == tree2) {
            tree2.parent.arg = tree1
        }
        return true
    } else {
        // so, this is how looks like Cartessian product of code piece
        // TODO refactor needed (too risky to maintain this type of code)
        if (tree1 instanceof node_unary) {
            if (tree2 instanceof node_unary) {
                return treeCrossingover(tree1.arg, tree2.arg, probability)
            } else {
                if (Math.random() < 0.5) {
                    return treeCrossingover(tree1.arg, tree2.lhs, probability)
                } else {
                    return treeCrossingover(tree1.arg, tree2.rhs, probability)
                }
            }
        } else {
            if (Math.random() < 0.5) {
                if (tree2 instanceof node_unary) {
                    return treeCrossingover(tree1.lhs, tree2.arg, probability)
                } else {
                    if (Math.random() < 0.5) {
                        return treeCrossingover(tree1.lhs, tree2.lhs, probability)
                    } else {
                        return treeCrossingover(tree1.lhs, tree2.rhs, probability)
                    }
                }
            } else {
                if (tree2 instanceof node_unary) {
                    return treeCrossingover(tree1.rhs, tree2.arg, probability)
                } else {
                    if (Math.random() < 0.5) {
                        return treeCrossingover(tree1.rhs, tree2.lhs, probability)
                    } else {
                        return treeCrossingover(tree1.rhs, tree2.rhs, probability)
                    }
                }
            }
        }
    }
}

let max_err = 100000
function makeFitnessFunction(experimentalDataFunction, bounds, netcount) {
    return function(tree) {
        var x = new Array(...bounds.from)
        var sqrerror = 0
        var count = 0
        while (true) {
            var err = experimentalDataFunction(x) - tree.eval(x)
            // normalize value
            if (isNaN(err) || !isFinite(err) || Math.abs(err) > max_err) err = max_err
            
            sqrerror += err*err
            count++;
            // next value
            var k = 0;
            while(true) {
                if (k >= bounds.from.length)
                    return -Math.sqrt(sqrerror)
                x[k] += (bounds.to[k] - bounds.from[k])/netcount
                if (x[k] > bounds.to[k]) {
                    x[k] = bounds.from[k]
                    k++
                } else break
            }
        }
    }
}

function treeDeepcopy(tree) {
    var new_node
    if (tree instanceof constant) {
        new_node = new constant(tree.value)
    } else if (tree instanceof variable) {
        new_node = new variable(tree.var_index)
    } else if (tree instanceof add) {
        new_node = new add()
    } else if (tree instanceof sub) {
        new_node = new sub()
    } else if (tree instanceof mul) {
        new_node = new mul()
    } else if (tree instanceof div) {
        new_node = new div()
    } else if (tree instanceof pow) {
        new_node = new pow()
    } else if (tree instanceof abs) {
        new_node = new abs()
    } else if (tree instanceof sin) {
        new_node = new sin()
    } else if (tree instanceof cos) {
        new_node = new cos()
    } else if (tree instanceof exp) {
        new_node = new exp()
    } else
        throw new error("Not supported type of node")

    if (new_node instanceof node_unary) {
        new_node.arg = treeDeepcopy(tree.arg)
        new_node.arg.parent = new_node
    } else if (new_node instanceof node_binary) {
        new_node.lhs = treeDeepcopy(tree.lhs)
        new_node.lhs.parent = new_node
        new_node.rhs = treeDeepcopy(tree.rhs)
        new_node.rhs.parent = new_node
    }
    new_node.height = tree.height
    return new_node
}

function treeToString(tree) {
    if (tree instanceof constant) {
        return String(tree.value)
    } else if (tree instanceof variable) {
        return "x"+String(tree.var_index+1)
    } else if (tree instanceof add) {
        return treeToString(tree.lhs) + "+" + treeToString(tree.rhs)
    } else if (tree instanceof sub) {
        return treeToString(tree.lhs) + "-" + treeToString(tree.rhs)
    } else if (tree instanceof mul) {
        return "("+treeToString(tree.lhs) + ")*(" + treeToString(tree.rhs)+")"
    } else if (tree instanceof div) {
        return "("+treeToString(tree.lhs) + ")/(" + treeToString(tree.rhs)+")"
    } else if (tree instanceof pow) {
        return "("+treeToString(tree.lhs) + ")^(" + treeToString(tree.rhs)+")"
    } else if (tree instanceof abs) {
        return "|"+treeToString(tree.arg) + "|"
    } else if (tree instanceof sin) {
        return "sin("+treeToString(tree.arg) + ")"
    } else if (tree instanceof cos) {
        return "cos("+treeToString(tree.arg) + ")"
    } else if (tree instanceof exp) {
        return "exp("+treeToString(tree.arg) + ")"
    } else
        throw new error("Not supported type of node")
}

// tree mutation check
/*fEaso = function(x) {return -Math.cos(x[0])*Math.cos(x[1])*
    Math.exp(-(x[0] - Math.PI)*(x[0] - Math.PI) - (x[1] - Math.PI)*(x[1] - Math.PI))}
var fitness = makeFitnessFunction(fEaso, {from:[-100, -100], to:[100, 100]}, 5)

var H = 5
var L = 2
tree = growTree(H, L, true)
while (1) {
    tree = treeMutation(tree, 0.2, L, false)
    console.log("Fitness=" + fitness(tree))
}*/

// for export
if (typeof module !== "undefined") {
    module.exports = function() { 
        this.growTree = growTree
        this.treeMutation = treeMutation
        this.treeDeepcopy = treeDeepcopy
        this.treeCrossingover = treeCrossingover
        this.makeFitnessFunction = makeFitnessFunction
        this.treeToString = treeToString
    }
}