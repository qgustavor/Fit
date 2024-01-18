// Modified from https://github.com/vrd/js-intersect/blob/6cb1003f6537a765eaa036eebf30ef04352f64f0/solution.js

export function intersect (fig1, fig2) {
  for (let i = 0; i < fig1.length; i++) {
    fig1[i].x = +((fig1[i].x).toFixed(9))
    fig1[i].y = +((fig1[i].y).toFixed(9))
  }
  for (let i = 0; i < fig2.length; i++) {
    fig2[i].x = +((fig2[i].x).toFixed(9))
    fig2[i].y = +((fig2[i].y).toFixed(9))
  }
  const fig2a = alignPolygon(fig2, fig1)
  if (!checkPolygons(fig1, fig2a)) {
    return false
  }
  const edges = edgify(fig1, fig2a)
  const polygons = polygonate(edges)
  const filteredPolygons = filterPolygons(polygons, fig1, fig2a, 'intersect')
  return filteredPolygons
}

export function alignPolygon (polygon, points) {
  for (let i = 0; i < polygon.length; i++) {
    for (let j = 0; j < points.length; j++) {
      if (distance(polygon[i], points[j]) < 0.00000001) { polygon[i] = points[j] }
    }
  }
  return polygon
}

export function distance (p1, p2) {
  const dx = Math.abs(p1.x - p2.x)
  const dy = Math.abs(p1.y - p2.y)
  return Math.sqrt(dx * dx + dy * dy)
}

// check polygons for correctness
export function checkPolygons (fig1, fig2) {
  const figs = [fig1, fig2]
  for (let i = 0; i < figs.length; i++) {
    if (figs[i].length < 3) {
      return false
    }
  }
  return true
}

// create array of edges of all polygons
export function edgify (fig1, fig2) {
  // create primary array from all edges
  const primEdges = getEdges(fig1).concat(getEdges(fig2))
  const secEdges = []
  // check every edge
  for (let i = 0; i < primEdges.length; i++) {
    let points = []
    // for intersection with every edge except itself
    for (let j = 0; j < primEdges.length; j++) {
      if (i !== j) {
        const interPoints = findEdgeIntersection(primEdges[i], primEdges[j])
        addNewPoints(interPoints, points)
      }
    }
    // add start and end points to intersection points
    const startPoint = primEdges[i][0]
    startPoint.t = 0
    const endPoint = primEdges[i][1]
    endPoint.t = 1
    addNewPoints([startPoint, endPoint], points)
    // sort all points by position on edge
    points = sortPoints(points)
    // break edge to parts
    for (let k = 0; k < points.length - 1; k++) {
      const edge = [
        { x: points[k].x, y: points[k].y },
        { x: points[k + 1].x, y: points[k + 1].y }
      ]
      // check for existanse in sec.array
      if (!edgeExists(edge, secEdges)) {
        // push if not exists
        secEdges.push(edge)
      }
    }
  }
  return secEdges
}

export function addNewPoints (newPoints, points) {
  if (newPoints.length > 0) {
    // check for uniqueness
    for (let k = 0; k < newPoints.length; k++) {
      if (!pointExists(newPoints[k], points)) {
        points.push(newPoints[k])
      }
    }
  }
}

export function sortPoints (points) {
  const p = points
  p.sort((a, b) => {
    if (a.t > b.t) return 1
    if (a.t < b.t) return -1
    return 0
  })
  return p
}

export function getEdges (fig) {
  const edges = []
  const len = fig.length
  for (let i = 0; i < len; i++) {
    edges.push([
      { x: fig[(i % len)].x, y: fig[(i % len)].y },
      { x: fig[((i + 1) % len)].x, y: fig[((i + 1) % len)].y }
    ])
  }
  return edges
}

export function findEdgeIntersection (edge1, edge2) {
  const x1 = edge1[0].x
  const x2 = edge1[1].x
  const x3 = edge2[0].x
  const x4 = edge2[1].x
  const y1 = edge1[0].y
  const y2 = edge1[1].y
  const y3 = edge2[0].y
  const y4 = edge2[1].y
  const nom1 = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)
  const nom2 = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  const t1 = nom1 / denom
  const t2 = nom2 / denom
  const interPoints = []

  if (((denom === 0) && (nom1 !== 0)) || (t1 <= 0) || (t1 >= 1) || (t2 < 0) || (t2 > 1)) {
    // 1. lines are parallel or edges don't intersect
    return interPoints
  } else if ((nom1 === 0) && (denom === 0)) {
    // 2. lines are collinear

    // check if endpoints of edge2 lies on edge1
    for (let i = 0; i < 2; i++) {
      const classify = classifyPoint(edge2[i], edge1)
      // find position of this endpoints relatively to edge1
      if (classify.loc === 'ORIGIN' || classify.loc === 'DESTINATION') {
        interPoints.push({ x: edge2[i].x, y: edge2[i].y, t: classify.t })
      } else if (classify.loc === 'BETWEEN') {
        const x = +((x1 + classify.t * (x2 - x1)).toFixed(9))
        const y = +((y1 + classify.t * (y2 - y1)).toFixed(9))
        interPoints.push({ x, y, t: classify.t })
      }
    }
    return interPoints
  } else {
    // 3. edges intersect
    for (let i = 0; i < 2; i++) {
      const classify = classifyPoint(edge2[i], edge1)
      if (classify.loc === 'ORIGIN' || classify.loc === 'DESTINATION') {
        interPoints.push({ x: edge2[i].x, y: edge2[i].y, t: classify.t })
      }
    }
    if (interPoints.length > 0) {
      return interPoints
    }
    const x = +((x1 + t1 * (x2 - x1)).toFixed(9))
    const y = +((y1 + t1 * (y2 - y1)).toFixed(9))
    interPoints.push({ x, y, t: t1 })
    return interPoints
  }
}

export function classifyPoint (p, edge) {
  const ax = edge[1].x - edge[0].x
  const ay = edge[1].y - edge[0].y
  const bx = p.x - edge[0].x
  const by = p.y - edge[0].y
  const sa = ax * by - bx * ay
  if ((p.x === edge[0].x) && (p.y === edge[0].y)) {
    return { loc: 'ORIGIN', t: 0 }
  }
  if ((p.x === edge[1].x) && (p.y === edge[1].y)) {
    return { loc: 'DESTINATION', t: 1 }
  }
  let theta = (polarAngle([edge[1], edge[0]]) -
    polarAngle([{ x: edge[1].x, y: edge[1].y }, { x: p.x, y: p.y }])) % 360
  if (theta < 0) {
    theta = theta + 360
  }
  if (sa < -0.000000001) {
    return { loc: 'LEFT', theta }
  }
  if (sa > 0.000000001) {
    return { loc: 'RIGHT', theta }
  }
  if (((ax * bx) < 0) || ((ay * by) < 0)) {
    return { loc: 'BEHIND', theta }
  }
  if ((Math.sqrt(ax * ax + ay * ay)) < (Math.sqrt(bx * bx + by * by))) {
    return { loc: 'BEYOND', theta }
  }
  let t
  if (ax !== 0) {
    t = bx / ax
  } else {
    t = by / ay
  }
  return { loc: 'BETWEEN', t }
}

export function polarAngle (edge) {
  const dx = edge[1].x - edge[0].x
  const dy = edge[1].y - edge[0].y
  if ((dx === 0) && (dy === 0)) {
    return false
  }
  if (dx === 0) {
    return ((dy > 0) ? 90 : 270)
  }
  if (dy === 0) {
    return ((dx > 0) ? 0 : 180)
  }
  const theta = Math.atan(dy / dx) * 360 / (2 * Math.PI)
  if (dx > 0) {
    return ((dy >= 0) ? theta : theta + 360)
  } else {
    return (theta + 180)
  }
}

export function pointExists (p, points) {
  if (points.length === 0) {
    return false
  }
  for (let i = 0; i < points.length; i++) {
    if ((p.x === points[i].x) && (p.y === points[i].y)) {
      return true
    }
  }
  return false
}

export function edgeExists (e, edges) {
  if (edges.length === 0) {
    return false
  }
  for (let i = 0; i < edges.length; i++) {
    if (equalEdges(e, edges[i])) { return true }
  }
  return false
}

export function equalEdges (edge1, edge2) {
  if (((edge1[0].x === edge2[0].x) &&
      (edge1[0].y === edge2[0].y) &&
      (edge1[1].x === edge2[1].x) &&
      (edge1[1].y === edge2[1].y)) || (
    (edge1[0].x === edge2[1].x) &&
      (edge1[0].y === edge2[1].y) &&
      (edge1[1].x === edge2[0].x) &&
      (edge1[1].y === edge2[0].y))) {
    return true
  } else {
    return false
  }
}

export function polygonate (edges) {
  const polygons = []
  let polygon = []
  const len = edges.length
  const midpoints = getMidpoints(edges)
  // start from every edge and create non-selfintersecting polygons
  for (let i = 0; i < len - 2; i++) {
    const org = { x: edges[i][0].x, y: edges[i][0].y }
    const dest = { x: edges[i][1].x, y: edges[i][1].y }
    let currentEdge = i
    let point
    let p
    let direction
    let stop
    // while we haven't come to the starting edge again
    for (direction = 0; direction < 2; direction++) {
      polygon = []
      stop = false
      while ((polygon.length === 0) || (!stop)) {
      // add point to polygon
        polygon.push({ x: org.x, y: org.y })
        point = undefined
        // look for edge connected with end of current edge
        for (let j = 0; j < len; j++) {
          p = undefined
          // except itself
          if (!equalEdges(edges[j], edges[currentEdge])) {
            // if some edge is connected to current edge in one endpoint
            if ((edges[j][0].x === dest.x) && (edges[j][0].y === dest.y)) {
              p = edges[j][1]
            }
            if ((edges[j][1].x === dest.x) && (edges[j][1].y === dest.y)) {
              p = edges[j][0]
            }
            // compare it with last found connected edge for minimum angle between itself and current edge
            if (p) {
              const classify = classifyPoint(p, [org, dest])
              // if this edge has smaller theta then last found edge update data of next edge of polygon
              if (!point ||
                  ((classify.theta < point.theta) && (direction === 0)) ||
                  ((classify.theta > point.theta) && (direction === 1))) {
                point = { x: p.x, y: p.y, theta: classify.theta, edge: j }
              }
            }
          }
        }
        // change current edge to next edge
        org.x = dest.x
        org.y = dest.y
        dest.x = point.x
        dest.y = point.y
        currentEdge = point.edge
        // if we reach start edge
        if (equalEdges([org, dest], edges[i])) {
          stop = true
          // check polygon for correctness
          /* for (let k = 0; k < allPoints.length; k++) {
            //if some point is inside polygon it is incorrect
            if ((!pointExists(allPoints[k], polygon)) && (findPointInsidePolygon(allPoints[k], polygon))) {
              polygon = false;
            }
          } */
          for (let k = 0; k < midpoints.length; k++) {
            // if some midpoint is inside polygon (edge inside polygon) it is incorrect
            if (findPointInsidePolygon(midpoints[k], polygon)) {
              polygon = false
            }
          }
        }
      }
      // add created polygon if it is correct and was not found before
      if (polygon && !polygonExists(polygon, polygons)) {
        polygons.push(polygon)
      }
    }
  }
  return polygons
}

export function polygonExists (polygon, polygons) {
  // if array is empty element doesn't exist in it
  if (polygons.length === 0) return false
  // check every polygon in array
  for (let i = 0; i < polygons.length; i++) {
    // if lengths are not same go to next element
    if (polygon.length !== polygons[i].length) continue
    // if length are same need to check
    else {
      // if all the points are same
      for (let j = 0; j < polygon.length; j++) {
        // if point is not found break forloop and go to next element
        if (!pointExists(polygon[j], polygons[i])) break
        // if point found
        else {
          // and it is last point in polygon we found polygon in array!
          if (j === polygon.length - 1) return true
        }
      }
    }
  }
  return false
}

export function filterPolygons (polygons, fig1, fig2, mode) {
  const filtered = []
  let c1, c2
  let point
  const bigPolygons = removeSmallPolygons(polygons, 0.0001)
  for (let i = 0; i < bigPolygons.length; i++) {
    point = getPointInsidePolygon(bigPolygons[i])
    c1 = findPointInsidePolygon(point, fig1)
    c2 = findPointInsidePolygon(point, fig2)
    if (
      ((mode === 'intersect') && c1 && c2) || // intersection
        ((mode === 'cut1') && c1 && !c2) || // fig1 - fig2
        ((mode === 'cut2') && !c1 && c2) || // fig2 - fig2
        ((mode === 'sum') && (c1 || c2))) { // fig1 + fig2
      filtered.push(bigPolygons[i])
    }
  }
  return filtered
}

export function removeSmallPolygons (polygons, minSize) {
  const big = []
  for (let i = 0; i < polygons.length; i++) {
    if (polygonArea(polygons[i]) >= minSize) {
      big.push(polygons[i])
    }
  }
  return big
}

export function polygonArea (p) {
  const len = p.length
  let s = 0
  for (let i = 0; i < len; i++) {
    s += (p[i % len].x * p[(i + 1) % len].y) - (p[i % len].y *
      p[(i + 1) % len].x)
  }
  return Math.abs(s / 2)
}

export function getPointInsidePolygon (polygon) {
  let point
  const size = getSize(polygon)
  const edges = getEdges(polygon)
  let y = size.y.min + (size.y.max - size.y.min) / Math.PI
  const dy = (size.y.max - size.y.min) / 13
  let line = []
  let points
  let interPoints = []
  let pointsOK = false
  while (!pointsOK) {
    line = [{ x: (size.x.min - 1), y }, { x: (size.x.max + 1), y }]
    // find intersections with all polygon edges
    for (let i = 0; i < edges.length; i++) {
      points = findEdgeIntersection(line, edges[i])
      // if edge doesn't lie inside line
      if (points && (points.length === 1)) {
        interPoints.push(points[0])
      }
    }
    interPoints = sortPoints(interPoints)
    // find two correct interpoints
    for (let i = 0; i < interPoints.length - 1; i++) {
      if (interPoints[i].t !== interPoints[i + 1].t) {
        // enable exit from loop and calculate point coordinates
        pointsOK = true
        point = { x: ((interPoints[i].x + interPoints[i + 1].x) / 2), y }
      }
    }
    // all points are incorrect, need to change line parameters
    y = y + dy
    if (((y > size.y.max) || (y < size.y.min)) && (pointsOK === false)) {
      pointsOK = true
      point = undefined
    }
  }
  return point
}

export function getSize (polygon) {
  const size = {
    x: {
      min: polygon[0].x,
      max: polygon[0].x
    },
    y: {
      min: polygon[0].y,
      max: polygon[0].y
    }
  }
  for (let i = 1; i < polygon.length; i++) {
    if (polygon[i].x < size.x.min) size.x.min = polygon[i].x
    if (polygon[i].x > size.x.max) size.x.max = polygon[i].x
    if (polygon[i].y < size.y.min) size.y.min = polygon[i].y
    if (polygon[i].y > size.y.max) size.y.max = polygon[i].y
  }
  return size
}

export function findPointInsidePolygon (point, polygon) {
  let cross = 0
  const edges = getEdges(polygon)
  let classify
  let org, dest
  for (let i = 0; i < edges.length; i++) {
    ;[org, dest] = edges[i]
    classify = classifyPoint(point, [org, dest])
    if ((
      (classify.loc === 'RIGHT') &&
            (org.y < point.y) &&
            (dest.y >= point.y)
    ) ||
          (
            (classify.loc === 'LEFT') &&
            (org.y >= point.y) &&
            (dest.y < point.y)
          )
    ) {
      cross++
    }
    if (classify.loc === 'BETWEEN') return false
  }
  return !!(cross % 2)
}

export function getMidpoints (edges) {
  const midpoints = []
  let x, y
  for (let i = 0; i < edges.length; i++) {
    x = (edges[i][0].x + edges[i][1].x) / 2
    y = (edges[i][0].y + edges[i][1].y) / 2
    midpoints.push({ x, y })
  }
  return midpoints
}
