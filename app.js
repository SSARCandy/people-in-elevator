// set up SVG for D3
var width  = 300,
    height = 300,
    radius = 30,
    colors = d3.scale.category10();

var svg = d3.select('body')
  .append('svg')
  .attr('class', 'elevator')
  .attr('oncontextmenu', 'return false;')
  .attr('width', width)
  .attr('height', height);

var nodes = [
    {id: 0},
    {id: 1},
    {id: 2}
  ];
var lastNodeId = 2;

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .size([width, height])
    .charge(-20000)
    .gravity(0.5)
    .on('tick', tick)


var circle = svg.append('svg:g').selectAll('g');

// mouse event vars
var selected_node = null,
    mousedown_node = null,
    mouseup_node = null;

function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
}

// update force layout (called automatically each iteration)
function tick() {
  var q = d3.geom.quadtree(nodes),
      i = 0,
      n = nodes.length;
  
  for (var idx=0; idx < nodes.length; idx++) {
      nodes[idx].x = boundingBox('x', nodes[idx].x);
      nodes[idx].y = boundingBox('y', nodes[idx].y);
  }

  while (++i < n) q.visit(collide(nodes[i]));

  circle.attr('transform', function(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  });
}

// update graph (called when needed)
function restart() {
  // circle (node) group
  // NB: the function arg is crucial here! nodes are known by id, not by index!
  circle = circle.data(nodes, function(d) { return d.id; });

  circle.selectAll('circle')
    .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); });

  // add new nodes
  var g = circle.enter().append('svg:g');

  g.append('svg:circle')
    .attr('class', 'node')
    .attr('r', radius)
    .style('fill', function(d) { return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id); })
    .style('stroke', function(d) { return d3.rgb(colors(d.id)).darker().toString(); })
    .on('mouseover', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // enlarge target node
      d3.select(this).attr('transform', 'scale(1.1)');
    })
    .on('mouseout', function(d) {
      if(!mousedown_node || d === mousedown_node) return;
      // unenlarge target node
      d3.select(this).attr('transform', '');
    })
    .on('mousedown', function(d) {
      if(d3.event.ctrlKey) return;

      // select node
      mousedown_node = d;
      if(mousedown_node === selected_node) selected_node = null;
      else selected_node = mousedown_node;

      restart();
    })
    .on('mouseup', function(d) {
      if(!mousedown_node) return;

      // unenlarge target node
      d3.select(this).attr('transform', '');

      restart();
    });

  // show node IDs
  g.append('svg:text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .text(function(d) { return d.id; });

  // remove old nodes
  circle.exit().remove();

  // set the graph in motion
  force.start();
}

function mousedown() {
  if(d3.event.ctrlKey || mousedown_node) return;

  // insert new node at point
  var point = d3.mouse(this),
      node = {id: ++lastNodeId};
  node.x = width/2;
  node.y = height/2;
  nodes.push(node);

  restart();
}

function mouseup() {
  svg.classed('active', false);
  resetMouseVars();
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
  d3.event.preventDefault();

  if(lastKeyDown !== -1) return;
  lastKeyDown = d3.event.keyCode;

  circle.call(force.drag);
  svg.classed('ctrl', true);

  if(!selected_node) return;
  switch(d3.event.keyCode) {
    case 8: // backspace
    case 46: // delete
      nodes.splice(nodes.indexOf(selected_node), 1);
      selected_node = null;
      restart();
      break;
  }
}

function keyup() {
  lastKeyDown = -1;

  circle
    .on('mousedown.drag', null)
    .on('touchstart.drag', null);
  svg.classed('ctrl', false);
}

function boundingBox(type, value) {
    if (type === 'x') {
        return Math.max(radius, Math.min(width - radius, value));
    } else {
        return Math.max(radius, Math.min(height - radius, value));        
    }
}

function collide(node) {
  var r = radius,
      nx1 = node.x - r,
      nx2 = node.x + r,
      ny1 = node.y - r,
      ny2 = node.y + r;
  return function(quad, x1, y1, x2, y2) {
    if (quad.point && (quad.point !== node)) {
      var x = node.x - quad.point.x,
          y = node.y - quad.point.y,
          l = Math.sqrt(x * x + y * y),
          r = radius *2;
      if (l < r) {
        l = (l - r) / l * .5;
        node.x -= x *= l;
        node.y -= y *= l;
        quad.point.x += x;
        quad.point.y += y;
      }
    }
    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
  };
}

// app starts here
svg.on('mousedown', mousedown)
  .on('mouseup', mouseup);
d3.select(window)
  .on('keydown', keydown)
  .on('keyup', keyup);

restart();