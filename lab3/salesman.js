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