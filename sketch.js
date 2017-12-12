//

var can_draw = true;
var global_strokes = []
var connections = []

var sketchpad = Raphael.sketchpad("editor", {
    width: 800,
    height: 800,
    editing: true
});
var r = sketchpad.paper()
var paper = sketchpad.paper()

var shapes = [
    r.ellipse(190, 100, 30, 20),
    r.rect(290, 80, 60, 40, 10),
    r.rect(290, 180, 60, 40, 2),
    r.ellipse(450, 100, 20, 20)
             ];

function create_circle(x, y, radius) {
    var color = Raphael.getColor();
    s = r.circle(x, y, radius)
    s.attr({fill: color, stroke: color, "fill-opacity": 0, "stroke-width": 2, cursor: "move"});
    s.drag(move, dragger, up);
    shapes.push(s)
    return s
}

function add_edge(a, b) {
    connections.push(r.connection(a, b, "#000", "#000"));
}

for (s of shapes) {
    var color = Raphael.getColor();
    s.attr({fill: color, stroke: color, "fill-opacity": 0, "stroke-width": 2, cursor: "move"});
    s.drag(move, dragger, up);
}
add_edge(shapes[0], shapes[1])
add_edge(shapes[1], shapes[2])
add_edge(shapes[1], shapes[3])


function clear_strokes() {
    for (stroke of global_strokes) {
        stroke.remove()
    }
    sketchpad.strokes().length = 0
}

function add_circle(points) {
    minx = Infinity
    miny = Infinity
    maxx = 0
    maxy = 0
    for (stroke of points) {
        for (point of stroke) {
            x = point[0]
            y = point[1]
            minx = Math.min(x, minx)
            miny = Math.min(y, miny)
            maxx = Math.max(x, maxx)
            maxy = Math.max(y, maxy)
        }
    }
    x = (minx + maxx) / 2
    y = (miny + maxy) / 2
    radius = (maxx - minx) / 2
    create_circle(x, y, radius)
}

function stroke_to_points(stroke) {
    var path = stroke.path;
    var points = path.split(/(?=[LMC])/)
    var result = []
    for (point of points) {
        point = point.slice(1).split(',')
        point[0] = parseInt(point[0])
        point[1] = parseInt(point[1])
        result.push(point)
    }
    return result
}

function get_paths(sketchpad) {
    paths = []
    for (stroke of sketchpad.strokes()) {
        points = stroke_to_points(stroke)
        paths.push(points)
    }
    return paths
}

function detect_edges() {
    for (x = 0; x < shapes.length; x++) {
        for (y = x + 1; y < shapes.length; y++) {
            if (Raphael.PathIntersection(shapes[x].getPath(), shapes[y].getPath()))
            {
            }
    }
    }
}
function get_intersections(shape, include_lines) {
    path = shape.getPath()
    all_intersections = []
    all_shapes = shapes
    if (include_lines){
      all_shapes = all_shapes.concat(connections.map(x => x.bg))
      all_shapes = all_shapes.concat(connections.map(x => x.line))
    }
    for (target_shape of all_shapes) {
        if (shape == target_shape) {
            continue
        } else {
            intersections = Raphael.pathIntersection(target_shape.getPath(), path)
            if (intersections.length) {
                all_intersections.push(target_shape)
            }
        }
    }
    return all_intersections
}

function paths_to_pdollar(paths) {
    pointset = []
    for (path_id in paths) {
        path = paths[path_id]
        for (point of path) {
        pointset.push(new Point(x=point[0], y=point[1], id=path_id))
    }
    }
    return pointset
}
function points(points) {
    result = []
    for (point of points) {
        result.push('new Point(' + [point.X, point.Y, point.ID].join(', ') + ')')
    }
    return '[' + result.join(', ') + ']'
}

// When the sketchpad changes, update the input field.
sketchpad.change(function() {
    $("#data").val(sketchpad.json());
    points = get_paths(sketchpad);
    pdollar = paths_to_pdollar(points)
    shape = R.Recognize(pdollar)
    console.log(JSON.stringify(points))
    console.log(shape)
    if (shape.Name == 'circle') {
        add_circle(points)
    } else if (shape.Name == 'scratch') {
        intersections = get_intersections(global_strokes[global_strokes.length - 1],
                                         true)
        for (shape of intersections) {
            shape.remove()
        }
   } else if (points.length) {
       intersections = get_intersections(global_strokes[global_strokes.length - 1],
                                         false)
       if (intersections.length == 2) {
           add_edge(intersections[0], intersections[1])
       }
   }
    clear_strokes()
});

R = new PDollarRecognizer()
